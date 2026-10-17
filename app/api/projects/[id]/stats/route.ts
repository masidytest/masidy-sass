import { requireProject, fail } from "@/lib/auth";
import { supabaseManagementRequest } from "@/lib/supabase-mgmt";

type HealthCheck = { name: string; data?: { active_connections?: number; max_connections?: number } };

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { project } = await requireProject((await params).id, ["owner", "admin", "developer"]);
    if (!project.supabase_ref) return Response.json({ error: "Project is still provisioning" }, { status: 409 });
    const ref = encodeURIComponent(project.supabase_ref);
    const health = await supabaseManagementRequest<HealthCheck[]>(`/projects/${ref}/health`);
    const databaseHealth = health.find(item => item.name === "db");
    return Response.json({
      cpu: null,
      disk: null,
      ram: null,
      connections: databaseHealth?.data?.active_connections === undefined
        ? null
        : `${databaseHealth.data.active_connections}/${databaseHealth.data.max_connections ?? "—"}`,
    });
  } catch (e) { return fail(e); }
}
