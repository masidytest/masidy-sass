import { Resend } from "resend";
import { z } from "zod";
import { requireProject, fail } from "@/lib/auth";
import { admin } from "@/lib/supabase/server";
import { env } from "@/lib/env";

const resend = new Resend(env.RESEND_API_KEY);
const body = z.object({ domain: z.string().regex(/^[a-z0-9-]+(\.[a-z0-9-]+)+$/) });

// Adds the customer's sending domain and returns the DNS records they must add.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { project } = await requireProject((await params).id, ["owner", "admin"]);
    const { domain } = body.parse(await req.json());
    const { data, error } = await resend.domains.create({ name: domain });
    if (error || !data) return Response.json({ error: "Could not add domain" }, { status: 502 });
    await admin().from("email_domains").upsert({ project_id: project.id, domain, resend_domain_id: data.id });
    return Response.json({ records: data.records, status: data.status });
  } catch (e) { return fail(e); }
}
