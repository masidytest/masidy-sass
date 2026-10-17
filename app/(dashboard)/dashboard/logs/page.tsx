"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useProject } from "@/lib/hooks/use-project";

type ProjectLog = {
  timestamp?: string;
  source_name?: string;
  event_message?: string;
  method?: string | null;
  path?: string | null;
  status_code?: number | string | null;
};

const panel = { border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 20 } as const;

export default function LogsPage() {
  const { project, loading: projectLoading, error: projectError } = useProject();
  const [logs, setLogs] = useState<ProjectLog[]>([]);
  const [window, setWindow] = useState("60m");
  const [service, setService] = useState("all");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadLogs = useCallback(async () => {
    if (!project) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/projects/${project.id}/logs?window=${window}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not load project logs");
      if (!Array.isArray(data.logs)) throw new Error("Logs API returned an unexpected response");
      setLogs(data.logs);
    } catch (e) {
      setLogs([]);
      setError(e instanceof Error ? e.message : "Could not load project logs");
    } finally {
      setLoading(false);
    }
  }, [project, window]);

  useEffect(() => { void loadLogs(); }, [loadLogs]);

  const services = useMemo(() => [...new Set(logs.map(log => log.source_name).filter((name): name is string => Boolean(name)))].sort(), [logs]);
  const filtered = logs.filter(log => {
    if (service !== "all" && log.source_name !== service) return false;
    const code = Number(log.status_code);
    if (status === "errors" && !(code >= 500)) return false;
    if (status === "warnings" && !(code >= 400 && code < 500)) return false;
    if (status === "success" && !(code >= 200 && code < 400)) return false;
    return true;
  });

  if (projectLoading) return <main style={{ padding: "32px 40px", color: "#a1a1aa" }}>Loading project…</main>;
  if (projectError || !project) return <main style={{ padding: "32px 40px", color: "#f87171" }}>{projectError ?? "No project available."}</main>;

  return (
    <main style={{ padding: "32px 40px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: "0 0 6px", fontSize: 36, letterSpacing: "-.02em", fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500 }}>Logs</h1>
          <p style={{ margin: 0, color: "#a1a1aa", fontSize: 15 }}>Recent events from your project.</p>
        </div>
        <button onClick={() => void loadLogs()} disabled={loading} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #33333a", background: "transparent", color: "#f4f4f5", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        <label style={{ color: "#a1a1aa", fontSize: 13 }}>Time range
          <select value={window} onChange={e => setWindow(e.target.value)} style={{ marginLeft: 8, padding: "8px 10px", borderRadius: 8, border: "1px solid #33333a", background: "#151517", color: "#f4f4f5" }}>
            <option value="15m">Last 15 minutes</option><option value="60m">Last hour</option><option value="3h">Last 3 hours</option><option value="24h">Last 24 hours</option>
          </select>
        </label>
        <label style={{ color: "#a1a1aa", fontSize: 13 }}>Service
          <select value={service} onChange={e => setService(e.target.value)} style={{ marginLeft: 8, padding: "8px 10px", borderRadius: 8, border: "1px solid #33333a", background: "#151517", color: "#f4f4f5" }}>
            <option value="all">All services</option>
            {services.map(name => <option key={name} value={name}>{name}</option>)}
          </select>
        </label>
        <label style={{ color: "#a1a1aa", fontSize: 13 }}>Status
          <select value={status} onChange={e => setStatus(e.target.value)} style={{ marginLeft: 8, padding: "8px 10px", borderRadius: 8, border: "1px solid #33333a", background: "#151517", color: "#f4f4f5" }}>
            <option value="all">All statuses</option><option value="success">2xx / 3xx</option><option value="warnings">4xx</option><option value="errors">5xx</option>
          </select>
        </label>
      </div>

      {error && <p role="alert" style={{ color: "#f87171", fontSize: 14 }}>{error}</p>}
      <section style={panel}>
        <div style={{ display: "grid", gridTemplateColumns: "150px 1fr minmax(180px,3fr) 80px", gap: 8, padding: "10px 0", borderBottom: "1px solid #26262a", fontFamily: "'Geist Mono',monospace", fontSize: 11, color: "#71717a" }}>
          <span>TIME</span><span>SERVICE</span><span>EVENT / REQUEST</span><span>STATUS</span>
        </div>
        {loading ? <div style={{ padding: 40, textAlign: "center", color: "#a1a1aa" }}>Loading project logs…</div>
          : error ? <div style={{ padding: 40, textAlign: "center", color: "#f87171" }}>Logs could not be loaded. Check project access and try again.</div>
          : filtered.length === 0 ? <div style={{ padding: 40, textAlign: "center", color: "#a1a1aa" }}>No matching log entries in this time range.</div>
          : filtered.map((log, index) => {
            const code = log.status_code == null ? "" : String(log.status_code);
            const message = [log.method, log.path].filter(Boolean).join(" ") || log.event_message || "—";
            return (
              <div key={`${log.timestamp ?? "log"}-${index}`} style={{ display: "grid", gridTemplateColumns: "150px 1fr minmax(180px,3fr) 80px", gap: 8, alignItems: "start", padding: "12px 0", borderBottom: "1px solid #26262a", fontSize: 12 }}>
                <time style={{ color: "#a1a1aa" }}>{log.timestamp ? new Date(log.timestamp).toLocaleString() : "—"}</time>
                <span style={{ color: "#a1a1aa", overflowWrap: "anywhere" }}>{log.source_name ?? "—"}</span>
                <code style={{ color: "#e4e4e7", overflowWrap: "anywhere", whiteSpace: "pre-wrap" }}>{message}</code>
                <span style={{ color: Number(code) >= 500 ? "#f87171" : Number(code) >= 400 ? "#fbbf24" : "#a1a1aa" }}>{code || "—"}</span>
              </div>
            );
          })}
        <p style={{ color: "#71717a", fontSize: 12, marginBottom: 0 }}>Showing up to 200 recent entries.</p>
      </section>
    </main>
  );
}
