import type { Metadata } from "next";

export const metadata: Metadata = { title: "Plans" };

const ACCENT = "#75ea5e";

export default function PlansPage() {
  return (
    <main style={{ padding: "32px 40px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: "0 0 6px", fontSize: 36, letterSpacing: "-.02em", fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500 }}>Plans</h1>
        <p style={{ margin: 0, color: "#a1a1aa", fontSize: 15 }}>Your current plan and what the next one adds.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))", gap: 20 }}>
        <section style={{ border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 20 }}>
          <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 11, color: "#a1a1aa", marginBottom: 10 }}>CURRENT PLAN</div>
          <div style={{ fontSize: 32, fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500 }}>Free</div>
          <p style={{ color: "#a1a1aa", fontSize: 14, lineHeight: 1.6 }}>For side projects and experiments. 1 project, 500 MB database.</p>
        </section>

        <section style={{ border: `1px solid ${ACCENT}`, borderRadius: 12, background: "#151517", padding: 20 }}>
          <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 11, color: ACCENT, marginBottom: 10 }}>RECOMMENDED · PRO</div>
          <div style={{ fontSize: 32, fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500 }}>$29<span style={{ fontSize: 16, color: "#a1a1aa" }}>/mo</span></div>
          <p style={{ color: "#a1a1aa", fontSize: 14, lineHeight: 1.6 }}>For apps with real users. 5 projects, 8 GB database, custom domains.</p>
          <button style={{ padding: "8px 14px", borderRadius: 8, border: 0, background: "#f4f4f5", color: "#0b0b0c", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>Upgrade to Pro</button>
        </section>
      </div>

      <div style={{ height: 20 }} />

      <section style={{ border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 20 }}>
        <h2 style={{ margin: "0 0 6px", fontSize: 17 }}>Billing details</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 0", borderTop: "1px solid #26262a" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Payment method</div>
            <div style={{ fontSize: 13, color: "#a1a1aa" }}>None on file.</div>
          </div>
          <button style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #33333a", background: "transparent", color: "#f4f4f5", fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>Add</button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 0", borderTop: "1px solid #26262a" }}>
          <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 600 }}>Invoices</div></div>
          <span style={{ fontSize: 13, color: "#a1a1aa" }}>None yet</span>
        </div>
      </section>
    </main>
  );
}
