"use client";

import { useEffect, useState } from "react";

export default function ApiKeysPage() {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/projects/YOUR_PROJECT_ID/keys")
      .then(r => r.json())
      .then(d => { setPublicKey(d.publicKey ?? null); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function copy() {
    if (!publicKey) return;
    navigator.clipboard.writeText(publicKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const keyDisplay = loading ? "Loading…" : (publicKey ?? "—");

  return (
    <main style={{ padding: "32px 40px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: "0 0 6px", fontSize: 36, letterSpacing: "-.02em", fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500 }}>API keys</h1>
        <p style={{ margin: 0, color: "#a1a1aa", fontSize: 15 }}>Connect your app to this project.</p>
      </div>

      {/* Keys */}
      <section style={{ border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 20 }}>
        <h2 style={{ margin: "0 0 6px", fontSize: 17 }}>Keys</h2>

        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 0", borderTop: "1px solid #26262a", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Public key</div>
            <div style={{ fontSize: 13, color: "#a1a1aa" }}>Safe to use in browser code.</div>
          </div>
          <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 13, padding: "8px 12px", borderRadius: 8, background: "#0e0e0f", border: "1px solid #26262a", maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {keyDisplay}
          </span>
          <button onClick={copy} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #33333a", background: "transparent", color: "#f4f4f5", fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 0", borderTop: "1px solid #26262a", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Secret key</div>
            <div style={{ fontSize: 13, color: "#a1a1aa" }}>Server only. Never ship this in client code.</div>
          </div>
          <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 13, padding: "8px 12px", borderRadius: 8, background: "#0e0e0f", border: "1px solid #26262a" }}>
            {revealed ? "Contact support to reveal" : "••••••••••••"}
          </span>
          <button onClick={() => setRevealed(r => !r)} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #33333a", background: "transparent", color: "#f4f4f5", fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
            {revealed ? "Hide" : "Reveal"}
          </button>
        </div>
      </section>

      <div style={{ height: 20 }} />

      {/* Rotate */}
      <section style={{ border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 20 }}>
        <h2 style={{ margin: "0 0 6px", fontSize: 17 }}>Rotate keys</h2>
        <p style={{ margin: "6px 0 14px", color: "#a1a1aa", fontSize: 14 }}>Rotating invalidates the current keys, so update your app first.</p>
        <button style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #33333a", background: "transparent", color: "#f4f4f5", fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>Rotate secret key</button>
      </section>
    </main>
  );
}
