import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Masidy — Ship the product. We run the rest." };

const ACCENT = "#75ea5e";

export default function HomePage() {
  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(#2c2c30 1px,transparent 1.3px) 0 0/18px 18px,#0e0e0f", color: "#f4f4f5", fontFamily: "'Geist',system-ui,sans-serif" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 28px", boxSizing: "border-box" }}>

        {/* Nav */}
        <nav style={{ display: "flex", alignItems: "center", gap: 28, height: 68, flexWrap: "wrap", fontSize: 14, color: "#a1a1aa" }}>
          <Link href="/" style={{ color: "#f4f4f5", fontWeight: 600, fontSize: 19, textDecoration: "none" }}>masidy</Link>
          <Link href="/#services" style={{ color: "inherit", textDecoration: "none" }}>Services</Link>
          <Link href="/pricing" style={{ color: "inherit", textDecoration: "none" }}>Pricing</Link>
          <span style={{ flex: 1 }} />
          <Link href="/sign-in" style={{ color: "inherit", textDecoration: "none" }}>Sign in</Link>
          <Link href="/sign-in" style={{ padding: "9px 16px", borderRadius: 8, background: "#f4f4f5", color: "#0b0b0c", fontWeight: 600, textDecoration: "none" }}>Start free</Link>
        </nav>

        {/* Hero */}
        <header style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(420px,1fr))", gap: 56, alignItems: "center", padding: "72px 0 88px" }}>
          <div>
            <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 12, color: "#a1a1aa", marginBottom: 24 }}>
              <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 99, background: ACCENT, marginRight: 8 }} />
              DATABASE · AUTH · DOMAINS · STORAGE · EMAIL
            </div>
            <h1 style={{ margin: "0 0 24px", fontSize: "clamp(46px,6vw,76px)", lineHeight: 1, letterSpacing: "-.03em", fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500 }}>
              Ship the product. We run the rest<span style={{ color: ACCENT }}>.</span>
            </h1>
            <p style={{ margin: "0 0 32px", fontSize: 19, lineHeight: 1.55, color: "#a1a1aa", maxWidth: 480 }}>
              A database, logins, domains and email behind one API and one dashboard, built for developers.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link href="/sign-in" style={{ padding: "13px 22px", borderRadius: 8, background: "#f4f4f5", color: "#0b0b0c", fontWeight: 600, textDecoration: "none" }}>Start free</Link>
              <Link href="/pricing" style={{ padding: "13px 22px", borderRadius: 8, border: "1px solid #33333a", textDecoration: "none", color: "inherit" }}>See pricing</Link>
            </div>
          </div>
          <div style={{ border: "1px solid #26262a", borderRadius: 14, overflow: "hidden", background: "#151517" }}>
            <video
              src="/showreel.mp4"
              autoPlay
              muted
              loop
              playsInline
              controls
              aria-label="Masidy 15-second showreel"
              style={{ display: "block", width: "100%", aspectRatio: "16/9", objectFit: "cover" }}
            />
            <div style={{ display: "flex", gap: 10, padding: "14px 16px", borderTop: "1px solid #26262a", fontSize: 13, color: "#a1a1aa" }}>
              <span style={{ color: ACCENT }}>●</span> The 15-second tour
            </div>
          </div>
        </header>

        {/* Services */}
        <section id="services" style={{ paddingBottom: 96 }}>
          <div style={{ textAlign: "center", margin: "0 auto 48px", maxWidth: 640 }}>
            <h2 style={{ margin: "0 0 12px", fontSize: "clamp(30px,4vw,44px)", lineHeight: 1.1, letterSpacing: "-.02em", fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500 }}>Services for every project</h2>
            <p style={{ margin: 0, color: "#a1a1aa", fontSize: 17, lineHeight: 1.5 }}>Pick what you need today. Add the rest when your app grows.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16 }}>
            {[
              { title: "Database", desc: "Full SQL with real tables. Export any time." },
              { title: "Auth", desc: "Email, social and magic-link logins." },
              { title: "Domains", desc: "Search, buy and connect a domain in minutes." },
              { title: "Storage", desc: "Upload, transform and serve your files." },
              { title: "Email", desc: "Send transactional email from the same dashboard." },
            ].map(({ title, desc }) => (
              <article key={title} style={{ padding: 28, borderRadius: 14, border: "1px solid #26262a", background: "#151517", display: "flex", flexDirection: "column", gap: 10 }}>
                <h3 style={{ margin: 0, fontSize: 28, letterSpacing: "-.02em", fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500 }}>{title}</h3>
                <p style={{ margin: "0 0 8px", color: "#a1a1aa", lineHeight: 1.5, fontSize: 15 }}>{desc}</p>
                <Link href="/sign-in" style={{ marginTop: "auto", fontSize: 14, fontWeight: 600, color: ACCENT, textDecoration: "none" }}>Explore {title} →</Link>
              </article>
            ))}
          </div>
        </section>

        {/* Features */}
        <section style={{ paddingBottom: 96 }}>
          <div style={{ textAlign: "center", margin: "0 auto 48px", maxWidth: 640 }}>
            <h2 style={{ margin: "0 0 12px", fontSize: "clamp(30px,4vw,44px)", lineHeight: 1.1, letterSpacing: "-.02em", fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500 }}>Built the way developers like it</h2>
            <p style={{ margin: 0, color: "#a1a1aa", fontSize: 17 }}>Fewer dashboards to babysit, more time shipping.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", columnGap: 48 }}>
            {[
              { title: "One client, every service", desc: "Auth, data, domains and email through a single API." },
              { title: "SQL you own", desc: "Real Postgres-style tables you can export whenever you like." },
              { title: "Per-user access rules", desc: "Decide who can read and write each row." },
              { title: "Your own domain, wired up", desc: "Connect it to your app without touching DNS by hand." },
            ].map(({ title, desc }) => (
              <div key={title} style={{ padding: "24px 0", borderTop: "1px solid #26262a" }}>
                <h3 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 600 }}>{title}</h3>
                <p style={{ margin: 0, color: "#a1a1aa", lineHeight: 1.55, fontSize: 15 }}>{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section style={{ textAlign: "center", padding: "80px 0 96px", borderTop: "1px solid #26262a" }}>
          <h2 style={{ margin: "0 0 28px", fontSize: "clamp(34px,5vw,56px)", letterSpacing: "-.02em", fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500 }}>Start building on Masidy</h2>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/sign-in" style={{ padding: "13px 22px", borderRadius: 8, background: "#f4f4f5", color: "#0b0b0c", fontWeight: 600, textDecoration: "none" }}>Start free</Link>
            <Link href="/pricing" style={{ padding: "13px 22px", borderRadius: 8, border: "1px solid #33333a", textDecoration: "none", color: "inherit" }}>See pricing</Link>
          </div>
        </section>

        {/* Footer */}
        <footer style={{ padding: "40px 0", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16, fontSize: 14, color: "#a1a1aa", borderTop: "1px solid #26262a" }}>
          <span>© Masidy</span>
          <span style={{ display: "flex", gap: 24 }}>
            <Link href="/#services" style={{ color: "inherit", textDecoration: "none" }}>Services</Link>
            <Link href="/pricing" style={{ color: "inherit", textDecoration: "none" }}>Pricing</Link>
            <Link href="/sign-in" style={{ color: "inherit", textDecoration: "none" }}>Sign in</Link>
          </span>
        </footer>
      </div>
    </div>
  );
}
