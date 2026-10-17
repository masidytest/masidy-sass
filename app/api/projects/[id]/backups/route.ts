import { requireProject, fail } from "@/lib/auth";
import { supabaseManagementRequest } from "@/lib/supabase-mgmt";
import type { BackupInfo } from "@/lib/types/overview";
import { z } from "zod";

type ProviderBackup = {
  id?: string;
  status?: string;
  inserted_at?: string;
  created_at?: string;
  size_bytes?: number;
};
type BackupResponse = ProviderBackup[] | {
  backups?: ProviderBackup[];
  pitr_enabled?: boolean;
  physical_backup_data?: {
    earliest_physical_backup_date_unix?: number;
    latest_physical_backup_date_unix?: number;
  };
};
const restoreSchema = z.object({
  recoveryTimeUnix: z.number().int().safe().positive(),
  confirmProjectName: z.string().max(100),
});

async function getProviderBackups(ref: string) {
  return supabaseManagementRequest<BackupResponse>(
    `/projects/${encodeURIComponent(ref)}/database/backups`,
  );
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { project } = await requireProject((await params).id, ["owner", "admin", "developer", "read_only"]);
    if (!project.supabase_ref) return Response.json({ error: "Project is still provisioning" }, { status: 409 });
    const data = await getProviderBackups(project.supabase_ref);
    const providerBackups = Array.isArray(data) ? data : data.backups;
    if (!Array.isArray(providerBackups)) {
      return Response.json({ error: "Backup data returned an unexpected response" }, { status: 502 });
    }
    const backups: BackupInfo[] = providerBackups.map(backup => ({
      id: backup.id == null ? "" : String(backup.id),
      status: backup.status ?? "unknown",
      created_at: backup.inserted_at ?? backup.created_at ?? "",
      size_bytes: backup.size_bytes,
    }));
    return Response.json({
      backups,
      pitrEnabled: !Array.isArray(data) && data.pitr_enabled === true,
      recoveryRange: !Array.isArray(data) ? data.physical_backup_data ?? null : null,
    });
  } catch (e) { return fail(e); }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { project } = await requireProject((await params).id, ["owner"]);
    if (!project.supabase_ref) return Response.json({ error: "Project is still provisioning" }, { status: 409 });
    const body = restoreSchema.parse(await req.json());
    if (body.confirmProjectName !== project.name) {
      return Response.json({ error: "Type the exact project name to confirm this restore" }, { status: 400 });
    }
    const backups = await getProviderBackups(project.supabase_ref);
    if (Array.isArray(backups) || backups.pitr_enabled !== true || !backups.physical_backup_data) {
      return Response.json({ error: "Point-in-time recovery is not enabled for this project" }, { status: 409 });
    }
    const { earliest_physical_backup_date_unix: earliest, latest_physical_backup_date_unix: latest } = backups.physical_backup_data;
    if (typeof earliest !== "number" || typeof latest !== "number" ||
        body.recoveryTimeUnix < earliest || body.recoveryTimeUnix > latest) {
      return Response.json({ error: "Recovery time must be within the provider-reported PITR range" }, { status: 400 });
    }
    await supabaseManagementRequest(
      `/projects/${encodeURIComponent(project.supabase_ref)}/database/backups/restore-pitr`,
      {
        method: "POST",
        body: JSON.stringify({ recovery_time_target_unix: body.recoveryTimeUnix }),
      },
    );
    return Response.json({ ok: true }, { status: 202 });
  } catch (e) { return fail(e); }
}
