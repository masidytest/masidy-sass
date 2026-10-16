import type { Metadata } from "next";

export const metadata: Metadata = { title: "Team and members" };

export default function TeamPage() {
  return (
    <main style={{ padding: "32px 40px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: "0 0 6px", fontSize: 36, letterSpacing: "-.02em", fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500 }}>Team and members</h1>
        <p style={{ margin: 0, color: "#a1a1aa", fontSize: 15 }}>Who has access to this project.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))", gap: 20 }}>
        {/* Members */}
        <section style={{ border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 20 }}>
          <h2 style={{ margin: "0 0 6px", fontSize: 17 }}>Members</h2>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 80px", gap: 8, padding: "10px 0", borderBottom: "1px solid #26262a", fontFamily: "'Geist Mono',monospace", fontSize: 11, color: "#71717a" }}>
            <span>MEMBER</span><span>ROLE</span><span />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 80px", gap: 8, alignItems: "center", padding: "14px 0", borderTop: "1px solid #26262a", fontSize: 14 }}>
            <span><b>You</b></span>
            <span>Owner</span>
            <span style={{ color: "#71717a" }}>You</span>
          </div>
        </section>

        {/* Invite */}
        <section style={{ border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 20 }}>
          <h2 style={{ margin: "0 0 6px", fontSize: 17 }}>Invite someone</h2>
          <div style={{ marginTop: 14 }}>
            <label htmlFor="ie" style={{ display: "block", fontSize: 13, color: "#a1a1aa", marginBottom: 6 }}>Email</label>
            <input id="ie" type="email" placeholder="teammate@example.com" style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8, border: "1px solid #33333a", background: "#0e0e0f", color: "#f4f4f5", fontSize: 14, fontFamily: "inherit", marginBottom: 16 }} />
            <label htmlFor="ir" style={{ display: "block", fontSize: 13, color: "#a1a1aa", marginBottom: 6 }}>Role</label>
            <input id="ir" type="text" placeholder="Developer" style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8, border: "1px solid #33333a", background: "#0e0e0f", color: "#f4f4f5", fontSize: 14, fontFamily: "inherit", marginBottom: 16 }} />
            <button style={{ padding: "8px 14px", borderRadius: 8, border: 0, background: "#f4f4f5", color: "#0b0b0c", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>Send invite</button>
          </div>
        </section>
      </div>

      <div style={{ height: 20 }} />

      {/* Roles reference */}
      <section style={{ border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 20 }}>
        <h2 style={{ margin: "0 0 6px", fontSize: 17 }}>Roles</h2>
        {[
          { role: "Owner", desc: "Full control, including billing and deleting the project." },
          { role: "Admin", desc: "Manage everything except billing and deletion." },
          { role: "Developer", desc: "Work with data, auth, storage and keys." },
          { role: "Read-only", desc: "View the dashboard without changing anything." },
        ].map(({ role, desc }) => (
          <div key={role} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 0", borderTop: "1px solid #26262a" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{role}</div>
              <div style={{ fontSize: 13, color: "#a1a1aa" }}>{desc}</div>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
