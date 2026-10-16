import type { Metadata } from "next";

export const metadata: Metadata = { title: "Logs" };

export default function LogsPage() {
  return (
    <main style={{ padding: "32px 40px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: "0 0 6px", fontSize: 36, letterSpacing: "-.02em", fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500 }}>Logs</h1>
        <p style={{ margin: 0, color: "#a1a1aa", fontSize: 15 }}>Every request to your project.</p>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        {["Last hour ▾", "All services ▾", "All statuses ▾"].map(label => (
          <button key={label} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #33333a", background: "transparent", color: "#f4f4f5", fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>{label}</button>
        ))}
      </div>

      <section style={{ border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 3fr 80px", gap: 8, padding: "10px 0", borderBottom: "1px solid #26262a", fontFamily: "'Geist Mono',monospace", fontSize: 11, color: "#71717a" }}>
          <span>TIME</span><span>METHOD</span><span>PATH</span><span>STATUS</span>
        </div>
        <div style={{ padding: "56px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 6 }}>No requests yet</div>
          <p style={{ margin: 0, color: "#a1a1aa", fontSize: 14 }}>Make a call from your app and it appears here within seconds.</p>
        </div>
      </section>
    </main>
  );
}
