import { requireProject, fail } from "@/lib/auth";
import { env } from "@/lib/env";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { project } = await requireProject((await params).id, ["owner", "admin", "developer"]);
    if (!project.supabase_ref) return Response.json({ error: "Still provisioning" }, { status: 409 });

    const base = "https://api.supabase.com/v1";
    const h = { Authorization: `Bearer ${env.SUPABASE_MGMT_TOKEN}` };

    const r = await fetch(`${base}/projects/${project.supabase_ref}/advisors`, { headers: h });
    if (!r.ok) {
      return Response.json(
        { error: `Supabase advisor scan failed (HTTP ${r.status})` },
        { status: 502 }
      );
    }

    const data = await r.json();

    // Normalize to our format
    const issues = (Array.isArray(data) ? data : data?.advisors ?? []).map(
      (a: { title?: string; name?: string; severity?: string; description?: string; detail?: string }) => ({
        title: a.title ?? a.name ?? "Issue",
        severity: (a.severity ?? "WARN").toUpperCase(),
        description: a.description ?? a.detail ?? "",
      })
    );

    return Response.json(issues);
  } catch (e) { return fail(e); }
}
