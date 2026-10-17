import type { Metadata } from "next";

export const metadata: Metadata = { title: "Edge Functions" };

const ACCENT = "#75ea5e";

export default function EdgeFunctionsPage() {
  return (
    <main style={{ padding: "32px 40px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: "0 0 6px", fontSize: 36, letterSpacing: "-.02em", fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500 }}>Edge Functions</h1>
          <p style={{ margin: 0, color: "#a1a1aa", fontSize: 15 }}>Globally distributed TypeScript functions, deployed in seconds.</p>
        </div>
        <button style={{ padding: "8px 16px", borderRadius: 8, border: 0, background: "#f4f4f5", color: "#0b0b0c", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
          Deploy function
        </button>
      </div>

      <div style={{ border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 20, marginBottom: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 100px 100px", gap: 8, padding: "10px 0", borderBottom: "1px solid #26262a", fontFamily: "'Geist Mono',monospace", fontSize: 11, color: "#71717a" }}>
          <span>NAME</span><span>URL</span><span>VERSION</span><span>STATUS</span>
        </div>
        <div style={{ padding: "56px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 6 }}>No functions deployed yet</div>
          <p style={{ margin: "0 0 20px", color: "#a1a1aa", fontSize: 14 }}>Deploy your first edge function to run server-side code at the edge.</p>
          <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 13, padding: "14px 18px", borderRadius: 8, background: "#0e0e0f", border: "1px solid #26262a", display: "inline-block", textAlign: "left" }}>
            <span style={{ color: "#71717a" }}>$ </span>supabase functions deploy my-function
          </div>
        </div>
      </div>

      <section style={{ border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 20 }}>
        <h2 style={{ margin: "0 0 14px", fontSize: 17 }}>Quick start</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 12 }}>
          {[
            { title: "Hello World", desc: "A simple function that returns a response." },
            { title: "Send email", desc: "Send email using Resend from a function." },
            { title: "Stripe webhook", desc: "Handle Stripe payment webhooks." },
          ].map(({ title, desc }) => (
            <div key={title} style={{ border: "1px solid #26262a", borderRadius: 8, padding: "14px 16px" }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{title}</div>
              <div style={{ fontSize: 13, color: "#a1a1aa" }}>{desc}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
