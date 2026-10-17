import type { Metadata } from "next";

export const metadata: Metadata = { title: "Realtime" };

const ACCENT = "#75ea5e";

export default function RealtimePage() {
  return (
    <main style={{ padding: "32px 40px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: "0 0 6px", fontSize: 36, letterSpacing: "-.02em", fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500 }}>Realtime</h1>
        <p style={{ margin: 0, color: "#a1a1aa", fontSize: 15 }}>Listen to database changes, broadcast messages and track online users.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))", gap: 16, marginBottom: 20 }}>
        {[
          { title: "Broadcast", desc: "Send messages between clients with low latency.", metric: "0 msg/s" },
          { title: "Presence", desc: "Track which users are online in real time.", metric: "0 users" },
          { title: "Postgres Changes", desc: "Subscribe to database INSERT, UPDATE and DELETE.", metric: "0 listeners" },
        ].map(({ title, desc, metric }) => (
          <div key={title} style={{ border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{title}</div>
              <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 12, color: "#a1a1aa" }}>{metric}</span>
            </div>
            <div style={{ fontSize: 13, color: "#a1a1aa", lineHeight: 1.5 }}>{desc}</div>
          </div>
        ))}
      </div>

      <section style={{ border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 20 }}>
        <h2 style={{ margin: "0 0 6px", fontSize: 17 }}>Active channels</h2>
        <div style={{ padding: "48px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 6 }}>No active channels</div>
          <p style={{ margin: 0, color: "#a1a1aa", fontSize: 14 }}>Channels appear here when clients connect to your Realtime server.</p>
        </div>
      </section>
    </main>
  );
}
