import { z } from "zod";
import { requireProject, fail } from "@/lib/auth";
import { admin } from "@/lib/supabase/server";
import { attachGatewayDomain } from "@/lib/vercel";

const body = z.object({ domain: z.string().regex(/^[a-z0-9-]+(\.[a-z0-9-]+)+$/) });

// Connect a domain the customer already owns. Buying is a separate, price-confirmed step (see lib/vercel.ts).
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { project } = await requireProject((await params).id, ["owner", "admin"]);
    const { domain } = body.parse(await req.json());
    const { error } = await admin().from("project_domains").insert({ project_id: project.id, domain, kind: "connected" });
    if (error) return Response.json({ error: "Domain already in use" }, { status: 409 });
    await attachGatewayDomain(domain);
    return Response.json({ domain, status: "pending", next: "Point your DNS at Vercel, then check status." }, { status: 202 });
  } catch (e) { return fail(e); }
}
