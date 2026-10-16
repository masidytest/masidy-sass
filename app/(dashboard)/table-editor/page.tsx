import type { Metadata } from "next";

export const metadata: Metadata = { title: "Table editor" };

const ACCENT = "#75ea5e";

export default function TableEditorPage() {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      {/* Page top bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", borderBottom: "1px solid #26262a", flexWrap: "wrap" }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>table_name</h1>
        <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 11, padding: "3px 8px", borderRadius: 99, border: "1px solid #33333a", color: "#a1a1aa" }}>ACCESS RULES: OFF</span>
        <span style={{ flex: 1 }} />
        <button style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #33333a", background: "transparent", color: "#f4f4f5", fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>Export</button>
        <button style={{ padding: "7px 14px", borderRadius: 8, border: 0, background: "#f4f4f5", color: "#0b0b0c", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>Insert row</button>
      </div>

      <div style={{ display: "flex", flex: 1 }}>
        {/* Tables sidebar */}
        <div style={{ width: 220, flexShrink: 0, borderRight: "1px solid #26262a", padding: "16px 12px", boxSizing: "border-box" }}>
          <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 11, color: "#71717a", padding: "0 8px 8px" }}>TABLES</div>
          <div style={{ padding: 8, borderRadius: 8, background: "#1c1c1f", fontSize: 14 }}>table_name</div>
          <button style={{ marginTop: 12, width: "100%", padding: 8, borderRadius: 8, border: "1px dashed #33333a", background: "transparent", color: "#a1a1aa", fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>+ New table</button>
        </div>

        {/* Table content */}
        <main style={{ flex: 1, minWidth: 0 }}>
          <div style={{ overflowX: "auto" }}>
            <div style={{ minWidth: 640, display: "grid", gridTemplateColumns: "48px repeat(4,1fr)", borderBottom: "1px solid #26262a", background: "#151517" }}>
              <div style={{ padding: "10px 14px", borderRight: "1px solid #26262a" }} />
              {[["id", "uuid"], ["column", "text"], ["column", "int"], ["created_at", "timestamp"]].map(([col, type], i) => (
                <div key={i} style={{ padding: "10px 14px", borderRight: "1px solid #26262a", fontFamily: "'Geist Mono',monospace", fontSize: 12, color: "#a1a1aa", display: "flex", justifyContent: "space-between" }}>
                  <span>{col}</span><span style={{ color: "#71717a" }}>{type}</span>
                </div>
              ))}
            </div>
            <div style={{ padding: "80px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>This table is empty</div>
              <p style={{ margin: "0 0 20px", color: "#a1a1aa", fontSize: 14 }}>Insert a row, import a CSV, or write to it from your app.</p>
              <button style={{ padding: "9px 16px", borderRadius: 8, border: "1px solid #33333a", background: "transparent", color: "#f4f4f5", fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>Import CSV</button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
