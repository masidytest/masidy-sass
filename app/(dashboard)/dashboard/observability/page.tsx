"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";

export const dynamic = "force-dynamic";

const ACCENT = "#75ea5e";
const WARN = "#f59e0b";
const ERR = "#f87171";

type ServiceMetric = { name: string; requests: number; warnings: number; errors: number; bars: number[] };

function getSupabase() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "");
}

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
  const [metrics, setMetrics] = useState<ServiceMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [window, setWindow] = useState("60m");
  const [projectId, setProjectId] = useState<string | null>(null);

  useEffect(() => {
    async function getProject() {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: member } = await supabase.from("org_members").select("org_id").eq("user_id", user.id).limit(1).single();
      if (!member) return;
      const { data: proj } = await supabase.from("projects").select("id").eq("org_id", member.org_id).limit(1).single();
      if (proj) setProjectId(proj.id);
    }
    getProject();
  }, []);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    fetch(`/api/projects/${projectId}/metrics?window=${window}`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setMetrics(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectId, window]);

  const displayMetrics: ServiceMetric[] = metrics.length > 0 ? metrics : [
    { name: "POSTGRES", requests: 0, warnings: 0, errors: 0, bars: Array(20).fill(0) },
    { name: "API GATEWAY", requests: 0, warnings: 0, errors: 0, bars: Array(20).fill(0) },
    { name: "AUTH", requests: 0, warnings: 0, errors: 0, bars: Array(20).fill(0) },
    { name: "STORAGE", requests: 0, warnings: 0, errors: 0, bars: Array(20).fill(0) },
    { name: "REALTIME", requests: 0, warnings: 0, errors: 0, bars: Array(20).fill(0) },
  ];

  const total = displayMetrics.reduce((s, m) => s + m.requests, 0);
  const errors = displayMetrics.reduce((s, m) => s + m.errors, 0);
  const successRate = total > 0 ? (((total - errors) / total) * 100).toFixed(1) : null;

  return (
    <main style={{ padding: "32px 40px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: "0 0 6px", fontSize: 36, letterSpacing: "-.02em", fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500 }}>Observability</h1>
        <p style={{ margin: 0, color: "#a1a1aa", fontSize: 15 }}>Monitor requests, errors and performance across all services.</p>
      </div>

      {/* Summary + time filter */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
          <span style={{ fontSize: 22, fontWeight: 700 }}>{total.toLocaleString()} Total Requests</span>
          {successRate && <span style={{ fontSize: 18, fontWeight: 600, color: ACCENT }}>{successRate}% Success Rate</span>}
          {!successRate && <span style={{ fontSize: 14, color: "#71717a" }}>No requests in this window</span>}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["15m", "60m", "3h", "24h"].map(w => (
            <button key={w} onClick={() => setWindow(w)}
              style={{ padding: "5px 12px", borderRadius: 6, border: `1px solid ${window === w ? "#33333a" : "#26262a"}`, background: window === w ? "#1c1c1f" : "transparent", color: window === w ? "#f4f4f5" : "#71717a", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
              Last {w}
            </button>
          ))}
        </div>
      </div>

      {/* Service charts */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 12, marginBottom: 24 }}>
        {displayMetrics.map(s => {
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
