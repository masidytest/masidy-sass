import type { Metadata } from "next";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <main style={{ padding: "32px 40px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: "0 0 6px", fontSize: 36, letterSpacing: "-.02em", fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500 }}>Settings</h1>
        <p style={{ margin: 0, color: "#a1a1aa", fontSize: 15 }}>Project name, region and danger zone.</p>
      </div>

      {/* General */}
      <section style={{ border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 20, marginBottom: 20 }}>
        <h2 style={{ margin: "0 0 6px", fontSize: 17 }}>General</h2>
        <div style={{ marginTop: 14, maxWidth: 420 }}>
          <label htmlFor="pn" style={{ display: "block", fontSize: 13, color: "#a1a1aa", marginBottom: 6 }}>Project name</label>
          <input id="pn" type="text" placeholder="My Project" style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8, border: "1px solid #33333a", background: "#0e0e0f", color: "#f4f4f5", fontSize: 14, fontFamily: "inherit", marginBottom: 16 }} />
          <label htmlFor="rg" style={{ display: "block", fontSize: 13, color: "#a1a1aa", marginBottom: 6 }}>Region</label>
          <input id="rg" type="text" placeholder="us-east-1" style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8, border: "1px solid #33333a", background: "#0e0e0f", color: "#f4f4f5", fontSize: 14, fontFamily: "inherit", marginBottom: 16 }} />
          <button style={{ padding: "8px 14px", borderRadius: 8, border: 0, background: "#f4f4f5", color: "#0b0b0c", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>Save changes</button>
        </div>
      </section>

      {/* Danger zone */}
      <section style={{ border: "1px solid #3f1d1d", borderRadius: 12, background: "#151517", padding: 20 }}>
        <h2 style={{ margin: "0 0 6px", fontSize: 17 }}>Danger zone</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 0", borderTop: "1px solid #26262a" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Pause project</div>
            <div style={{ fontSize: 13, color: "#a1a1aa" }}>Your app stops responding until you resume it.</div>
          </div>
          <button style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #33333a", background: "transparent", color: "#f4f4f5", fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>Pause</button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 0", borderTop: "1px solid #26262a" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Delete project</div>
            <div style={{ fontSize: 13, color: "#a1a1aa" }}>This permanently removes your data.</div>
          </div>
          <button style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #7f1d1d", background: "transparent", color: "#f87171", fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>Delete</button>
        </div>
      </section>
    </main>
  );
}
