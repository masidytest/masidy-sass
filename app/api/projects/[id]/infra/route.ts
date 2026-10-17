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

    const [detailsRes, healthRes, replicasRes] = await Promise.all([
      fetch(`${MGMT}/projects/${ref}`, { headers: h }),
      fetch(`${MGMT}/projects/${ref}/health`, { headers: h }),
      fetch(`${MGMT}/projects/${ref}/read-replicas`, { headers: h }),
    ]);
    for (const response of [detailsRes, healthRes, replicasRes]) {
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
        status: s.status === "HEALTHY" ? "HEALTHY" : s.status === "UNHEALTHY" ? "UNHEALTHY" : "UNKNOWN",
      });
    }

    const readReplicas: InfraData["readReplicas"] = [];
    const replicasResponse = await replicasRes.json();
    if (!Array.isArray(replicasResponse)) throw new Error("Supabase returned an unexpected read replica response");
    for (const rr of replicasResponse) {
      readReplicas.push({ ref: rr.ref ?? rr.id ?? "", region: rr.region ?? "", status: rr.status ?? "unknown" });
    }

    const data: InfraData = { name, region, status, compute, ref, readReplicas, health };
    return Response.json(data);
  } catch (e) { return fail(e); }
}
