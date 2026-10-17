"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

const ACCENT = "#75ea5e";

type SidebarMode = "expanded" | "collapsed" | "hover";

const NAV = [
  { href: "/dashboard",                label: "Overview",         icon: "M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z" },
  { href: "/dashboard/table-editor",   label: "Table Editor",     icon: "M3 4h18a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 6h18M9 4v16" },
  { href: "/dashboard/sql-editor",     label: "SQL Editor",       icon: "m8 8-5 4 5 4M16 8l5 4-5 4" },
  { href: "/dashboard/database",       label: "Database",         icon: "M12 2C7 2 3 3.3 3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5c0-1.7-4-3-9-3zm0 0M3 12c0 1.7 4 3 9 3s9-1.3 9-3" },
  { href: "/dashboard/backups",        label: "Backups",          icon: "M4 4v6h6M5 15a8 8 0 1 0 1-7" },
  { href: "/dashboard/auth",           label: "Authentication",   icon: "M12 8a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-8 9c0-4 4-6 8-6s8 2 8 6" },
  { href: "/dashboard/storage",        label: "Storage",          icon: "M4 7l8-4 8 4v10l-8 4-8-4z" },
  { href: "/dashboard/email",          label: "Email",            icon: "M3 5h18v14H3zM3 6l9 7 9-7" },
  { href: "/dashboard/edge-functions", label: "Edge Functions",   icon: "M13 2 3 14h9l-1 8 10-12h-9l1-8z" },
  { href: "/dashboard/realtime",       label: "Realtime",         icon: "M22 12h-4l-3 9L9 3l-3 9H2" },
  { href: "/dashboard/compute",        label: "Compute",          icon: "M2 3h20v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V3zm6 18h8m-4-4v4" },
  { href: "/dashboard/advisors",       label: "Advisors",         icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" },
  { href: "/dashboard/observability",  label: "Observability",    icon: "M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" },
  { href: "/dashboard/logs",           label: "Logs",             icon: "M4 6h16M4 12h16M4 18h10" },
  { href: "/dashboard/integrations",   label: "Integrations",     icon: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" },
  { href: "/dashboard/api-keys",       label: "API Keys",         icon: "M8 15a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm3-1 9-9m-5 4 3 3" },
  { href: "/dashboard/domains",        label: "Domains",          icon: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 0M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" },
  { href: "/dashboard/team",           label: "Team",             icon: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m16-11a4 4 0 1 0 0-8m4 19v-2a4 4 0 0 0-3-3.87M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" },
  { href: "/dashboard/plans",          label: "Plans & billing",  icon: "M3 5h18v14H3zM3 10h18m-14 5h4" },
  { href: "/dashboard/settings",       label: "Project Settings", icon: "M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm0-7v3m0 15v3m-7-7H2m18 0h-3m-12.7-9.3-2.1-2.1m16.9 0-2.1 2.1M4.3 19.3l-2.1 2.1m16.9 0-2.1-2.1" },
  { href: "/dashboard/account",        label: "Account",          icon: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2m8-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" },
];

const DIVIDERS_AFTER = new Set([4, 9, 13, 16]);

interface SidebarProps { userName: string; userEmail: string; projectName: string; plan: string }

function Icon({ path }: { path: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
      style={{ flexShrink: 0 }}>
      <path d={path} />
    </svg>
  );
}

export function Sidebar({ userName, userEmail }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mode, setMode] = useState<SidebarMode>("collapsed");
  const [hovered, setHovered] = useState(false);
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const [tooltip, setTooltip] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");
  const modeMenuRef = useRef<HTMLDivElement>(null);

  // Persist mode
  useEffect(() => {
    try {
      const saved = localStorage.getItem("masidy_sidebar_mode") as SidebarMode | null;
      if (saved && ["expanded", "collapsed", "hover"].includes(saved)) setMode(saved);
    } catch { /* ignore */ }
  }, []);

  function setAndSaveMode(m: SidebarMode) {
    setMode(m);
    try { localStorage.setItem("masidy_sidebar_mode", m); } catch { /* ignore */ }
    setModeMenuOpen(false);
  }

  // Close mode menu on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (modeMenuRef.current && !modeMenuRef.current.contains(e.target as Node)) {
        setModeMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initial = (userName ?? "").trim().charAt(0).toUpperCase() || "?";

  async function signOut() {
    setSigningOut(true);
    setSignOutError("");
    try {
      const sb = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
      );
      const { error } = await sb.auth.signOut();
      if (error) throw error;
      router.push("/sign-in");
    } catch (error) {
      setSignOutError(error instanceof Error ? error.message : "Could not sign out.");
      setSigningOut(false);
    }
  }

  // Determine if labels should show
  const showLabels = mode === "expanded" || (mode === "hover" && hovered);
  const sidebarWidth = showLabels ? 220 : 48;

  return (
    <aside
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setTooltip(null); }}
      style={{
        width: sidebarWidth,
        flexShrink: 0,
        background: "#0e0e0f",
        borderRight: "1px solid #1c1c1f",
        display: "flex",
        flexDirection: "column",
        alignItems: showLabels ? "stretch" : "center",
        padding: "12px 0",
        minHeight: "100vh",
        position: "sticky",
        top: 0,
        zIndex: 40,
        transition: "width 0.2s ease",
        overflow: "hidden",
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: showLabels ? "0 12px 8px" : "0 0 8px", minHeight: 36 }}>
        <Link href="/dashboard" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, color: ACCENT, textDecoration: "none", flexShrink: 0 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-label="Masidy">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </Link>
        {showLabels && (
          <span style={{ fontSize: 15, fontWeight: 700, color: "#f4f4f5", letterSpacing: "-.01em" }}>masidy</span>
        )}
      </div>

      <div style={{ height: 1, background: "#1c1c1f", margin: "0 0 6px", width: showLabels ? "100%" : 32 }} />

      {/* Nav */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", width: "100%" }}>
        {NAV.map(({ href, label, icon }, i) => {
          const active = href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
          return (
            <div key={href} style={{ width: "100%" }}>
              <div
                style={{ position: "relative", display: "flex", justifyContent: showLabels ? "stretch" : "center", padding: showLabels ? "0 8px" : "0" }}
                onMouseEnter={() => { if (!showLabels) setTooltip(label); }}
                onMouseLeave={() => setTooltip(null)}
              >
                <Link href={href} aria-label={label} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  width: showLabels ? "100%" : 36,
                  height: 34,
                  borderRadius: 6,
                  padding: showLabels ? "0 10px" : "0",
                  justifyContent: showLabels ? "flex-start" : "center",
                  color: active ? "#f4f4f5" : "#52525b",
                  background: active ? "#1c1c1f" : "transparent",
                  textDecoration: "none",
                  fontSize: 13,
                  fontWeight: active ? 500 : 400,
                  transition: "background 0.1s",
                  margin: "1px 0",
                }}>
                  <Icon path={icon} />
                  {showLabels && <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>}
                </Link>

                {/* Tooltip for collapsed mode */}
                {!showLabels && tooltip === label && (
                  <div style={{
                    position: "absolute", left: "calc(100% + 8px)", top: "50%",
                    transform: "translateY(-50%)",
                    background: "#151517", border: "1px solid #26262a", borderRadius: 6,
                    padding: "5px 10px", fontSize: 12, whiteSpace: "nowrap",
                    color: "#f4f4f5", zIndex: 100, pointerEvents: "none",
                    boxShadow: "0 4px 16px rgba(0,0,0,.5)",
                  }}>
                    {label}
                  </div>
                )}
              </div>

              {DIVIDERS_AFTER.has(i) && (
                <div style={{ height: 1, background: "#1c1c1f", margin: "4px auto", width: showLabels ? "calc(100% - 16px)" : 28 }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom: mode picker + avatar */}
      <div style={{ width: "100%", padding: showLabels ? "6px 8px 0" : "6px 0 0", display: "flex", flexDirection: "column", alignItems: showLabels ? "stretch" : "center", gap: 4, borderTop: "1px solid #1c1c1f", marginTop: 4 }}>

        {/* Mode picker button */}
        <div style={{ position: "relative" }} ref={modeMenuRef}>
          <button
            onClick={() => setModeMenuOpen(o => !o)}
            aria-label="Sidebar display mode"
            title="Sidebar display mode"
            style={{
              display: "flex", alignItems: "center", gap: 8,
              width: showLabels ? "100%" : 36, height: 34,
              borderRadius: 6, border: "none", background: "transparent",
              color: "#52525b", cursor: "pointer", fontFamily: "inherit",
              fontSize: 13, padding: showLabels ? "0 10px" : "0",
              justifyContent: showLabels ? "flex-start" : "center",
            }}
          >
            {/* Layout icon */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/>
            </svg>
            {showLabels && <span>Sidebar control</span>}
          </button>

          {/* Mode menu popup */}
          {modeMenuOpen && (
            <div style={{
              position: "absolute", bottom: "calc(100% + 6px)",
              left: showLabels ? 0 : "calc(100% + 8px)",
              background: "#151517", border: "1px solid #26262a",
              borderRadius: 10, padding: "10px 0", minWidth: 180,
              zIndex: 200, boxShadow: "0 8px 32px rgba(0,0,0,.6)",
            }}>
              <div style={{ fontSize: 12, color: "#71717a", padding: "0 14px 8px", fontFamily: "'Geist Mono',monospace", letterSpacing: ".04em" }}>
                Sidebar control
              </div>
              {(["expanded", "collapsed", "hover"] as SidebarMode[]).map(m => (
                <button
                  key={m}
                  onClick={() => setAndSaveMode(m)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    width: "100%", padding: "8px 14px",
                    background: "transparent", border: "none",
                    color: mode === m ? "#f4f4f5" : "#a1a1aa",
                    fontSize: 13, cursor: "pointer", fontFamily: "inherit",
                    textAlign: "left",
                  }}
                >
                  {/* Active dot */}
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: mode === m ? "#f4f4f5" : "transparent", border: mode === m ? "none" : "1px solid #52525b", flexShrink: 0 }} />
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                  {m === "hover" && <span style={{ fontSize: 11, color: "#52525b", marginLeft: 2 }}>(expand on hover)</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Avatar + sign out */}
        {signOutError && <p role="alert" style={{ maxWidth: 210, margin: 0, padding: "4px 8px", color: "#f87171", fontSize: 11, overflowWrap: "anywhere" }}>{signOutError}</p>}
        <button
          onClick={signOut}
          disabled={signingOut}
          aria-label={`Sign out (${userEmail})`}
          title={`${userName} · ${userEmail}\n${signingOut ? "Signing out…" : "Click to sign out"}`}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            width: showLabels ? "100%" : 36, height: 34,
            borderRadius: 6, border: "none", background: "transparent",
            cursor: "pointer", fontFamily: "inherit", padding: showLabels ? "0 10px" : "0",
            justifyContent: showLabels ? "flex-start" : "center",
          }}
        >
          <span style={{ width: 24, height: 24, borderRadius: "50%", background: "#26262a", color: "#f4f4f5", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {initial}
          </span>
          {showLabels && (
            <div style={{ minWidth: 0, textAlign: "left" }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: "#f4f4f5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userName || userEmail}</div>
              <div style={{ fontSize: 11, color: "#71717a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userEmail}</div>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}
