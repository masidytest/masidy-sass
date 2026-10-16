import type { Metadata } from "next";

export const metadata: Metadata = { title: "Account settings" };

const ACCENT = "#75ea5e";

export default function AccountPage() {
  return (
    <main style={{ padding: "32px 40px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: "0 0 6px", fontSize: 36, letterSpacing: "-.02em", fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500 }}>Account settings</h1>
        <p style={{ margin: 0, color: "#a1a1aa", fontSize: 15 }}>Your profile, security and preferences.</p>
      </div>

      {/* Profile */}
      <section style={{ border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 20, marginBottom: 20 }}>
        <h2 style={{ margin: "0 0 6px", fontSize: 17 }}>Profile</h2>
        <div style={{ marginTop: 14, maxWidth: 420 }}>
          <label htmlFor="dn" style={{ display: "block", fontSize: 13, color: "#a1a1aa", marginBottom: 6 }}>Display name</label>
          <input id="dn" type="text" placeholder="Your Name" style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8, border: "1px solid #33333a", background: "#0e0e0f", color: "#f4f4f5", fontSize: 14, fontFamily: "inherit", marginBottom: 16 }} />
          <label htmlFor="em" style={{ display: "block", fontSize: 13, color: "#a1a1aa", marginBottom: 6 }}>Email</label>
          <input id="em" type="email" placeholder="you@example.com" style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8, border: "1px solid #33333a", background: "#0e0e0f", color: "#f4f4f5", fontSize: 14, fontFamily: "inherit", marginBottom: 16 }} />
          <button style={{ padding: "8px 14px", borderRadius: 8, border: 0, background: "#f4f4f5", color: "#0b0b0c", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>Save profile</button>
        </div>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))", gap: 20 }}>
        {/* Security */}
        <section style={{ border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 20 }}>
          <h2 style={{ margin: "0 0 6px", fontSize: 17 }}>Security</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 0", borderTop: "1px solid #26262a" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Password</div>
              <div style={{ fontSize: 13, color: "#a1a1aa" }}>Update the password you sign in with.</div>
            </div>
            <button style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #33333a", background: "transparent", color: "#f4f4f5", fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>Change</button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 0", borderTop: "1px solid #26262a" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Two-factor authentication</div>
              <div style={{ fontSize: 13, color: "#a1a1aa" }}>Ask for a code when you sign in.</div>
            </div>
            <span style={{ width: 36, height: 20, borderRadius: 99, background: "#33333a", display: "flex", alignItems: "center", justifyContent: "flex-start", padding: 2, boxSizing: "border-box" }}>
              <span style={{ width: 16, height: 16, borderRadius: 99, background: "#0b0b0c" }} />
            </span>
          </div>
        </section>

        {/* Preferences */}
        <section style={{ border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 20 }}>
          <h2 style={{ margin: "0 0 6px", fontSize: 17 }}>Preferences</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 0", borderTop: "1px solid #26262a" }}>
            <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 600 }}>Appearance</div></div>
            <div style={{ display: "flex", gap: 8 }}>
              {["Dark", "Light", "System"].map((opt, i) => (
                <span key={opt} style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${i === 0 ? ACCENT : "#33333a"}`, fontSize: 14 }}>{opt}</span>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 0", borderTop: "1px solid #26262a" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Sidebar</div>
              <div style={{ fontSize: 13, color: "#a1a1aa" }}>Starting state when you open the dashboard.</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {["Open", "Hidden"].map((opt, i) => (
                <span key={opt} style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${i === 0 ? ACCENT : "#33333a"}`, fontSize: 14 }}>{opt}</span>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div style={{ height: 20 }} />

      {/* Sessions */}
      <section style={{ border: "1px solid #3f1d1d", borderRadius: 12, background: "#151517", padding: 20 }}>
        <h2 style={{ margin: "0 0 6px", fontSize: 17 }}>Sessions</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 0", borderTop: "1px solid #26262a" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Sign out everywhere</div>
            <div style={{ fontSize: 13, color: "#a1a1aa" }}>Ends every session except this one.</div>
          </div>
          <button style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #33333a", background: "transparent", color: "#f4f4f5", fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>Sign out all</button>
        </div>
      </section>
    </main>
  );
}
