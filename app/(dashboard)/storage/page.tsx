import type { Metadata } from "next";

export const metadata: Metadata = { title: "Storage" };

export default function StoragePage() {
  return (
    <main style={{ padding: "32px 40px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <h1 style={{ margin: "0 0 6px", fontSize: 36, letterSpacing: "-.02em", fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500 }}>Storage</h1>
          <p style={{ margin: 0, color: "#a1a1aa", fontSize: 15 }}>Upload, transform and serve your files.</p>
        </div>
        <button style={{ padding: "8px 14px", borderRadius: 8, border: 0, background: "#f4f4f5", color: "#0b0b0c", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>New bucket</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 20 }}>
        <section style={{ border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 20 }}>
          <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 11, color: "#71717a", marginBottom: 10 }}>BUCKETS</div>
          <p style={{ margin: 0, fontSize: 14, color: "#a1a1aa" }}>No buckets yet.</p>
        </section>

        <section style={{ border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 8, padding: "10px 0", borderBottom: "1px solid #26262a", fontFamily: "'Geist Mono',monospace", fontSize: 11, color: "#71717a" }}>
            <span>NAME</span><span>SIZE</span><span>UPDATED</span>
          </div>
          <div style={{ padding: "56px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 6 }}>Create a bucket to start</div>
            <p style={{ margin: "0 0 16px", color: "#a1a1aa", fontSize: 14 }}>Buckets hold your files and can be public or private.</p>
            <button style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #33333a", background: "transparent", color: "#f4f4f5", fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>New bucket</button>
          </div>
        </section>
      </div>
    </main>
  );
}
