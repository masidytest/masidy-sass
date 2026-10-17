import { HttpError, fail, requireProject } from "@/lib/auth";
import { admin } from "@/lib/supabase/server";
import { supabaseManagementRequest } from "@/lib/supabase-mgmt";
import { z } from "zod";

const nameSchema = z.object({ name: z.string().trim().min(2).max(48) });
const deleteSchema = z.object({ confirmation: z.string().min(1) });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { project } = await requireProject(id, ["owner", "admin"]);
    const { name } = nameSchema.parse(await req.json());
    const { data, error } = await admin().from("projects")
      .update({ name }).eq("id", id).eq("org_id", project.org_id).select("id, name").single();
    if (error) throw error;
    return Response.json({ project: data });
  } catch (e) { return fail(e); }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { project } = await requireProject(id, ["owner"]);
    const { confirmation } = deleteSchema.parse(await req.json());
    if (confirmation !== project.name) throw new HttpError(400, "Project name confirmation did not match");

    const db = admin();
    const [domains, orders, emailDomain] = await Promise.all([
      db.from("project_domains").select("id", { count: "exact", head: true }).eq("project_id", id),
      db.from("domain_orders").select("id", { count: "exact", head: true }).eq("project_id", id),
      db.from("email_domains").select("project_id", { count: "exact", head: true }).eq("project_id", id),
    ]);
    const relatedError = domains.error ?? orders.error ?? emailDomain.error;
    if (relatedError) throw relatedError;
    if ((domains.count ?? 0) > 0 || (orders.count ?? 0) > 0 || (emailDomain.count ?? 0) > 0) {
      throw new HttpError(409, "Remove or transfer this project's domains and email integration before deleting it.");
    }

    if (project.supabase_ref) {
      await supabaseManagementRequest<void>(`/projects/${encodeURIComponent(project.supabase_ref)}`, { method: "DELETE" });
    }
    const { error: deleteError } = await db.from("projects").delete()
      .eq("id", id).eq("org_id", project.org_id);
    if (deleteError) {
      throw new Error(`The Supabase project was deleted, but its Masidy record could not be removed: ${deleteError.message}`);
    }
    return Response.json({ ok: true });
  } catch (e) { return fail(e); }
}
