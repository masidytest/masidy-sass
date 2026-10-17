import { z } from "zod";
import { requireProject, fail } from "@/lib/auth";
import { admin } from "@/lib/supabase/server";
import { attachGatewayDomain } from "@/lib/vercel";
import { env } from "@/lib/env";

const body = z.object({ domain: z.string().regex(/^[a-z0-9-]+(\.[a-z0-9-]+)+$/) });

// Connect a domain the customer already owns. Buying is a separate, price-confirmed step (see lib/vercel.ts).
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { project } = await requireProject((await params).id, ["owner", "admin"]);
    const { domain } = body.parse(await req.json());
    const { error } = await admin().from("project_domains").insert({ project_id: project.id, domain, kind: "connected" });
    if (error) return Response.json({ error: "Domain already in use" }, { status: 409 });
    try {
      const attached = await attachGatewayDomain(domain);
      const projectHost = `${project.slug}.${env.GATEWAY_BASE_DOMAIN}`;
      const isApex = attached.name.toLowerCase() === attached.apexName.toLowerCase();
      const record = isApex
        ? { type: "A", name: "@", value: "76.76.21.21" }
        : { type: "CNAME", name: attached.name.slice(0, -(attached.apexName.length + 1)), value: projectHost };
      return Response.json({
        domain,
        status: "pending",
        next: "Add this DNS record at your domain provider, then refresh the status.",
        dnsRecords: [record],
      }, { status: 202 });
    } catch (error) {
      await admin().from("project_domains").delete().eq("project_id", project.id).eq("domain", domain);
      throw error;
    }
  } catch (e) { return fail(e); }
}
