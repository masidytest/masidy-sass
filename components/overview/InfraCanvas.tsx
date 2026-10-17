"use client";

import { useMemo, useEffect, useState } from "react";
import type { NodeTypes, Node, Edge } from "@xyflow/react";
import type { InfraData, DbStats } from "@/lib/types/overview";

const ACCENT = "#75ea5e";
const WARN = "#f59e0b";
const ERR = "#f87171";
type InfraView = "graph" | "list";

function statusColor(s: string) {
  const up = s.toUpperCase();
  if (up === "ACTIVE" || up === "HEALTHY") return ACCENT;
  if (up === "UNHEALTHY" || up === "FAILED") return ERR;
  return WARN;
}

function ViewToggle({ view, onChange }: { view: InfraView; onChange: (view: InfraView) => void }) {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {(["graph", "list"] as const).map(option => (
        <button
          key={option}
          type="button"
          aria-label={`${option === "graph" ? "Graph" : "List"} view`}
          aria-pressed={view === option}
          onClick={() => onChange(option)}
          style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #33333a", background: view === option ? "#26262a" : "#151517", color: view === option ? "#f4f4f5" : "#a1a1aa", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {option === "graph" ? <><circle cx="6" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="12" cy="18" r="2"/><path d="M8 6h8M7 8l4 8M17 8l-4 8"/></> : <path d="M4 6h16M4 12h16M4 18h16"/>}
          </svg>
        </button>
      ))}
    </div>
  );
}

// ── DatabaseNode (no Handle imports needed — handles are invisible) ──────────
export function DatabaseNode({ data }: { data: Record<string, unknown> }) {
  const stats = data.stats as DbStats | null;
  const color = statusColor(String(data.status ?? ""));
  return (
    <div style={{ background: "#151517", border: "1px solid #26262a", borderRadius: 10, padding: "12px 16px", minWidth: 200, fontFamily: "'Geist',system-ui,sans-serif", color: "#f4f4f5", boxShadow: "0 4px 24px rgba(0,0,0,.4)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5"/><path d="M3 12c0 1.7 4 3 9 3s9-1.3 9-3"/></svg>
        <span style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 140 }}>{String(data.label ?? "Database")}</span>
      </div>
      <div style={{ fontSize: 11, color: "#71717a", fontFamily: "'Geist Mono',monospace", marginBottom: 8 }}>{String(data.region ?? "")} · {String(data.compute ?? "nano")}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, fontSize: 12, color }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, display: "inline-block" }} />
        {String(data.status ?? "unknown")}
      </div>
      <div style={{ display: "flex", gap: 8, fontSize: 11, fontFamily: "'Geist Mono',monospace", color: "#a1a1aa", borderTop: "1px solid #26262a", paddingTop: 8, flexWrap: "wrap" }}>
        <span>CPU load {stats?.cpuLoad != null ? stats.cpuLoad.toFixed(2) : "—"}</span>
        <span>·</span>
        <span>Disk {stats ? `${stats.disk}%` : "—"}</span>
        <span>·</span>
        <span>RAM {stats ? `${stats.ram}%` : "—"}</span>
        <span>·</span>
        <span>{stats ? stats.connections : "—"}</span>
      </div>
    </div>
  );
}

// ── Inner flow (only rendered client-side after dynamic import) ──────────────
function FlowInner({ infra, stats, view, onViewChange }: {
  infra: InfraData;
  stats: DbStats | null;
  view: InfraView;
  onViewChange: (view: InfraView) => void;
}) {
  type RF = typeof import("@xyflow/react");
  const [mod, setMod] = useState<RF | null>(null);

  useEffect(() => {
    // CSS must be imported via a link tag to avoid SSR issues
    if (!document.querySelector("#xyflow-css")) {
      const link = document.createElement("link");
      link.id = "xyflow-css";
      link.rel = "stylesheet";
      link.href = "https://cdn.jsdelivr.net/npm/@xyflow/react@latest/dist/style.css";
      document.head.appendChild(link);
    }
    import("@xyflow/react").then(m => setMod(m));
  }, []);

  const { nodes, edges } = useMemo<{ nodes: Node[]; edges: Edge[] }>(() => {
    const primaryId = "primary";
    const ns: Node[] = [{
      id: primaryId, type: "database", position: { x: 40, y: 40 },
      data: { label: infra.name, region: infra.region, compute: infra.compute, status: infra.status, stats },
    }];
    const es: Edge[] = [];
    (infra.readReplicas ?? []).forEach((rr, i) => {
      const id = `replica-${i}`;
      ns.push({ id, type: "database", position: { x: 320, y: 30 + i * 130 }, data: { label: `Replica (${rr.region})`, region: rr.region, compute: "replica", status: rr.status, stats: null } });
      es.push({ id: `e-primary-${id}`, source: primaryId, target: id, style: { stroke: "#33333a", strokeWidth: 1.5 } });
    });
    return { nodes: ns, edges: es };
  }, [infra, stats]);

  if (view === "list") {
    const nodes = [
      { name: infra.name, region: infra.region, status: infra.status, stats },
      ...(infra.readReplicas ?? []).map(replica => ({
        name: `Replica (${replica.region})`,
        region: replica.region,
        status: replica.status,
        stats: null,
      })),
    ];
    return (
      <div style={{ height: "100%", overflow: "auto", padding: 12, boxSizing: "border-box" }}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
          <ViewToggle view={view} onChange={onViewChange} />
        </div>
        <div role="list" aria-label="Project infrastructure" style={{ display: "grid", gap: 8 }}>
          {nodes.map(node => (
            <div role="listitem" key={`${node.name}-${node.region}`} style={{ display: "flex", alignItems: "center", gap: 12, border: "1px solid #26262a", borderRadius: 8, background: "#151517", padding: "10px 12px", fontSize: 12 }}>
              <span aria-hidden="true" style={{ width: 7, height: 7, borderRadius: "50%", background: statusColor(node.status), flexShrink: 0 }} />
              <strong style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{node.name}</strong>
              <span style={{ color: "#a1a1aa" }}>{node.region}</span>
              <span style={{ marginLeft: "auto", color: statusColor(node.status) }}>{node.status}</span>
              {node.stats && <span style={{ color: "#a1a1aa" }}>
                CPU load {node.stats.cpuLoad?.toFixed(2) ?? "—"} · Disk {node.stats.disk == null ? "—" : `${node.stats.disk}%`} · RAM {node.stats.ram == null ? "—" : `${node.stats.ram}%`}
              </span>}
            </div>
          ))}
        </div>
        {infra.readReplicas === null && (
          <p style={{ color: "#71717a", fontSize: 11, margin: "10px 0 0" }}>
            Read replica inventory is not available through the project API.
          </p>
        )}
      </div>
    );
  }

  if (!mod) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#71717a", fontSize: 13 }}>Loading canvas…</div>;

  const { ReactFlow, Background, BackgroundVariant, Panel } = mod;
  const nodeTypes: NodeTypes = { database: DatabaseNode };

  return (
    <>
      <style>{`.react-flow{background:#0e0e0f!important}.react-flow__background{color:#26262a!important}.react-flow__handle{opacity:0!important}.react-flow__attribution{display:none!important}.react-flow__edge-path{stroke:#33333a!important}`}</style>
      <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} nodesDraggable={false} zoomOnScroll={false} panOnDrag={false} fitView fitViewOptions={{ padding: 0.3 }} proOptions={{ hideAttribution: true }}>
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#26262a" />
        <Panel position="top-right">
          <ViewToggle view={view} onChange={onViewChange} />
        </Panel>
        {infra.readReplicas === null && (
          <Panel position="bottom-left">
            <span style={{ color: "#71717a", fontSize: 11 }}>
              Read replica inventory unavailable
            </span>
          </Panel>
        )}
      </ReactFlow>
    </>
  );
}

// ── Public export ────────────────────────────────────────────────────────────
interface Props { infra: InfraData | null; stats: DbStats | null; loading: boolean }

export function InfraCanvas({ infra, stats, loading }: Props) {
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState<InfraView>("graph");
  useEffect(() => setMounted(true), []);

  return (
    <div style={{ height: 220, borderRadius: 12, overflow: "hidden", border: "1px solid #26262a", background: "#0e0e0f" }}>
      {!mounted || loading
        ? <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#71717a", fontSize: 13 }}>Loading infrastructure…</div>
        : !infra
        ? <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#71717a", fontSize: 13 }}>No infrastructure data available</div>
        : <FlowInner infra={infra} stats={stats} view={view} onViewChange={setView} />
      }
    </div>
  );
}
