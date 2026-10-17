import { requireProject, fail } from "@/lib/auth";
import { supabaseManagementRequest } from "@/lib/supabase-mgmt";

type Usage = {
  compute?: { cpu_percent?: number; ram_percent?: number };
  disk?: { disk_io_percent?: number };
};
type HealthCheck = { name: string; data?: { active_connections?: number; max_connections?: number } };

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { project } = await requireProject((await params).id, ["owner", "admin", "developer"]);
    if (!project.supabase_ref) return Response.json({ error: "Project is still provisioning" }, { status: 409 });
    const ref = encodeURIComponent(project.supabase_ref);
    const [usage, health] = await Promise.all([
      supabaseManagementRequest<Usage>(`/projects/${ref}/usage`),
      supabaseManagementRequest<HealthCheck[]>(`/projects/${ref}/health`),
    ]);
    const databaseHealth = health.find(item => item.name === "db");
    return Response.json({
      cpu: usage.compute?.cpu_percent ?? null,
      disk: usage.disk?.disk_io_percent ?? null,
      ram: usage.compute?.ram_percent ?? null,
      connections: databaseHealth?.data?.active_connections === undefined
        ? null
        : `${databaseHealth.data.active_connections}/${databaseHealth.data.max_connections ?? "—"}`,
    });
  } catch (e) { return fail(e); }
}
