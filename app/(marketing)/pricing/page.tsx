import Link from "next/link";
import type { Metadata } from "next";
import { planCatalog } from "@/lib/plans";

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
          <Link href="/sign-in" style={{ padding: "9px 16px", borderRadius: 8, background: "#f4f4f5", color: "#0b0b0c", fontWeight: 600, textDecoration: "none" }}>Get started</Link>
        </nav>

        <header style={{ textAlign: "center", padding: "72px 0 56px" }}>
          <h1 style={{ margin: "0 0 16px", fontSize: "clamp(40px,6vw,64px)", lineHeight: 1.05, letterSpacing: "-.03em", fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500 }}>
            Simple, predictable pricing<span style={{ color: ACCENT }}>.</span>
          </h1>
          <p style={{ margin: 0, fontSize: 19, color: "#a1a1aa" }}>Choose a monthly plan that fits the number of projects you run.</p>
        </header>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16, alignItems: "stretch" }}>
          {Object.values(planCatalog).map((plan, index) => (
            <article key={plan.name} style={{ padding: 32, borderRadius: 14, border: `1px solid ${index === 2 ? ACCENT : "#26262a"}`, background: "#151517", color: "#f4f4f5", display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "'Geist Mono',monospace", fontSize: 12, color: "#a1a1aa" }}>
                <span>{plan.name.toUpperCase()}</span><span />
              </div>
              <div style={{ fontSize: 44, letterSpacing: "-.02em", fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500 }}>${plan.amount / 100}<span style={{ fontSize: 18, color: "#a1a1aa" }}>/mo</span></div>
              <p style={{ margin: "0 0 12px", color: "#a1a1aa", lineHeight: 1.5, fontSize: 15 }}>{plan.description} Up to {plan.projectLimit} {plan.projectLimit === 1 ? "project" : "projects"}.</p>
              <Link href="/sign-in" style={{ marginTop: "auto", textAlign: "center", padding: "13px 22px", borderRadius: 8, border: index === 2 ? 0 : "1px solid #33333a", background: index === 2 ? "#f4f4f5" : "transparent", color: index === 2 ? "#0b0b0c" : "#f4f4f5", fontWeight: 600, textDecoration: "none" }}>Choose {plan.name}</Link>
            </article>
          ))}
        </section>
        <p style={{ textAlign: "center", color: "#71717a", fontSize: 13, marginTop: 22 }}>Billed monthly in USD. Project limits are enforced per organization.</p>

        <footer style={{ padding: 48 }}>
          <Link href="/" style={{ fontSize: 14, color: "#a1a1aa", textDecoration: "none" }}>← Back home</Link>
        </footer>
      </div>
    </div>
  );
}
