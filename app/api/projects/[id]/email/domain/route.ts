import { Resend } from "resend";
import { z } from "zod";
import { requireProject, fail } from "@/lib/auth";
import { admin } from "@/lib/supabase/server";
import { env } from "@/lib/env";

const resend = new Resend(env.RESEND_API_KEY);
const body = z.object({ domain: z.string().regex(/^[a-z0-9-]+(\.[a-z0-9-]+)+$/) });

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { project } = await requireProject((await params).id, ["owner", "admin", "developer", "read_only"]);
    const { data: saved, error } = await admin().from("email_domains")
      .select("domain, resend_domain_id").eq("project_id", project.id).maybeSingle();
    if (error) throw new Error("Could not load the email domain");
    if (!saved) return Response.json({ domain: null });

    const { data, error: resendError } = await resend.domains.get(saved.resend_domain_id);
    if (resendError || !data) return Response.json({ error: "Could not load domain status from Resend" }, { status: 502 });
    if (data.status !== "not_started") {
      await admin().from("email_domains").update({ status: data.status }).eq("project_id", project.id);
    }
    return Response.json({ domain: data.name, status: data.status, records: data.records });
  } catch (e) { return fail(e); }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { project } = await requireProject((await params).id, ["owner", "admin"]);
    const { domain } = body.parse(await req.json());
    const db = admin();
    const { data: saved, error: lookupError } = await db.from("email_domains")
      .select("domain, resend_domain_id").eq("project_id", project.id).maybeSingle();
    if (lookupError) throw new Error("Could not check the current sending domain");
    if (saved) {
      if (saved.domain !== domain) return Response.json({ error: "Remove the existing sending domain before adding another" }, { status: 409 });
      const { data, error } = await resend.domains.get(saved.resend_domain_id);
      if (error || !data) return Response.json({ error: "Could not load domain status from Resend" }, { status: 502 });
      return Response.json({ domain: data.name, status: data.status, records: data.records });
    }

    const { data, error } = await resend.domains.create({ name: domain });
    if (error || !data) return Response.json({ error: "Could not add domain" }, { status: 502 });
    const { error: saveError } = await db.from("email_domains").insert({
      project_id: project.id, domain, resend_domain_id: data.id, status: data.status,
    });
    if (saveError) throw new Error("The sending domain was added to Resend but could not be saved");
    return Response.json({ domain: data.name, records: data.records, status: data.status });
  } catch (e) { return fail(e); }
}

export async function PATCH(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { project } = await requireProject((await params).id, ["owner", "admin"]);
    const db = admin();
    const { data: saved, error } = await db.from("email_domains")
      .select("resend_domain_id").eq("project_id", project.id).maybeSingle();
    if (error) throw new Error("Could not load the email domain");
    if (!saved) return Response.json({ error: "Add a sending domain first" }, { status: 404 });

    const verified = await resend.domains.verify(saved.resend_domain_id);
    if (verified.error) return Response.json({ error: "Resend could not verify the domain" }, { status: 502 });
    const { data, error: getError } = await resend.domains.get(saved.resend_domain_id);
    if (getError || !data) return Response.json({ error: "Could not load verification status" }, { status: 502 });
    const { error: updateError } = await db.from("email_domains")
      .update({ status: data.status }).eq("project_id", project.id);
    if (updateError) throw new Error("Could not save the latest email verification status");
    return Response.json({ domain: data.name, status: data.status, records: data.records });
  } catch (e) { return fail(e); }
}
