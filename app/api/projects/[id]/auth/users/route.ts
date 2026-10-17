import { requireProject, fail } from "@/lib/auth";
import { customerProjectAdmin } from "@/lib/supabase-mgmt";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { project } = await requireProject((await params).id, ["owner", "admin", "developer"]);
    if (!project.supabase_ref) return Response.json({ error: "Project is still provisioning" }, { status: 409 });
    const { data, error } = await (await customerProjectAdmin(project.supabase_ref))
      .auth.admin.listUsers({ page: 1, perPage: 100 });
    if (error) throw error;
    return Response.json(data.users);
  } catch (e) { return fail(e); }
}
