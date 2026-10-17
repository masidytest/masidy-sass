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

    const [detailsRes, healthRes, replicasRes] = await Promise.allSettled([
      fetch(`${MGMT}/projects/${ref}`, { headers: h }),
      fetch(`${MGMT}/projects/${ref}/health`, { headers: h }),
      fetch(`${MGMT}/projects/${ref}/read-replicas`, { headers: h }),
    ]);

    let name = project.name;
    let region = project.region;
    let status = project.status;
    let compute = "nano";

    if (detailsRes.status === "fulfilled" && detailsRes.value.ok) {
      const d = await detailsRes.value.json();
      name = d.name ?? name;
      region = d.region ?? region;
      status = d.status ?? status;
      compute = d.infra_compute_size ?? d.compute_size ?? compute;
    }

    const health: InfraData["health"] = [];
    if (healthRes.status === "fulfilled" && healthRes.value.ok) {
      const h2 = await healthRes.value.json();
      const items = Array.isArray(h2) ? h2 : (h2?.services ?? []);
      for (const s of items) {
        health.push({
          name: s.name ?? s.service ?? "unknown",
          status: s.status === "HEALTHY" ? "HEALTHY" : s.status === "UNHEALTHY" ? "UNHEALTHY" : "UNKNOWN",
        });
      }
    }

    const readReplicas: InfraData["readReplicas"] = [];
    if (replicasRes.status === "fulfilled" && replicasRes.value.ok) {
      const r = await replicasRes.value.json();
      const items = Array.isArray(r) ? r : [];
      for (const rr of items) {
        readReplicas.push({ ref: rr.ref ?? rr.id ?? "", region: rr.region ?? "", status: rr.status ?? "unknown" });
      }
    }

    const data: InfraData = { name, region, status, compute, ref, readReplicas, health };
    return Response.json(data);
  } catch (e) { return fail(e); }
}
