import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Database" };

const ACCENT = "#75ea5e";

export default function DatabasePage() {
  const sections = [
    { title: "Tables", desc: "Browse public tables and insert rows.", href: "/dashboard/table-editor", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 4v16"/></svg> },
    { title: "SQL Editor", desc: "Run bounded, read-only SQL queries against your database.", href: "/dashboard/sql-editor", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m8 8-5 4 5 4M16 8l5 4-5 4"/></svg> },
    { title: "Backups", desc: "Review available database backups and recovery options.", href: "/dashboard/backups", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.47"/></svg> },
  ];

  return (
    <main style={{ padding: "32px 40px" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: "0 0 6px", fontSize: 36, letterSpacing: "-.02em", fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500 }}>Database</h1>
        <p style={{ margin: 0, color: "#a1a1aa", fontSize: 15 }}>Browse and edit table data, run SQL, and review backups.</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 14 }}>
        {sections.map(({ title, desc, href, icon }) => (
          <Link key={title} href={href} style={{ border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 22, display: "flex", gap: 16, alignItems: "flex-start", textDecoration: "none", color: "inherit" }}>
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
      <p style={{ margin: "18px 0 0", color: "#71717a", fontSize: 13 }}>
        Database changes apply directly to your project. Use read-only mode for inspection and owner-only SQL mode for schema, role, and extension changes. SQL migrations are not versioned or applied automatically.
      </p>
    </main>
  );
}
