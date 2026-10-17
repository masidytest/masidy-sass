"use client";

import Link from "next/link";

const ACCENT = "#75ea5e";

interface TopBarProps {
  projectName: string;
  plan: string;
}

export function TopBar({ projectName, plan }: TopBarProps) {
  return (
    <div style={{
      height: 48,
      flexShrink: 0,
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "0 16px",
      borderBottom: "1px solid #1c1c1f",
      background: "#0e0e0f",
      fontSize: 13,
      color: "#a1a1aa",
    }}>
      {/* Org / project breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {/* Org avatar */}
        <div style={{ width: 22, height: 22, borderRadius: 6, background: "#26262a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#f4f4f5", flexShrink: 0 }}>
          {projectName.charAt(0).toUpperCase()}
        </div>
        <span style={{ color: "#f4f4f5", fontWeight: 500 }}>{projectName}</span>
      </div>

      <span style={{ color: "#33333a" }}>/</span>

      {/* Project */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {/* Project icon */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#71717a" }}>
          <path d="M12 2C7 2 3 3.3 3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5c0-1.7-4-3-9-3zm0 0M3 12c0 1.7 4 3 9 3s9-1.3 9-3"/>
        </svg>
        <span style={{ color: "#f4f4f5", fontWeight: 500 }}>{projectName}</span>
        {/* Plan badge */}
        <span style={{ fontSize: 10, fontFamily: "'Geist Mono',monospace", padding: "1px 6px", borderRadius: 4, background: "#26262a", color: "#a1a1aa", letterSpacing: ".04em" }}>
          {plan}
        </span>
        {/* Dropdown chevron */}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#52525b" }}>
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </div>

      <span style={{ color: "#33333a" }}>/</span>

      {/* Branch */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ color: "#f4f4f5" }}>main</span>
        <span style={{ fontSize: 10, fontFamily: "'Geist Mono',monospace", padding: "1px 8px", borderRadius: 4, background: "#0f2d1a", color: ACCENT, letterSpacing: ".04em", border: `1px solid ${ACCENT}44` }}>
          PRODUCTION
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#52525b" }}>
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </div>

      <span style={{ flex: 1 }} />

      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {/* Feedback */}
        <button style={{ fontSize: 13, color: "#a1a1aa", background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", padding: "0 4px" }}>
          Feedback
        </button>

        {/* Search */}
        <button style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#71717a", background: "#151517", border: "1px solid #26262a", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontFamily: "inherit" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          Search...
          <span style={{ fontSize: 11, color: "#52525b", marginLeft: 4 }}>Ctrl K</span>
        </button>

        {/* Help */}
        <button style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #26262a", background: "transparent", color: "#71717a", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/>
          </svg>
        </button>

        {/* Notifications */}
        <button style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #26262a", background: "transparent", color: "#71717a", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </button>

        {/* Connect button */}
        <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 6, border: "none", background: ACCENT, color: "#0b0b0c", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
          Connect
        </button>
      </div>
    </div>
  );
}
