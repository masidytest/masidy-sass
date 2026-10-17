"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useProject } from "@/lib/hooks/use-project";

export const dynamic = "force-dynamic";

const ACCENT = "#75ea5e";
const WARN = "#f59e0b";
const ERR = "#f87171";

type ServiceMetric = { name: string; requests: number; warnings: number; errors: number; bars: number[] };

function BarChart({ bars, color = ACCENT }: { bars: number[]; color?: string }) {
  const max = Math.max(...bars, 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 56, marginTop: 8 }}>
      {bars.map((v, i) => (
        <div key={i} style={{ flex: 1, borderRadius: 2, background: v > 0 ? color : "#26262a", height: `${Math.max(4, (v / max) * 100)}%` }} />
      ))}
    </div>
  );
}

export default function ObservabilityPage() {
  const { project, loading: projectLoading, error: projectError } = useProject();
  const [metrics, setMetrics] = useState<ServiceMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [window, setWindow] = useState("60m");
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!project) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setMetrics([]);
    fetch(`/api/projects/${project.id}/metrics?window=${window}`, { signal: controller.signal })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Could not load metrics");
        if (!Array.isArray(data)) throw new Error("Metrics API returned an unexpected response");
        setMetrics(data);
      })
      .catch(e => {
        if (!controller.signal.aborted) {
          setError(e instanceof Error ? e.message : "Could not load metrics");
          setMetrics([]);
        }
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [project?.id, window, refreshKey]);

  const total = metrics.reduce((s, m) => s + m.requests, 0);
  const errors = metrics.reduce((s, m) => s + m.errors, 0);
  const successRate = total > 0 ? (((total - errors) / total) * 100).toFixed(1) : null;

  if (projectLoading) return <main style={{ padding: "32px 40px", color: "#a1a1aa" }}>Loading project…</main>;
  if (projectError || !project) return <main style={{ padding: "32px 40px", color: "#f87171" }}>{projectError ?? "No project available."}</main>;

  return (
    <main style={{ padding: "32px 40px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: "0 0 6px", fontSize: 36, letterSpacing: "-.02em", fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500 }}>Observability</h1>
        <p style={{ margin: 0, color: "#a1a1aa", fontSize: 15 }}>Monitor requests, errors and performance across all services.</p>
      </div>

      {error && <p role="alert" style={{ marginBottom: 16, color: ERR, fontSize: 14 }}>{error}</p>}
      {/* Summary + time filter */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
          <span style={{ fontSize: 22, fontWeight: 700 }}>{loading ? "Loading metrics…" : `${total.toLocaleString()} Total Requests`}</span>
          {successRate && <span style={{ fontSize: 18, fontWeight: 600, color: ACCENT }}>{successRate}% Success Rate</span>}
          {!loading && !successRate && !error && <span style={{ fontSize: 14, color: "#71717a" }}>No requests in this window</span>}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["15m", "60m", "3h", "24h"].map(w => (
            <button key={w} onClick={() => setWindow(w)}
              style={{ padding: "5px 12px", borderRadius: 6, border: `1px solid ${window === w ? "#33333a" : "#26262a"}`, background: window === w ? "#1c1c1f" : "transparent", color: window === w ? "#f4f4f5" : "#71717a", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
              Last {w}
            </button>
          ))}
          <button type="button" onClick={() => setRefreshKey(value => value + 1)} disabled={loading}
            style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid #26262a", background: "transparent", color: "#a1a1aa", fontSize: 13, cursor: loading ? "wait" : "pointer", fontFamily: "inherit" }}>
            Refresh
          </button>
        </div>
      </div>

      {/* Service charts */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 12, marginBottom: 24 }}>
        {!loading && !error && metrics.length === 0 && <p style={{ color: "#a1a1aa" }}>No service activity was recorded in this time range.</p>}
        {metrics.map(s => {
          const hasErrors = s.errors > 0;
          const hasWarnings = s.warnings > 0;
          const color = hasErrors ? ERR : hasWarnings ? WARN : ACCENT;
          return (
            <div key={s.name} style={{ border: "1px solid #26262a", borderRadius: 10, background: "#151517", padding: "16px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 10, color: "#71717a", letterSpacing: ".06em" }}>{s.name}</div>
                <div style={{ display: "flex", gap: 8, fontSize: 11, fontFamily: "'Geist Mono',monospace" }}>
                  <span style={{ color: WARN }}>● {s.warnings}</span>
                  <span style={{ color: ERR }}>● {s.errors}</span>
                </div>
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-.02em" }}>{s.requests.toLocaleString()}</div>
              <BarChart bars={s.bars} color={color} />
            </div>
          );
        })}
      </div>

      {/* Link to detailed logs */}
      <div style={{ display: "flex", gap: 12 }}>
        <Link href="/dashboard/logs" style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #33333a", color: "#f4f4f5", textDecoration: "none", fontSize: 14 }}>
          View detailed logs →
        </Link>
      </div>
    </main>
  );
}
