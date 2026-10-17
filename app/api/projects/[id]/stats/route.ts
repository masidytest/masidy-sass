import { requireProject, fail } from "@/lib/auth";
import { env } from "@/lib/env";

// Proxy to Supabase Management API for DB stats (CPU, disk, RAM, connections)
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { project } = await requireProject((await params).id, ["owner", "admin", "developer"]);
    if (!project.supabase_ref) return Response.json({ error: "Still provisioning" }, { status: 409 });

    const base = "https://api.supabase.com/v1";
    const h = { Authorization: `Bearer ${env.SUPABASE_MGMT_TOKEN}`, "Content-Type": "application/json" };

    // Get project usage/compute stats
    const [usageRes, healthRes] = await Promise.allSettled([
      fetch(`${base}/projects/${project.supabase_ref}/usage`, { headers: h }),
      fetch(`${base}/projects/${project.supabase_ref}/health`, { headers: h }),
    ]);

    let cpu = 0, disk = 0, ram = 0;
    let connections = "—";

    if (usageRes.status === "fulfilled" && usageRes.value.ok) {
      const usage = await usageRes.value.json();
      cpu = usage?.compute?.cpu_percent ?? 0;
      disk = usage?.disk?.disk_io_percent ?? 0;
      ram = usage?.compute?.ram_percent ?? 0;
    }

    if (healthRes.status === "fulfilled" && healthRes.value.ok) {
      const health = await healthRes.value.json();
      const pgHealth = health?.find?.((s: { name: string; data?: { active_connections?: number; max_connections?: number } }) => s.name === "db");
      if (pgHealth?.data?.active_connections !== undefined) {
        connections = `${pgHealth.data.active_connections}/${pgHealth.data.max_connections ?? 60}`;
      }
    }

    return Response.json({ cpu, disk, ram, connections });
  } catch (e) { return fail(e); }
}
