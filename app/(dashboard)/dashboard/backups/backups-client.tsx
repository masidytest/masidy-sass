"use client";

import { useCallback, useEffect, useState } from "react";
import { useProject } from "@/lib/hooks/use-project";

type Backup = { id: string; status: string; created_at: string; size_bytes?: number };
type BackupData = {
  backups: Backup[];
  pitrEnabled: boolean;
  recoveryRange: { earliest_physical_backup_date_unix?: number; latest_physical_backup_date_unix?: number } | null;
};
const panel = { border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 20 } as const;

function localDateTime(unixSeconds: number) {
  const date = new Date(unixSeconds * 1000);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export default function BackupsClient() {
  const { project, loading: projectLoading, error: projectError } = useProject();
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pitrEnabled, setPitrEnabled] = useState(false);
  const [recoveryRange, setRecoveryRange] = useState<BackupData["recoveryRange"]>(null);
  const [recoveryTime, setRecoveryTime] = useState("");
  const [confirmProjectName, setConfirmProjectName] = useState("");
  const [restoring, setRestoring] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState("");

  const loadBackups = useCallback(async () => {
    if (!project) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/projects/${project.id}/backups`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not load backups");
      if (!Array.isArray(data.backups) || typeof data.pitrEnabled !== "boolean") {
        throw new Error("Backups API returned an unexpected response");
      }
      setBackups(data.backups);
      setPitrEnabled(data.pitrEnabled);
      setRecoveryRange(data.recoveryRange);
      setRecoveryTime(data.recoveryRange?.latest_physical_backup_date_unix
        ? localDateTime(data.recoveryRange.latest_physical_backup_date_unix)
        : "");
    } catch (e) {
      setBackups([]);
      setError(e instanceof Error ? e.message : "Could not load backups");
    } finally {
      setLoading(false);
    }
  }, [project]);

  useEffect(() => { void loadBackups(); }, [loadBackups]);

  async function restoreBackup(event: React.FormEvent) {
    event.preventDefault();
    if (!project || !recoveryTime) return;
    setRestoring(true);
    setError("");
    setRestoreMessage("");
    try {
      const recoveryTimeUnix = Math.floor(new Date(recoveryTime).getTime() / 1000);
      const response = await fetch(`/api/projects/${project.id}/backups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recoveryTimeUnix, confirmProjectName }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not start point-in-time restore");
      setRestoreMessage("Supabase accepted the restore request. The project may be unavailable while recovery runs.");
      setConfirmProjectName("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start point-in-time restore");
    } finally {
      setRestoring(false);
    }
  }

  if (projectLoading) return <main style={{ padding: "32px 40px", color: "#a1a1aa" }}>Loading project…</main>;
  if (projectError || !project) return <main style={{ padding: "32px 40px", color: "#f87171" }}>{projectError ?? "No project available."}</main>;

  return (
    <main style={{ padding: "32px 40px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: "0 0 6px", fontSize: 36, letterSpacing: "-.02em", fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500 }}>Backups</h1>
          <p style={{ margin: 0, color: "#a1a1aa", fontSize: 15 }}>Backups reported by Supabase for {project.name}.</p>
        </div>
        <button onClick={() => void loadBackups()} disabled={loading} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #33333a", background: "transparent", color: "#f4f4f5", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>
      {error && <p role="alert" style={{ color: "#f87171", fontSize: 14 }}>{error}</p>}
      {restoreMessage && <p role="status" style={{ color: "#75ea5e", fontSize: 14 }}>{restoreMessage}</p>}
      <section style={panel}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10, padding: "10px 0", borderBottom: "1px solid #26262a", color: "#71717a", fontSize: 11, fontFamily: "'Geist Mono',monospace" }}>
          <span>CREATED</span><span>STATUS</span><span>SIZE</span>
        </div>
        {loading ? <p style={{ padding: 32, color: "#a1a1aa", textAlign: "center" }}>Loading backups…</p>
          : error ? <p style={{ padding: 32, color: "#f87171", textAlign: "center" }}>Backup data could not be loaded.</p>
          : backups.length === 0 ? <p style={{ padding: 32, color: "#a1a1aa", textAlign: "center" }}>Supabase returned no backups for this project.</p>
          : backups.map((backup, index) => (
            <div key={backup.id || `${backup.created_at}-${index}`} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10, padding: "12px 0", borderBottom: "1px solid #26262a", fontSize: 13 }}>
              <time>{backup.created_at ? new Date(backup.created_at).toLocaleString() : "Unknown"}</time>
              <span style={{ color: backup.status.toLowerCase() === "completed" ? "#75ea5e" : "#a1a1aa" }}>{backup.status}</span>
              <span style={{ color: "#a1a1aa" }}>{backup.size_bytes == null ? "Not reported" : `${(backup.size_bytes / 1024 / 1024).toFixed(1)} MB`}</span>
            </div>
          ))}
      </section>
      <p style={{ marginTop: 12, color: "#71717a", fontSize: 12 }}>Backup scheduling and retention are controlled by Supabase. Storage objects are not included in database point-in-time recovery.</p>
      {pitrEnabled && recoveryRange?.earliest_physical_backup_date_unix && recoveryRange.latest_physical_backup_date_unix && (
        <details style={{ ...panel, marginTop: 16 }}>
          <summary style={{ cursor: "pointer", fontSize: 14, color: "#f87171", fontWeight: 600 }}>Restore database to a point in time — destructive</summary>
          <p style={{ color: "#a1a1aa", fontSize: 13, lineHeight: 1.6 }}>
            This replaces the current database state. Only the project owner can request it. Available range: {new Date(recoveryRange.earliest_physical_backup_date_unix * 1000).toLocaleString()} to {new Date(recoveryRange.latest_physical_backup_date_unix * 1000).toLocaleString()}.
          </p>
          <form onSubmit={restoreBackup} style={{ display: "grid", gap: 12, maxWidth: 480 }}>
            <label style={{ display: "grid", gap: 6, fontSize: 13, color: "#a1a1aa" }}>
              Recovery time
              <input type="datetime-local" required min={localDateTime(recoveryRange.earliest_physical_backup_date_unix)}
                max={localDateTime(recoveryRange.latest_physical_backup_date_unix)} value={recoveryTime}
                onChange={event => setRecoveryTime(event.target.value)}
                style={{ padding: 9, border: "1px solid #33333a", borderRadius: 8, background: "#0e0e0f", color: "#f4f4f5", font: "inherit" }} />
            </label>
            <label style={{ display: "grid", gap: 6, fontSize: 13, color: "#a1a1aa" }}>
              Type <strong style={{ color: "#f4f4f5" }}>{project.name}</strong> to confirm
              <input required value={confirmProjectName} onChange={event => setConfirmProjectName(event.target.value)}
                style={{ padding: 9, border: "1px solid #33333a", borderRadius: 8, background: "#0e0e0f", color: "#f4f4f5", font: "inherit" }} />
            </label>
            <button type="submit" disabled={restoring || confirmProjectName !== project.name}
              style={{ justifySelf: "start", padding: "8px 14px", borderRadius: 8, border: "1px solid #7f1d1d", background: "#450a0a", color: "#fecaca", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
              {restoring ? "Requesting restore…" : "Start database restore"}
            </button>
          </form>
        </details>
      )}
      {pitrEnabled && !recoveryRange?.earliest_physical_backup_date_unix && (
        <p style={{ marginTop: 12, color: "#a1a1aa", fontSize: 13 }}>PITR is enabled, but Supabase did not report a usable recovery range.</p>
      )}
      {!pitrEnabled && (
        <p style={{ marginTop: 12, color: "#a1a1aa", fontSize: 13 }}>Point-in-time restore is unavailable because Supabase reports it is not enabled for this project.</p>
      )}
    </main>
  );
}
