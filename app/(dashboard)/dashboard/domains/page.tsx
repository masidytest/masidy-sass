"use client";

import { useState } from "react";
import type { Metadata } from "next";

export default function DomainsPage() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<{ purchasePrice?: number | string; available?: boolean } | null>(null);
  const [searching, setSearching] = useState(false);
  const [connectDomain, setConnectDomain] = useState("");
  const [connectMsg, setConnectMsg] = useState("");

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (!query) return;
    setSearching(true);
    setResult(null);
    try {
      const r = await fetch(`/api/projects/YOUR_PROJECT_ID/domains/search?q=${encodeURIComponent(query)}`);
      const data = await r.json();
      setResult(data);
    } catch {
      setResult(null);
    }
    setSearching(false);
  }

  async function connect(e: React.FormEvent) {
    e.preventDefault();
    if (!connectDomain) return;
    try {
      const r = await fetch(`/api/projects/YOUR_PROJECT_ID/domains/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: connectDomain }),
      });
      const data = await r.json();
      setConnectMsg(data.next ?? data.error ?? "Done");
    } catch {
      setConnectMsg("Request failed");
    }
  }

  return (
    <main style={{ padding: "32px 40px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <h1 style={{ margin: "0 0 6px", fontSize: 36, letterSpacing: "-.02em", fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500 }}>Domains</h1>
          <p style={{ margin: 0, color: "#a1a1aa", fontSize: 15 }}>Search, buy and connect a domain in minutes.</p>
        </div>
      </div>

      {/* Search */}
      <section style={{ border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 20, marginBottom: 20 }}>
        <h2 style={{ margin: "0 0 6px", fontSize: 17 }}>Find a domain</h2>
        <form onSubmit={search} style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <label htmlFor="d" style={{ position: "absolute", left: -9999 }}>Domain</label>
          <input id="d" placeholder="yourapp.com" value={query} onChange={e => setQuery(e.target.value)} style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: "1px solid #33333a", background: "#0e0e0f", color: "#f4f4f5", fontSize: 14, fontFamily: "inherit" }} />
          <button type="submit" style={{ padding: "8px 14px", borderRadius: 8, border: 0, background: "#f4f4f5", color: "#0b0b0c", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
            {searching ? "…" : "Search"}
          </button>
        </form>
        {result && (
          <div style={{ marginTop: 14, padding: "12px 14px", borderRadius: 8, background: "#0e0e0f", border: "1px solid #26262a", fontSize: 14, color: "#a1a1aa" }}>
            {result.purchasePrice !== undefined
              ? `${query} — $${result.purchasePrice}/yr`
              : JSON.stringify(result)}
          </div>
        )}
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))", gap: 20 }}>
        {/* Connected domains */}
        <section style={{ border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 20 }}>
          <h2 style={{ margin: "0 0 6px", fontSize: 17 }}>Connected domains</h2>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 8, padding: "10px 0", borderBottom: "1px solid #26262a", fontFamily: "'Geist Mono',monospace", fontSize: 11, color: "#71717a" }}>
            <span>DOMAIN</span><span>STATUS</span>
          </div>
          <div style={{ padding: "56px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 6 }}>No domain connected</div>
            <p style={{ margin: 0, color: "#a1a1aa", fontSize: 14 }}>Buy one above or connect one you already own.</p>
          </div>
        </section>

        {/* Connect your own */}
        <section style={{ border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 20 }}>
          <h2 style={{ margin: "0 0 6px", fontSize: 17 }}>Connect an existing domain</h2>
          <form onSubmit={connect} style={{ marginTop: 14 }}>
            <label htmlFor="cd" style={{ display: "block", fontSize: 13, color: "#a1a1aa", marginBottom: 6 }}>Domain</label>
            <input id="cd" placeholder="yourapp.com" value={connectDomain} onChange={e => setConnectDomain(e.target.value)} style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8, border: "1px solid #33333a", background: "#0e0e0f", color: "#f4f4f5", fontSize: 14, fontFamily: "inherit", marginBottom: 14 }} />
            <button type="submit" style={{ padding: "8px 14px", borderRadius: 8, border: 0, background: "#f4f4f5", color: "#0b0b0c", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>Connect</button>
          </form>
          {connectMsg && <p style={{ marginTop: 12, fontSize: 14, color: "#a1a1aa" }}>{connectMsg}</p>}
          <p style={{ margin: "16px 0 0", color: "#a1a1aa", fontSize: 14, lineHeight: 1.6 }}>We wire the domain to your app for you, so you never edit DNS by hand.</p>
        </section>
      </div>
    </main>
  );
}
