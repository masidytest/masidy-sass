"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { AdvisorIssue } from "@/lib/types/overview";

const WARN = "#f59e0b";
const ERR = "#f87171";
const ACCENT = "#75ea5e";

function severityColor(s: string) {
  if (s === "ERROR") return ERR;
  if (s === "WARN") return WARN;
  return ACCENT;
}

interface Props { projectId: string }

export function AdvisorWidget({ projectId }: Props) {
  const [issues, setIssues] = useState<AdvisorIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/advisor`)
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) setIssues(d);
        else setError("Failed to load advisor results");
        setLoading(false);
      })
      .catch(() => { setError("Failed to load advisor results"); setLoading(false); });
  }, [projectId]);

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[1, 2].map(i => (
          <div key={i} style={{ height: 60, background: "#26262a", borderRadius: 10, animation: "pulse 1.5s infinite" }} />
        ))}
      </div>
    );
  }

  if (error) {
    return <div style={{ color: "#f87171", fontSize: 14 }}>{error}</div>;
  }

  if (issues.length === 0) {
    return (
      <div style={{ border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: "48px 20px", textAlign: "center" }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 12px", display: "block" }}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <polyline points="9 12 11 14 15 10"/>
        </svg>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6, color: "#f4f4f5" }}>No security or performance issues found</div>
        <p style={{ margin: 0, color: "#a1a1aa", fontSize: 13 }}>Your project looks clean. We&apos;ll surface issues here if they arise.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 14, color: "#a1a1aa", marginBottom: 4 }}>
        Found <strong style={{ color: "#f4f4f5" }}>{issues.length}</strong> issue{issues.length > 1 ? "s" : ""}
      </div>
      {issues.map((issue, i) => {
        const color = severityColor(issue.severity);
        return (
          <div key={i} style={{ border: `1px solid ${color}33`, borderRadius: 10, background: "#151517", padding: "14px 18px", display: "flex", gap: 14, alignItems: "flex-start" }}>
            <span style={{ color, fontSize: 16, flexShrink: 0, marginTop: 2 }}>●</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#f4f4f5", marginBottom: 4 }}>{issue.title}</div>
              <div style={{ fontSize: 13, color: "#a1a1aa", lineHeight: 1.6 }}>{issue.description}</div>
            </div>
            <span style={{ flexShrink: 0, fontFamily: "'Geist Mono',monospace", fontSize: 10, padding: "2px 8px", borderRadius: 99, background: `${color}22`, color }}>
              {issue.severity}
            </span>
          </div>
        );
      })}
      <div style={{ marginTop: 4 }}>
        <Link href="/dashboard/advisors"
          style={{ fontSize: 13, color: ACCENT, textDecoration: "none" }}>
          View advisor findings →
        </Link>
      </div>
    </div>
  );
}
