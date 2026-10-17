import { requireProject, fail } from "@/lib/auth";
import { env } from "@/lib/env";
import type { InfraData } from "@/lib/types/overview";

const MGMT = "https://api.supabase.com/v1";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { project } = await requireProject((await params).id, ["owner", "admin", "developer"]);
    if (!project.supabase_ref) return Response.json({ error: "Still provisioning" }, { status: 409 });

    const ref = project.supabase_ref;
    const h = { Authorization: `Bearer ${env.SUPABASE_MGMT_TOKEN}` };

    const healthQuery = new URLSearchParams({
      services: "auth,db,pooler,realtime,rest,storage",
    });
    const [detailsRes, healthRes] = await Promise.all([
      fetch(`${MGMT}/projects/${ref}`, { headers: h }),
      fetch(`${MGMT}/projects/${ref}/health?${healthQuery}`, { headers: h }),
    ]);
    for (const response of [detailsRes, healthRes]) {
      if (!response.ok) {
        throw new Error(`Supabase infrastructure request failed (HTTP ${response.status})`);
      }
    }

    const details = await detailsRes.json();
    const name = details.name ?? project.name;
    const region = details.region ?? project.region;
    const status = details.status ?? project.status;
    const compute = details.infra_compute_size ?? details.compute_size ?? "unknown";

    const health: InfraData["health"] = [];
    const healthResponse = await healthRes.json();
    const healthItems = Array.isArray(healthResponse) ? healthResponse : healthResponse?.services;
    if (!Array.isArray(healthItems)) throw new Error("Supabase returned an unexpected health response");
    for (const s of healthItems) {
      health.push({
        name: s.name ?? s.service ?? "unknown",
        status: s.healthy === true || s.status === "ACTIVE_HEALTHY"
          ? "HEALTHY"
          : s.healthy === false || s.status === "UNHEALTHY"
            ? "UNHEALTHY"
            : "UNKNOWN",
      });
    }

    const data: InfraData = { name, region, status, compute, ref, readReplicas: null, health };
    return Response.json(data);
  } catch (e) { return fail(e); }
}
