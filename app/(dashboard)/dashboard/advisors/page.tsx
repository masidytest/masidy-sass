"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

const ACCENT = "#75ea5e";
const WARN = "#f59e0b";
const ERR = "#f87171";

type Issue = { title: string; severity: string; description: string };

function getSupabase() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "");
}

export default function AdvisorsPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectId, setProjectId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: member } = await supabase.from("org_members").select("org_id").eq("user_id", user.id).limit(1).single();
      if (!member) { setLoading(false); return; }
      const { data: proj } = await supabase.from("projects").select("id").eq("org_id", member.org_id).limit(1).single();
      if (!proj) { setLoading(false); return; }
      setProjectId(proj.id);

      const r = await fetch(`/api/projects/${proj.id}/advisor`);
      const data = await r.json();
      if (Array.isArray(data)) setIssues(data);
      setLoading(false);
    }
    load();
  }, []);

  const colorFor = (s: string) => s === "ERROR" ? ERR : s === "WARN" ? WARN : ACCENT;

  return (
    <main style={{ padding: "32px 40px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: "0 0 6px", fontSize: 36, letterSpacing: "-.02em", fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500 }}>Advisors</h1>
        <p style={{ margin: 0, color: "#a1a1aa", fontSize: 15 }}>Security and performance recommendations for your project.</p>
      </div>

      {loading ? (
        <div style={{ color: "#a1a1aa" }}>Scanning…</div>
      ) : issues.length === 0 ? (
        <div style={{ border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: "64px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto", display: "block" }}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>
            </svg>
          </div>
          <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 6 }}>No security or performance issues found</div>
          <p style={{ margin: 0, color: "#a1a1aa", fontSize: 14 }}>Your project is clean. We&apos;ll alert you if anything changes.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {issues.map((issue, i) => (
            <div key={i} style={{ border: `1px solid ${colorFor(issue.severity)}44`, borderRadius: 12, background: "#151517", padding: "16px 20px", display: "flex", gap: 14, alignItems: "flex-start" }}>
              <span style={{ color: colorFor(issue.severity), fontSize: 20, marginTop: 1, flexShrink: 0 }}>●</span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{issue.title}</div>
                <div style={{ fontSize: 13, color: "#a1a1aa", lineHeight: 1.6 }}>{issue.description}</div>
              </div>
              <span style={{ marginLeft: "auto", flexShrink: 0, fontFamily: "'Geist Mono',monospace", fontSize: 11, padding: "2px 8px", borderRadius: 99, background: `${colorFor(issue.severity)}22`, color: colorFor(issue.severity) }}>
                {issue.severity}
              </span>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
