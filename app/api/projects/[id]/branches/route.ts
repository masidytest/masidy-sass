import { requireProject, fail } from "@/lib/auth";
import { env } from "@/lib/env";
import type { BranchInfo } from "@/lib/types/overview";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { project } = await requireProject((await params).id, ["owner", "admin", "developer"]);
    if (!project.supabase_ref) return Response.json({ error: "Project is still provisioning" }, { status: 409 });

    const r = await fetch(
      `https://api.supabase.com/v1/projects/${project.supabase_ref}/branches`,
      { headers: { Authorization: `Bearer ${env.SUPABASE_MGMT_TOKEN}` } }
    );

    if (!r.ok) {
      return Response.json(
        { error: `Project branch listing failed (HTTP ${r.status})` },
        { status: 502 }
      );
    }

    const data = await r.json();
    const branches: BranchInfo[] = (Array.isArray(data) ? data : []).map((b: Record<string, unknown>) => ({
      id: String(b.id ?? b.branch_id ?? ""),
      name: String(b.name ?? b.branch_name ?? ""),
      status: String(b.status ?? ""),
      created_at: String(b.created_at ?? ""),
    }));

    return Response.json(branches);
  } catch (e) { return fail(e); }
}
