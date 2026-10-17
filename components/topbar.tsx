"use client";

import { useProject } from "@/lib/hooks/use-project";

const ACCENT = "#75ea5e";

interface TopBarProps {
  projectName: string;
  plan: string;
}

export function TopBar({ projectName, plan }: TopBarProps) {
  const { project, projects, selectProject } = useProject();
  const activeProjectName = project?.name ?? projectName;
  const organizationName = project?.org_name ?? "Masidy";
  const activePlan = project?.org_plan.toUpperCase() ?? plan;
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
          {organizationName.charAt(0).toUpperCase()}
        </div>
        <span style={{ color: "#f4f4f5", fontWeight: 500 }}>{organizationName}</span>
      </div>

      <span style={{ color: "#33333a" }}>/</span>

      {/* Project */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {/* Project icon */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#71717a" }}>
          <path d="M12 2C7 2 3 3.3 3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5c0-1.7-4-3-9-3zm0 0M3 12c0 1.7 4 3 9 3s9-1.3 9-3"/>
        </svg>
        {projects.length > 1 ? (
          <select aria-label="Select project" value={project?.id ?? ""} onChange={e => selectProject(e.target.value)}
            style={{ maxWidth: 220, border: 0, background: "transparent", color: "#f4f4f5", fontWeight: 500, fontSize: 13, fontFamily: "inherit", cursor: "pointer" }}>
            {projects.map(item => <option key={item.id} value={item.id} style={{ background: "#151517" }}>{item.name}</option>)}
          </select>
        ) : <span style={{ color: "#f4f4f5", fontWeight: 500 }}>{activeProjectName}</span>}
        {/* Plan badge */}
        <span style={{ fontSize: 10, fontFamily: "'Geist Mono',monospace", padding: "1px 6px", borderRadius: 4, background: "#26262a", color: "#a1a1aa", letterSpacing: ".04em" }}>
          {activePlan}
        </span>
      </div>

      <span style={{ color: "#33333a" }}>/</span>

      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ color: "#71717a" }}>STATUS</span>
        <span style={{ fontSize: 10, fontFamily: "'Geist Mono',monospace", padding: "1px 8px", borderRadius: 4, background: project?.status === "active" ? "#0f2d1a" : "#26262a", color: project?.status === "active" ? ACCENT : "#a1a1aa", letterSpacing: ".04em", border: `1px solid ${project?.status === "active" ? `${ACCENT}44` : "#33333a"}` }}>
          {(project?.status ?? "loading").replaceAll("_", " ").toUpperCase()}
        </span>
      </div>

      <span style={{ flex: 1 }} />

    </div>
  );
}
