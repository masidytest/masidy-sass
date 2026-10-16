"use client";

import { useState } from "react";

export default function EmailPage() {
  const [fromName, setFromName] = useState("");
  const [fromAddr, setFromAddr] = useState("");
  const [verifyMsg, setVerifyMsg] = useState("");

  async function verifyDomain(e: React.FormEvent) {
    e.preventDefault();
    const domain = fromAddr.split("@")[1];
    if (!domain) { setVerifyMsg("Enter a valid from address first."); return; }
    try {
      const r = await fetch(`/api/projects/YOUR_PROJECT_ID/email/domain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      });
      const data = await r.json();
      setVerifyMsg(data.status ?? data.error ?? "Domain added");
    } catch {
      setVerifyMsg("Request failed");
    }
  }

  return (
    <main style={{ padding: "32px 40px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: "0 0 6px", fontSize: 36, letterSpacing: "-.02em", fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500 }}>Email</h1>
        <p style={{ margin: 0, color: "#a1a1aa", fontSize: 15 }}>Send transactional email from the same dashboard.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))", gap: 20 }}>
        {/* Sender */}
        <section style={{ border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 20 }}>
          <h2 style={{ margin: "0 0 6px", fontSize: 17 }}>Sender</h2>
          <form onSubmit={verifyDomain} style={{ marginTop: 14 }}>
            <label htmlFor="fn" style={{ display: "block", fontSize: 13, color: "#a1a1aa", marginBottom: 6 }}>From name</label>
            <input id="fn" type="text" placeholder="Your App" value={fromName} onChange={e => setFromName(e.target.value)} style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8, border: "1px solid #33333a", background: "#0e0e0f", color: "#f4f4f5", fontSize: 14, fontFamily: "inherit", marginBottom: 16 }} />
            <label htmlFor="fa" style={{ display: "block", fontSize: 13, color: "#a1a1aa", marginBottom: 6 }}>From address</label>
            <input id="fa" type="text" placeholder="hello@yourdomain.com" value={fromAddr} onChange={e => setFromAddr(e.target.value)} style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8, border: "1px solid #33333a", background: "#0e0e0f", color: "#f4f4f5", fontSize: 14, fontFamily: "inherit", marginBottom: 16 }} />
            <button type="submit" style={{ padding: "8px 14px", borderRadius: 8, border: 0, background: "#f4f4f5", color: "#0b0b0c", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>Verify domain</button>
          </form>
          {verifyMsg && <p style={{ marginTop: 12, fontSize: 14, color: "#a1a1aa" }}>{verifyMsg}</p>}
        </section>

        {/* Templates */}
        <section style={{ border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 20 }}>
          <h2 style={{ margin: "0 0 6px", fontSize: 17 }}>Templates</h2>
          {[{ name: "Welcome" }, { name: "Magic link" }, { name: "Password reset" }].map(({ name }) => (
            <div key={name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 0", borderTop: "1px solid #26262a" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{name}</div>
                <div style={{ fontSize: 13, color: "#a1a1aa" }}>Default template</div>
              </div>
              <button style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #33333a", background: "transparent", color: "#f4f4f5", fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>Edit</button>
            </div>
          ))}
        </section>
      </div>

      <div style={{ height: 20 }} />

      {/* Sent email */}
      <section style={{ border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 20 }}>
        <h2 style={{ margin: "0 0 6px", fontSize: 17 }}>Sent email</h2>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 8, padding: "10px 0", borderBottom: "1px solid #26262a", fontFamily: "'Geist Mono',monospace", fontSize: 11, color: "#71717a" }}>
          <span>TO</span><span>TEMPLATE</span><span>STATUS</span>
        </div>
        <div style={{ padding: "56px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 6 }}>Nothing sent yet</div>
          <p style={{ margin: 0, color: "#a1a1aa", fontSize: 14 }}>Emails your app sends show up here.</p>
        </div>
      </section>
    </main>
  );
}
