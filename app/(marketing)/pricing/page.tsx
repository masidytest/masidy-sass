import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Pricing" };

const ACCENT = "#75ea5e";

export default function PricingPage() {
  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(#2c2c30 1px,transparent 1.3px) 0 0/18px 18px,#0e0e0f", color: "#f4f4f5", fontFamily: "'Geist',system-ui,sans-serif" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 28px", boxSizing: "border-box" }}>
        <nav style={{ display: "flex", alignItems: "center", gap: 28, height: 68, flexWrap: "wrap", fontSize: 14, color: "#a1a1aa" }}>
          <Link href="/" style={{ color: "#f4f4f5", fontWeight: 600, fontSize: 19, textDecoration: "none" }}>masidy</Link>
          <Link href="/#services" style={{ color: "inherit", textDecoration: "none" }}>Services</Link>
          <Link href="/pricing" style={{ color: "#f4f4f5", textDecoration: "none" }}>Pricing</Link>
          <span style={{ flex: 1 }} />
          <Link href="/sign-in" style={{ color: "inherit", textDecoration: "none" }}>Sign in</Link>
          <Link href="/sign-in" style={{ padding: "9px 16px", borderRadius: 8, background: "#f4f4f5", color: "#0b0b0c", fontWeight: 600, textDecoration: "none" }}>Start free</Link>
        </nav>

        <header style={{ textAlign: "center", padding: "72px 0 56px" }}>
          <h1 style={{ margin: "0 0 16px", fontSize: "clamp(40px,6vw,64px)", lineHeight: 1.05, letterSpacing: "-.03em", fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500 }}>
            Simple, predictable pricing<span style={{ color: ACCENT }}>.</span>
          </h1>
          <p style={{ margin: 0, fontSize: 19, color: "#a1a1aa" }}>Start free. Upgrade when you need the room.</p>
        </header>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16, alignItems: "stretch" }}>
          {/* Free */}
          <article style={{ padding: 32, borderRadius: 14, border: "1px solid #26262a", background: "#151517", color: "#f4f4f5", display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "'Geist Mono',monospace", fontSize: 12, color: "#a1a1aa" }}>
              <span>FREE</span><span />
            </div>
            <div style={{ fontSize: 44, letterSpacing: "-.02em", fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500 }}>$0<span style={{ fontSize: 18, color: "#a1a1aa" }}>/mo</span></div>
            <p style={{ margin: "0 0 12px", color: "#a1a1aa", lineHeight: 1.5, fontSize: 15 }}>For side projects and experiments. 1 project, 500 MB database.</p>
            <Link href="/sign-in" style={{ marginTop: "auto", textAlign: "center", padding: "13px 22px", borderRadius: 8, border: "1px solid #33333a", textDecoration: "none", color: "#f4f4f5" }}>Start free</Link>
          </article>

          {/* Pro — highlighted */}
          <article style={{ padding: 32, borderRadius: 14, border: `1px solid ${ACCENT}`, background: "#151517", color: "#f4f4f5", display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "'Geist Mono',monospace", fontSize: 12, color: "#a1a1aa" }}>
              <span>PRO</span><span style={{ color: ACCENT }}>RECOMMENDED</span>
            </div>
            <div style={{ fontSize: 44, letterSpacing: "-.02em", fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500 }}>$29<span style={{ fontSize: 18, color: "#a1a1aa" }}>/mo</span></div>
            <p style={{ margin: "0 0 12px", color: "#a1a1aa", lineHeight: 1.5, fontSize: 15 }}>For apps with real users. 5 projects, 8 GB database, custom domains.</p>
            <Link href="/sign-in" style={{ marginTop: "auto", textAlign: "center", padding: "13px 22px", borderRadius: 8, background: "#f4f4f5", color: "#0b0b0c", fontWeight: 600, textDecoration: "none" }}>Choose Pro</Link>
          </article>

          {/* Team */}
          <article style={{ padding: 32, borderRadius: 14, border: "1px solid #26262a", background: "#151517", color: "#f4f4f5", display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "'Geist Mono',monospace", fontSize: 12, color: "#a1a1aa" }}>
              <span>TEAM</span><span />
            </div>
            <div style={{ fontSize: 44, letterSpacing: "-.02em", fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500 }}>$99<span style={{ fontSize: 18, color: "#a1a1aa" }}>/mo</span></div>
            <p style={{ margin: "0 0 12px", color: "#a1a1aa", lineHeight: 1.5, fontSize: 15 }}>For teams that need more control. 25 projects, 50 GB database, team roles.</p>
            <Link href="mailto:hi@masidy.app" style={{ marginTop: "auto", textAlign: "center", padding: "13px 22px", borderRadius: 8, border: "1px solid #33333a", textDecoration: "none", color: "#f4f4f5" }}>Talk to us</Link>
          </article>
        </section>

        <footer style={{ padding: 48 }}>
          <Link href="/" style={{ fontSize: 14, color: "#a1a1aa", textDecoration: "none" }}>← Back home</Link>
        </footer>
      </div>
    </div>
  );
}
