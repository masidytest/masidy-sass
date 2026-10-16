"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

const ACCENT = "#75ea5e";

function NavItem({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 12px",
        borderRadius: 8,
        fontSize: 14,
        color: active ? "#f4f4f5" : "#a1a1aa",
        background: active ? "#1c1c1f" : "transparent",
        textDecoration: "none",
      }}
    >
      {children}
    </Link>
  );
}

interface SidebarProps {
  userName: string;
  userEmail: string;
  projectName: string;
  plan: string;
}

export function Sidebar({ userName, userEmail, projectName, plan }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(true);

  const initials = userName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  async function signOut() {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    await supabase.auth.signOut();
    router.push("/sign-in");
  }

  const toggleBtn = (
    <button
      aria-label={open ? "Hide sidebar" : "Show sidebar"}
      onClick={() => setOpen(!open)}
      style={{
        flexShrink: 0,
        width: 32,
        height: 32,
        borderRadius: 8,
        border: "1px solid #33333a",
        background: "transparent",
        color: "#f4f4f5",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16" />
      </svg>
    </button>
  );

  if (!open) {
    return (
      <div style={{ display: "flex", alignItems: "center", padding: "12px 16px", borderRight: "1px solid #26262a" }}>
        {toggleBtn}
      </div>
    );
  }

  return (
    <aside
      style={{
        width: 232,
        flexShrink: 0,
        boxSizing: "border-box",
        padding: "16px 12px",
        borderRight: "1px solid #26262a",
        display: "flex",
        flexDirection: "column",
        gap: 2,
        background: "#0e0e0f",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px 8px 0" }}>
        <Link href="/dashboard" style={{ fontWeight: 600, fontSize: 19, padding: "4px 12px", color: "#f4f4f5", textDecoration: "none" }}>
          masidy
        </Link>
        {toggleBtn}
      </div>

      {/* Project section */}
      <div style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11, color: "#71717a", padding: "18px 12px 6px" }}>PROJECT</div>
      <NavItem href="/dashboard" active={pathname === "/dashboard"}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" /></svg>
        Overview
      </NavItem>
      <NavItem href="/dashboard/table-editor" active={pathname === "/dashboard/table-editor"}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 10h18M9 4v16" /></svg>
        Table editor
      </NavItem>
      <NavItem href="/dashboard/sql-editor" active={pathname === "/dashboard/sql-editor"}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m8 8-5 4 5 4M16 8l5 4-5 4" /></svg>
        SQL editor
      </NavItem>

      {/* Services section */}
      <div style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11, color: "#71717a", padding: "18px 12px 6px" }}>SERVICES</div>
      <NavItem href="/dashboard/auth" active={pathname === "/dashboard/auth"}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>
        Auth
      </NavItem>
      <NavItem href="/dashboard/storage" active={pathname === "/dashboard/storage"}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 7l8-4 8 4v10l-8 4-8-4z" /></svg>
        Storage
      </NavItem>
      <NavItem href="/dashboard/domains" active={pathname === "/dashboard/domains"}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" /></svg>
        Domains
      </NavItem>
      <NavItem href="/dashboard/email" active={pathname === "/dashboard/email"}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
        Email
      </NavItem>

      {/* Observe section */}
      <div style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11, color: "#71717a", padding: "18px 12px 6px" }}>OBSERVE</div>
      <NavItem href="/dashboard/logs" active={pathname === "/dashboard/logs"}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h10" /></svg>
        Logs
      </NavItem>

      <span style={{ flex: 1 }} />

      {/* Bottom nav */}
      <NavItem href="/dashboard/api-keys" active={pathname === "/dashboard/api-keys"}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="8" cy="15" r="4" /><path d="m11 12 9-9M16 7l3 3" /></svg>
        API keys
      </NavItem>
      <NavItem href="/dashboard/settings" active={pathname === "/dashboard/settings"}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></svg>
        Settings
      </NavItem>
      <NavItem href="/dashboard/plans" active={pathname === "/dashboard/plans"}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l9 5-9 5-9-5zM3 13l9 5 9-5" /></svg>
        Plans
      </NavItem>
      <NavItem href="/dashboard/team" active={pathname === "/dashboard/team"}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-3.5 3-5 7-5s7 1.5 7 5M17 4.5a3.5 3.5 0 0 1 0 7M22 20c0-2.5-1.5-4-4-4.5"/></svg>
        Team
      </NavItem>

      {/* User profile */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 10, marginTop: 4, borderTop: "1px solid #26262a" }}>
        <span aria-hidden="true" style={{ width: 32, height: 32, flexShrink: 0, borderRadius: 99, background: "#26262a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600 }}>
          {initials}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userName}</div>
          <div style={{ fontSize: 12, color: "#a1a1aa", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userEmail}</div>
        </div>
        <Link
          href="/dashboard/account"
          aria-label="Account and settings"
          style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 8, border: "1px solid #33333a", background: "transparent", color: "#f4f4f5", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></svg>
        </Link>
      </div>
    </aside>
  );
}
