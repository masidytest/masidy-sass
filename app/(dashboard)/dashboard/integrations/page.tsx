import type { Metadata } from "next";

export const metadata: Metadata = { title: "Integrations" };

const ACCENT = "#75ea5e";

const integrations = [
  { name: "Vercel", desc: "Sync environment variables with your Vercel projects.", category: "Deployment", connected: true },
  { name: "GitHub", desc: "Connect your repo for branch-based deployments.", category: "Source control", connected: false },
  { name: "Stripe", desc: "Handle billing and subscription management.", category: "Payments", connected: false },
  { name: "Resend", desc: "Send transactional email from your app.", category: "Email", connected: false },
  { name: "Cloudflare", desc: "CDN, DNS and edge workers integration.", category: "Infrastructure", connected: false },
  { name: "Sentry", desc: "Error tracking and performance monitoring.", category: "Observability", connected: false },
];

export default function IntegrationsPage() {
  return (
    <main style={{ padding: "32px 40px" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: "0 0 6px", fontSize: 36, letterSpacing: "-.02em", fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500 }}>Integrations</h1>
        <p style={{ margin: 0, color: "#a1a1aa", fontSize: 15 }}>Connect third-party tools and services to your project.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 14 }}>
        {integrations.map(({ name, desc, category, connected }) => (
          <div key={name} style={{ border: `1px solid ${connected ? ACCENT + "44" : "#26262a"}`, borderRadius: 12, background: "#151517", padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{name}</div>
                <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 11, color: "#71717a" }}>{category}</div>
              </div>
              {connected && (
                <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 10, padding: "2px 8px", borderRadius: 99, background: `${ACCENT}22`, color: ACCENT }}>CONNECTED</span>
              )}
            </div>
            <p style={{ margin: 0, fontSize: 13, color: "#a1a1aa", lineHeight: 1.5 }}>{desc}</p>
            <button style={{ alignSelf: "flex-start", padding: "7px 14px", borderRadius: 8, border: "1px solid #33333a", background: "transparent", color: connected ? "#f87171" : "#f4f4f5", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
              {connected ? "Disconnect" : "Connect"}
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
