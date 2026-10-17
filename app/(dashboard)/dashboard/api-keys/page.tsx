"use client";

import { useEffect, useState } from "react";
import { useProject } from "@/lib/hooks/use-project";

const ACCENT = "#75ea5e";

export default function ApiKeysPage() {
  const { project, loading: projLoading, error: projectError } = useProject();
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!project) return;
    setLoading(true);
    setError("");
    fetch(`/api/projects/${project.id}/keys`)
      .then(async r => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error ?? "Could not load API keys");
        if (typeof data.publicKey !== "string" || typeof data.url !== "string") throw new Error("API key response was incomplete");
        setPublicKey(data.publicKey);
        setUrl(data.url);
      })
      .catch(e => setError(e instanceof Error ? e.message : "Could not load API keys"))
      .finally(() => setLoading(false));
  }, [project?.id]);

  async function copy(value: string | null, label: string) {
    if (!value) return;
    setError("");
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      setTimeout(() => setCopied(""), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Clipboard access was denied");
    }
  }

  if (projLoading) return <main style={{ padding: "32px 40px" }}><div style={{ color: "#a1a1aa" }}>Loading…</div></main>;
  if (projectError || !project) return <main style={{ padding: "32px 40px", color: "#f87171" }}>{projectError ?? "No project available."}</main>;

  return (
    <main style={{ padding: "32px 40px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: "0 0 6px", fontSize: 36, letterSpacing: "-.02em", fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500 }}>API keys</h1>
        <p style={{ margin: 0, color: "#a1a1aa", fontSize: 15 }}>Connect your app to this project.</p>
      </div>
      {error && <p role="alert" style={{ color: "#f87171", fontSize: 14 }}>{error}</p>}

      <section style={{ border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 20, marginBottom: 20 }}>
        <h2 style={{ margin: "0 0 6px", fontSize: 17 }}>Keys</h2>

        {/* URL */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 0", borderTop: "1px solid #26262a", flexWrap: "wrap" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Project URL</div>
            <div style={{ fontSize: 13, color: "#a1a1aa" }}>Use this as your MASIDY_URL.</div>
          </div>
          <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 13, padding: "8px 12px", borderRadius: 8, background: "#0e0e0f", border: "1px solid #26262a", maxWidth: 360, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {loading ? "Loading…" : (url ?? "—")}
          </span>
          <button onClick={() => void copy(url, "url")} disabled={!url || loading}
            style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #33333a", background: "transparent", color: "#f4f4f5", fontSize: 14, cursor: url && !loading ? "pointer" : "not-allowed", fontFamily: "inherit" }}>{copied === "url" ? "Copied!" : "Copy"}</button>
        </div>

        {/* Public key */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 0", borderTop: "1px solid #26262a", flexWrap: "wrap" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Public (anon) key</div>
            <div style={{ fontSize: 13, color: "#a1a1aa" }}>Safe to use in browser code.</div>
          </div>
          <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 13, padding: "8px 12px", borderRadius: 8, background: "#0e0e0f", border: "1px solid #26262a", maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {loading ? "Loading…" : (publicKey ?? (project?.status !== "active" ? "Available once project is active" : "—"))}
          </span>
          <button onClick={() => void copy(publicKey, "key")} disabled={!publicKey || loading} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #33333a", background: "transparent", color: "#f4f4f5", fontSize: 14, cursor: publicKey && !loading ? "pointer" : "not-allowed", fontFamily: "inherit" }}>
            {copied === "key" ? "Copied!" : "Copy"}
          </button>
        </div>

        {/* Secret key */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 0", borderTop: "1px solid #26262a", flexWrap: "wrap" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Secret (service_role) key</div>
            <div style={{ fontSize: 13, color: "#a1a1aa" }}>Server only. Never ship this in client code.</div>
          </div>
          <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 13, padding: "8px 12px", borderRadius: 8, background: "#0e0e0f", border: "1px solid #26262a" }}>
            Protected; never returned to the browser
          </span>
        </div>
      </section>

      <section style={{ border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 20 }}>
        <h2 style={{ margin: "0 0 6px", fontSize: 17 }}>Usage</h2>
        <p style={{ margin: "8px 0 14px", color: "#a1a1aa", fontSize: 14 }}>Use these in your app to connect to Masidy.</p>
        <pre style={{ margin: 0, padding: "14px 16px", background: "#0e0e0f", borderRadius: 8, border: "1px solid #26262a", fontFamily: "'Geist Mono',monospace", fontSize: 12, color: "#a1a1aa", overflowX: "auto" }}>
{`MASIDY_URL=${url ?? "unavailable"}
MASIDY_KEY=${publicKey ?? "unavailable"}`}
        </pre>
      </section>
    </main>
  );
}
