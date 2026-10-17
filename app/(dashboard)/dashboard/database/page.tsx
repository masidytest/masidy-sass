import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Database" };

const ACCENT = "#75ea5e";

export default function DatabasePage() {
  const sections = [
    { title: "Tables", desc: "Create and manage your database tables.", href: "/dashboard/table-editor", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 4v16"/></svg> },
    { title: "SQL Editor", desc: "Run SQL queries against your database.", href: "/dashboard/sql-editor", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m8 8-5 4 5 4M16 8l5 4-5 4"/></svg> },
    { title: "Migrations", desc: "Track and apply schema migrations.", href: "#", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5"/><path d="M3 12c0 1.7 4 3 9 3s9-1.3 9-3"/></svg> },
    { title: "Backups", desc: "View and restore database backups.", href: "#", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.47"/></svg> },
    { title: "Roles", desc: "Manage database roles and permissions.", href: "#", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
    { title: "Extensions", desc: "Enable Postgres extensions for your project.", href: "#", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg> },
  ];

  return (
    <main style={{ padding: "32px 40px" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: "0 0 6px", fontSize: 36, letterSpacing: "-.02em", fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500 }}>Database</h1>
        <p style={{ margin: 0, color: "#a1a1aa", fontSize: 15 }}>Manage your Postgres database, schema, roles and extensions.</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 14 }}>
        {sections.map(({ title, desc, href, icon }) => (
          <Link key={title} href={href} style={{ border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 22, display: "flex", gap: 16, alignItems: "flex-start", textDecoration: "none", color: "inherit" }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = "#33333a")}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "#26262a")}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: "#1c1c1f", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: ACCENT }}>
              {icon}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{title}</div>
              <div style={{ fontSize: 13, color: "#a1a1aa", lineHeight: 1.5 }}>{desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
