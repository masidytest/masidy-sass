"use client";

import { useCallback, useMemo } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Panel,
  Handle,
  Position,
  type NodeTypes,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { InfraData, DbStats } from "@/lib/types/overview";

const ACCENT = "#75ea5e";
const WARN = "#f59e0b";
const ERR = "#f87171";

function statusColor(s: string) {
  const up = s.toUpperCase();
  if (up === "ACTIVE" || up === "HEALTHY") return ACCENT;
  if (up === "UNHEALTHY" || up === "FAILED") return ERR;
  return WARN;
}

/* ── DatabaseNode ─────────────────────────────────────────── */
function DatabaseNode({ data }: { data: Record<string, unknown> }) {
  const stats = data.stats as DbStats | null;
  const color = statusColor(String(data.status ?? ""));

  return (
    <div style={{
      background: "#151517", border: "1px solid #26262a", borderRadius: 10,
      padding: "12px 16px", minWidth: 200, fontFamily: "'Geist',system-ui,sans-serif",
      color: "#f4f4f5", boxShadow: "0 4px 24px rgba(0,0,0,.4)",
    }}>
      <Handle type="target" position={Position.Left} style={{ background: "#26262a", border: "none" }} />
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5"/><path d="M3 12c0 1.7 4 3 9 3s9-1.3 9-3"/>
        </svg>
        <span style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 140 }}>
          {String(data.label ?? "Database")}
        </span>
      </div>
      {/* Region + compute */}
      <div style={{ fontSize: 11, color: "#71717a", fontFamily: "'Geist Mono',monospace", marginBottom: 8 }}>
        {String(data.region ?? "")} · {String(data.compute ?? "nano")}
      </div>
      {/* Status */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, fontSize: 12, color }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, display: "inline-block" }} />
        {String(data.status ?? "unknown")}
      </div>
      {/* Stats footer */}
      <div style={{ display: "flex", gap: 10, fontSize: 11, fontFamily: "'Geist Mono',monospace", color: "#a1a1aa", borderTop: "1px solid #26262a", paddingTop: 8, flexWrap: "wrap" }}>
        <span>CPU {stats ? `${stats.cpu}%` : "—"}</span>
        <span style={{ color: "#333" }}>·</span>
        <span>Disk {stats ? `${stats.disk}%` : "—"}</span>
        <span style={{ color: "#333" }}>·</span>
        <span>RAM {stats ? `${stats.ram}%` : "—"}</span>
        <span style={{ color: "#333" }}>·</span>
        <span>{stats ? stats.connections : "—"}</span>
      </div>
      <Handle type="source" position={Position.Right} style={{ background: "#26262a", border: "none" }} />
    </div>
  );
}

const nodeTypes: NodeTypes = { database: DatabaseNode };

/* ── InfraCanvas ──────────────────────────────────────────── */
interface Props {
  infra: InfraData | null;
  stats: DbStats | null;
  loading: boolean;
}

export function InfraCanvas({ infra, stats, loading }: Props) {
  const { nodes, edges } = useMemo(() => {
    if (!infra) return { nodes: [], edges: [] };

    const primaryId = "primary";
    const nodes: Node[] = [
      {
        id: primaryId,
        type: "database",
        position: { x: 40, y: 60 },
        data: {
          label: infra.name,
          region: infra.region,
          compute: infra.compute,
          status: infra.status,
          stats,
        },
      },
    ];

    const edges: Edge[] = [];

    infra.readReplicas.forEach((rr, i) => {
      const id = `replica-${i}`;
      nodes.push({
        id,
        type: "database",
        position: { x: 320, y: 40 + i * 130 },
        data: {
          label: `Replica (${rr.region})`,
          region: rr.region,
          compute: "replica",
          status: rr.status,
          stats: null,
        },
      });
      edges.push({
        id: `e-${primaryId}-${id}`,
        source: primaryId,
        target: id,
        style: { stroke: "#33333a", strokeWidth: 1.5 },
        animated: infra.status === "ACTIVE",
      });
    });

    return { nodes, edges };
  }, [infra, stats]);

  if (loading) {
    return (
      <div style={{ height: 220, borderRadius: 12, background: "#151517", border: "1px solid #26262a", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#71717a", fontSize: 13 }}>Loading infrastructure…</div>
      </div>
    );
  }

  if (!infra) {
    return (
      <div style={{ height: 220, borderRadius: 12, background: "#151517", border: "1px solid #26262a", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#71717a", fontSize: 13 }}>No infrastructure data available</div>
      </div>
    );
  }

  return (
    <div style={{ height: 220, borderRadius: 12, overflow: "hidden", border: "1px solid #26262a", background: "#0e0e0f" }}>
      {/* Override ReactFlow CSS for dark theme */}
      <style>{`
        .react-flow { background: #0e0e0f !important; }
        .react-flow__background { color: #26262a !important; }
        .react-flow__handle { opacity: 0; }
        .react-flow__edge-path { stroke: #33333a !important; }
        .react-flow__attribution { display: none; }
      `}</style>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        nodesDraggable={false}
        zoomOnScroll={false}
        panOnDrag={false}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#26262a" />
        <Panel position="top-right">
          <div style={{ display: "flex", gap: 4 }}>
            {[
              { label: "Graph view", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="12" cy="18" r="2"/><path d="M8 6h8M7 8l4 8M17 8l-4 8"/></svg> },
              { label: "List view", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg> },
            ].map(({ label, icon }) => (
              <button key={label} aria-label={label} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #33333a", background: "#151517", color: "#a1a1aa", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                {icon}
              </button>
            ))}
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}
