import { requireProject, fail } from "@/lib/auth";
import { env } from "@/lib/env";
import type { BackupInfo } from "@/lib/types/overview";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { project } = await requireProject((await params).id, ["owner", "admin", "developer"]);
    if (!project.supabase_ref) return Response.json([]);

    const r = await fetch(
      `https://api.supabase.com/v1/projects/${project.supabase_ref}/database/backups`,
      { headers: { Authorization: `Bearer ${env.SUPABASE_MGMT_TOKEN}` } }
    );

    if (!r.ok) return Response.json([]);

    const data = await r.json();
    const backups: BackupInfo[] = (Array.isArray(data) ? data : (data?.backups ?? [])).map(
      (b: Record<string, unknown>) => ({
        id: String(b.id ?? ""),
        status: String(b.status ?? ""),
        created_at: String(b.inserted_at ?? b.created_at ?? ""),
        size_bytes: typeof b.size_bytes === "number" ? b.size_bytes : undefined,
      })
    );

    return Response.json(backups);
  } catch (e) { return fail(e); }
}
