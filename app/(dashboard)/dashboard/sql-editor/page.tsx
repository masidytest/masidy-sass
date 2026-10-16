import type { Metadata } from "next";

export const metadata: Metadata = { title: "SQL editor" };

export default function SqlEditorPage() {
  return (
    <main style={{ padding: "32px 40px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <h1 style={{ margin: "0 0 6px", fontSize: 36, letterSpacing: "-.02em", fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500 }}>SQL editor</h1>
          <p style={{ margin: 0, color: "#a1a1aa", fontSize: 15 }}>Query your database directly.</p>
        </div>
        <button style={{ padding: "8px 14px", borderRadius: 8, border: 0, background: "#f4f4f5", color: "#0b0b0c", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>Run query</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 20 }}>
        <section style={{ border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 20 }}>
          <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 11, color: "#71717a", marginBottom: 10 }}>SAVED QUERIES</div>
          <p style={{ margin: "0 0 14px", fontSize: 14, color: "#a1a1aa" }}>Nothing saved yet.</p>
          <button style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #33333a", background: "transparent", color: "#f4f4f5", fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>Save current query</button>
        </section>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <section style={{ border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "40px 1fr", fontFamily: "'Geist Mono',monospace", fontSize: 13, lineHeight: 1.8, background: "#0e0e0f", border: "1px solid #26262a", borderRadius: 8, padding: "12px 0" }}>
              <div style={{ textAlign: "right", paddingRight: 12, color: "#52525b" }}>1<br />2</div>
              <div style={{ paddingLeft: 4 }}>select * from table_name<br />limit 100;</div>
            </div>
          </section>
          <section style={{ border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 20 }}>
            <div style={{ padding: "10px 0", borderBottom: "1px solid #26262a", fontFamily: "'Geist Mono',monospace", fontSize: 11, color: "#71717a" }}>RESULTS</div>
            <div style={{ padding: "56px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 6 }}>No results yet</div>
              <p style={{ margin: 0, color: "#a1a1aa", fontSize: 14 }}>Run a query to see rows here.</p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
