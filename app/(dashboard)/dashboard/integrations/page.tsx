"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type IntegrationKey = "database" | "domains" | "billing" | "email";
type Integration = { key: IntegrationKey; name: string; desc: string; category: string; href: string };
type IntegrationStatus = "connected" | "not_configured" | "permission_error" | "unavailable";

const integrations: Integration[] = [
  { key: "database", name: "Database, auth & storage", desc: "Create and manage your project's data, users, and files.", category: "Project services", href: "/dashboard/database" },
  { key: "domains", name: "Domains", desc: "Search, register, and connect domains for your project.", category: "Project services", href: "/dashboard/domains" },
  { key: "billing", name: "Plans & billing", desc: "Choose a Masidy plan and manage your subscription.", category: "Account", href: "/dashboard/plans" },
  { key: "email", name: "Email delivery", desc: "Configure a sending domain and verify its DNS records.", category: "Project services", href: "/dashboard/email" },
];

export default function IntegrationsPage() {
  const [status, setStatus] = useState<Partial<Record<IntegrationKey, IntegrationStatus>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/integrations");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not load integration status");
      if (!data || typeof data !== "object") throw new Error("Integration status returned an unexpected response");
      setStatus(data as Partial<Record<IntegrationKey, IntegrationStatus>>);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load integration status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadStatus(); }, [loadStatus]);

  return (
    <main style={{ padding: "32px 40px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 16, marginBottom: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: "0 0 6px", fontSize: 36, letterSpacing: "-.02em", fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500 }}>Integrations</h1>
          <p style={{ margin: 0, color: "#a1a1aa", fontSize: 15 }}>Status of the services available to your projects.</p>
        </div>
        <button onClick={() => void loadStatus()} disabled={loading} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #33333a", background: "transparent", color: "#f4f4f5", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
          {loading ? "Checking…" : "Refresh"}
        </button>
      </div>
      {error && <p role="alert" style={{ color: "#f87171", fontSize: 14 }}>{error}</p>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 14, marginTop: 20 }}>
        {integrations.map(({ key, name, desc, category, href }) => {
          const state = status?.[key];
          const connected = state === "connected";
          const statusLabel = loading ? "CHECKING"
            : error || !state ? "UNKNOWN"
              : state === "connected" ? "AVAILABLE"
                : state === "permission_error" ? "NEEDS ATTENTION"
                  : state === "unavailable" ? "TEMPORARILY UNAVAILABLE" : "SETUP REQUIRED";
          const statusColor = connected ? "#75ea5e" : state === "permission_error" || state === "unavailable" ? "#f87171" : "#a1a1aa";
          return (
            <div key={key} style={{ border: `1px solid ${connected ? "#75ea5e44" : "#26262a"}`, borderRadius: 12, background: "#151517", padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{name}</div>
                  <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 11, color: "#71717a" }}>{category}</div>
                </div>
                <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 10, padding: "2px 8px", borderRadius: 99, background: connected ? "#75ea5e22" : "#26262a", color: statusColor }}>
                  {statusLabel}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: "#a1a1aa", lineHeight: 1.5 }}>{desc}</p>
              <Link href={href} style={{ alignSelf: "flex-start", padding: "7px 14px", borderRadius: 8, border: "1px solid #33333a", color: "#f4f4f5", fontSize: 13, textDecoration: "none" }}>Open feature</Link>
            </div>
          );
        })}
      </div>
      <p style={{ marginTop: 16, color: "#71717a", fontSize: 12, lineHeight: 1.6 }}>
        Status checks confirm service connectivity only. Each feature checks its required permissions when you use it.
      </p>
    </main>
  );
}
