"use client";

import Link from "next/link";
import { useState } from "react";

const ACCENT = "#75ea5e";

export default function OverviewPage() {
  const [copied, setCopied] = useState(false);
  const slug = "your-project";
  const url = `https://${slug}.masidy.app`;
  const publicKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";

  function copyEnv() {
    navigator.clipboard.writeText(`MASIDY_URL=${url}\nMASIDY_KEY=${publicKey}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <main style={{ padding: "32px 40px", display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 16, flexWrap: "wrap" }}>
        <h1 style={{ margin: 0, fontSize: 36, letterSpacing: "-.02em", fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500 }}>Overview</h1>
        <span style={{ fontSize: 13, color: "#a1a1aa" }}><span style={{ color: ACCENT }}>●</span> Healthy · us-east-1 · Free plan</span>
      </div>

      {/* Connect your app */}
      <section style={{ border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
          <h2 style={{ margin: 0, fontSize: 17 }}>Connect your app</h2>
          <button onClick={copyEnv} style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #33333a", background: "transparent", color: "#f4f4f5", fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
            {copied ? "Copied!" : "Copy .env"}
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 12 }}>
          <div>
            <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 11, color: "#a1a1aa", marginBottom: 6 }}>MASIDY_URL</div>
            <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 13, padding: "10px 12px", borderRadius: 8, background: "#0e0e0f", border: "1px solid #26262a" }}>{url}</div>
          </div>
          <div>
            <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 11, color: "#a1a1aa", marginBottom: 6 }}>MASIDY_KEY (public)</div>
            <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 13, padding: "10px 12px", borderRadius: 8, background: "#0e0e0f", border: "1px solid #26262a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{publicKey}</div>
          </div>
        </div>
      </section>

      {/* Metrics */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
        {[
          { label: "DATABASE SIZE", limit: "500 MB" },
          { label: "ACTIVE USERS", limit: "10,000" },
          { label: "STORAGE", limit: "1 GB" },
          { label: "EGRESS", limit: "2 GB/mo" },
        ].map(({ label, limit }) => (
          <div key={label} style={{ border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 20 }}>
            <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 11, color: "#a1a1aa" }}>{label}</div>
            <div style={{ fontSize: 28, fontWeight: 600, margin: "8px 0 10px", letterSpacing: "-.02em" }}>—</div>
            <div style={{ height: 6, borderRadius: 99, background: "#26262a" }} />
            <div style={{ fontSize: 12, color: "#71717a", marginTop: 8 }}>of {limit}</div>
          </div>
        ))}
      </section>

      {/* Services + Recent requests */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))", gap: 20 }}>
        <section style={{ border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 20 }}>
          <h2 style={{ margin: "0 0 8px", fontSize: 17 }}>Services</h2>
          {[
            { name: "Database", status: "Ready" },
            { name: "Auth", status: "Ready" },
            { name: "Storage", status: "Ready" },
            { name: "Domains", status: "No domain connected" },
            { name: "Email", status: "Not configured" },
          ].map(({ name, status }) => (
            <div key={name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderTop: "1px solid #26262a", fontSize: 14 }}>
              <span style={{ color: ACCENT }}>●</span>
              <span style={{ flex: 1 }}>{name}</span>
              <span style={{ color: "#a1a1aa" }}>{status}</span>
            </div>
          ))}
        </section>

        <section style={{ border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <h2 style={{ margin: 0, fontSize: 17 }}>Recent requests</h2>
            <Link href="/dashboard/logs" style={{ fontSize: 14, color: ACCENT, textDecoration: "none" }}>Open logs →</Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "70px 1fr 60px", gap: 8, padding: "10px 0", borderTop: "1px solid #26262a", fontFamily: "'Geist Mono',monospace", fontSize: 11, color: "#71717a" }}>
            <span>METHOD</span><span>PATH</span><span>STATUS</span>
          </div>
          <div style={{ padding: "36px 0", textAlign: "center", borderTop: "1px solid #26262a", color: "#a1a1aa", fontSize: 14 }}>
            No requests yet. Make your first call from your app and it shows up here.
          </div>
        </section>
      </div>
    </main>
  );
}
