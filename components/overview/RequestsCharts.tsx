"use client";

import { useState, useEffect, useRef } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import type { ServiceMetrics } from "@/lib/types/overview";

const ACCENT = "#75ea5e";
const WARN = "#f59e0b";
const ERR = "#f87171";
const WINDOWS = ["15m", "60m", "3h", "24h"] as const;
type Window = typeof WINDOWS[number];

const WINDOW_LABELS: Record<Window, string> = {
  "15m": "Last 15 minutes",
  "60m": "Last 60 minutes",
  "3h": "Last 3 hours",
  "24h": "Last 24 hours",
};

interface Props { projectId: string }

// Skeleton card
function SkeletonCard() {
  return (
    <div style={{ border: "1px solid #26262a", borderRadius: 10, background: "#151517", padding: "16px 18px", minWidth: 200, flexShrink: 0 }}>
      <div style={{ height: 10, width: 80, background: "#26262a", borderRadius: 4, marginBottom: 10 }} />
      <div style={{ height: 28, width: 60, background: "#26262a", borderRadius: 4, marginBottom: 10 }} />
      <div style={{ height: 48, background: "#26262a", borderRadius: 4 }} />
    </div>
  );
}

// Individual service card
function ServiceCard({ m }: { m: ServiceMetrics }) {
  const chartData = m.buckets.map((b, i) => ({ i, ok: b.ok, warn: b.warn, error: b.error }));

  return (
    <div style={{ border: "1px solid #26262a", borderRadius: 10, background: "#151517", padding: "16px 18px", minWidth: 200, flexShrink: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
        <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 10, color: "#71717a", letterSpacing: ".06em" }}>{m.service}</div>
        <div style={{ display: "flex", gap: 8, fontSize: 11, fontFamily: "'Geist Mono',monospace" }}>
          <span style={{ color: WARN }}>● {m.warnings}</span>
          <span style={{ color: ERR }}>● {m.errors}</span>
        </div>
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-.02em", color: "#f4f4f5", marginBottom: 4 }}>
        {m.total.toLocaleString()}
      </div>
      <ResponsiveContainer width="100%" height={52}>
        <BarChart data={chartData} barSize={4} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <XAxis dataKey="i" hide />
          <YAxis hide />
          <Tooltip
            contentStyle={{ background: "#151517", border: "1px solid #26262a", borderRadius: 8, fontSize: 12 }}
            labelStyle={{ display: "none" }}
            itemStyle={{ color: "#a1a1aa" }}
          />
          <Bar dataKey="ok" stackId="a" fill={ACCENT} radius={[0, 0, 0, 0]} />
          <Bar dataKey="warn" stackId="a" fill={WARN} />
          <Bar dataKey="error" stackId="a" fill={ERR} radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RequestsCharts({ projectId }: Props) {
  const [window, setWindow] = useState<Window>("60m");
  const [metrics, setMetrics] = useState<ServiceMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/projects/${projectId}/metrics?window=${window}`)
      .then(r => r.json())
      .then(d => {
        if (cancelled) return;
        if (Array.isArray(d)) setMetrics(d);
        else setError("Failed to load metrics");
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) { setError("Failed to load metrics"); setLoading(false); }
      });
    return () => { cancelled = true; };
  }, [projectId, window]);

  // Poll every 60s
  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`/api/projects/${projectId}/metrics?window=${window}`)
        .then(r => r.json())
        .then(d => { if (Array.isArray(d)) setMetrics(d); })
        .catch(() => {});
    }, 60_000);
    return () => clearInterval(interval);
  }, [projectId, window]);

  const total = metrics.reduce((s, m) => s + m.total, 0);
  const errors = metrics.reduce((s, m) => s + m.errors, 0);
  const successRate = total > 0 ? (((total - errors) / total) * 100).toFixed(1) : null;

  function scrollRight() {
    scrollRef.current?.scrollBy({ left: 220, behavior: "smooth" });
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
          {loading ? (
            <div style={{ height: 22, width: 200, background: "#26262a", borderRadius: 4 }} />
          ) : (
            <>
              <span style={{ fontSize: 18, fontWeight: 700, color: "#f4f4f5" }}>{total.toLocaleString()} Total Requests</span>
              {successRate && <span style={{ fontSize: 16, fontWeight: 600, color: ACCENT }}>{successRate}% Success Rate</span>}
              {!successRate && <span style={{ fontSize: 14, color: "#71717a" }}>No requests in this window</span>}
            </>
          )}
        </div>
        {/* Time range dropdown */}
        <select
          value={window}
          onChange={e => setWindow(e.target.value as Window)}
          style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #33333a", background: "#151517", color: "#f4f4f5", fontSize: 13, cursor: "pointer", fontFamily: "'Geist',system-ui,sans-serif" }}
          aria-label="Time range"
        >
          {WINDOWS.map(w => <option key={w} value={w}>{WINDOW_LABELS[w]}</option>)}
        </select>
      </div>

      {/* Cards row */}
      <div style={{ position: "relative" }}>
        <div
          ref={scrollRef}
          style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" }}
        >
          {loading
            ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
            : error
            ? <div style={{ color: "#f87171", fontSize: 14 }}>{error}</div>
            : metrics.length === 0
            ? <div style={{ color: "#71717a", fontSize: 14, padding: "20px 0" }}>No requests in this window</div>
            : metrics.map(m => <ServiceCard key={m.service} m={m} />)
          }
        </div>
        {!loading && metrics.length > 3 && (
          <button
            onClick={scrollRight}
            aria-label="Scroll right"
            style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", width: 32, height: 32, borderRadius: "50%", border: "1px solid #33333a", background: "#151517", color: "#f4f4f5", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        )}
      </div>
    </div>
  );
}
