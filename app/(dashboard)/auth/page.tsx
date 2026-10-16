import type { Metadata } from "next";

export const metadata: Metadata = { title: "Auth" };

const ACCENT = "#75ea5e";

function Toggle({ on }: { on: boolean }) {
  return (
    <span style={{ width: 36, height: 20, borderRadius: 99, background: on ? ACCENT : "#33333a", display: "flex", alignItems: "center", justifyContent: on ? "flex-end" : "flex-start", padding: 2, boxSizing: "border-box", flexShrink: 0 }}>
      <span style={{ width: 16, height: 16, borderRadius: 99, background: "#0b0b0c" }} />
    </span>
  );
}

export default function AuthPage() {
  return (
    <main style={{ padding: "32px 40px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <h1 style={{ margin: "0 0 6px", fontSize: 36, letterSpacing: "-.02em", fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500 }}>Auth</h1>
          <p style={{ margin: 0, color: "#a1a1aa", fontSize: 15 }}>Who can sign in to your app, and how.</p>
        </div>
        <button style={{ padding: "8px 14px", borderRadius: 8, border: 0, background: "#f4f4f5", color: "#0b0b0c", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>Invite user</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))", gap: 20 }}>
        <section style={{ border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 20 }}>
          <h2 style={{ margin: "0 0 6px", fontSize: 17 }}>Sign-in methods</h2>
          {[
            { name: "Email and password", desc: "Classic sign-in with a password.", on: true },
            { name: "Magic link", desc: "One-click sign-in from an emailed link.", on: true },
            { name: "GitHub", desc: "Needs a client ID and secret.", on: false },
            { name: "Google", desc: "Needs a client ID and secret.", on: false },
          ].map(({ name, desc, on }) => (
            <div key={name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 0", borderTop: "1px solid #26262a" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{name}</div>
                <div style={{ fontSize: 13, color: "#a1a1aa" }}>{desc}</div>
              </div>
              <Toggle on={on} />
            </div>
          ))}
        </section>

        <section style={{ border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 20 }}>
          <h2 style={{ margin: "0 0 6px", fontSize: 17 }}>Users</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", gap: 8, padding: "10px 0", borderBottom: "1px solid #26262a", fontFamily: "'Geist Mono',monospace", fontSize: 11, color: "#71717a" }}>
            <span>EMAIL</span><span>PROVIDER</span><span>LAST SIGN-IN</span>
          </div>
          <div style={{ padding: "56px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 6 }}>No users yet</div>
            <p style={{ margin: 0, color: "#a1a1aa", fontSize: 14 }}>People who sign in to your app appear here.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
