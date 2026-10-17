"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";
import { useProject } from "@/lib/hooks/use-project";

export const dynamic = "force-dynamic";

const ACCENT = "#75ea5f";
const WARN = "#f59e0b";
const ERR = "#f87171";

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
  );
}

type Project = {
  id: string; name: string; slug: string; region: string;
  status: string; supabase_ref: string | null; org_id: string; created_at: string;
};
type Org = { id: string; name: string; plan: string };

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8,
  border: "1px solid #33333a", background: "#0e0e0f", color: "#f4f4f5",
  fontSize: 14, fontFamily: "inherit", marginBottom: 12,
};

// ── Native drag-and-drop section wrapper ─────────────────────────────────────
function Section({
  id, title, onRemove, onDragStart, onDragOver, onDrop, dragging,
  children,
}: {
  id: string;
  title: string;
  onRemove: () => void;
  onDragStart: (id: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (id: string) => void;
  dragging: string | null;
  children: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  const isDragging = dragging === id;
  const isOver = dragging !== null && dragging !== id;

  return (
    <div
      onDragOver={e => { e.preventDefault(); onDragOver(e); }}
      onDrop={() => onDrop(id)}
      style={{
        marginBottom: 24,
        opacity: isDragging ? 0.4 : 1,
        transition: "opacity 0.15s",
        outline: isOver ? `2px dashed #33333a` : "none",
        borderRadius: 12,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Section header with drag handle + remove */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        {/* Drag handle — only this is draggable */}
        <div
          draggable
          onDragStart={() => onDragStart(id)}
          aria-label={`Drag to reorder ${title}`}
          title="Drag to reorder"
          style={{
            cursor: "grab",
            opacity: hovered ? 1 : 0,
            transition: "opacity 0.15s",
            padding: "4px 6px",
            borderRadius: 4,
            display: "flex",
            alignItems: "center",
            color: "#71717a",
          }}
        >
          {/* Six-dot grip icon */}
          <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor" aria-hidden="true">
            <circle cx="2" cy="2" r="1.5"/><circle cx="8" cy="2" r="1.5"/>
            <circle cx="2" cy="7" r="1.5"/><circle cx="8" cy="7" r="1.5"/>
            <circle cx="2" cy="12" r="1.5"/><circle cx="8" cy="12" r="1.5"/>
          </svg>
        </div>

        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: "#f4f4f5", flex: 1 }}>{title}</h2>

        {/* Remove button */}
        <button
          onClick={onRemove}
          aria-label={`Remove ${title}`}
          style={{
            opacity: hovered ? 1 : 0,
            transition: "opacity 0.15s",
            width: 28, height: 28,
            borderRadius: 6,
            border: "1px solid #33333a",
            background: "transparent",
            color: "#71717a",
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "inherit",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      {children}
    </div>
  );
}

// ── The sections content components ──────────────────────────────────────────

function ConnectSection({ projectUrl, publicKey, keyError, copied, onCopy }: {
  projectUrl: string | null; publicKey: string | null; keyError: string; copied: boolean; onCopy: () => void;
}) {
  return (
    <section style={{ border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Connect your app</h3>
        <button onClick={onCopy} disabled={!projectUrl || !publicKey} style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #33333a", background: "transparent", color: "#f4f4f5", fontSize: 14, cursor: projectUrl && publicKey ? "pointer" : "not-allowed", fontFamily: "inherit" }}>
          {copied ? "Copied!" : "Copy .env"}
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 12 }}>
        <div>
          <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 11, color: "#a1a1aa", marginBottom: 6 }}>MASIDY_URL</div>
          <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 13, padding: "10px 12px", borderRadius: 8, background: "#0e0e0f", border: "1px solid #26262a" }}>{projectUrl ?? "Loading project URL…"}</div>
        </div>
        <div>
          <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 11, color: "#a1a1aa", marginBottom: 6 }}>MASIDY_KEY (public)</div>
          {publicKey
            ? <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 12, padding: "10px 12px", borderRadius: 8, background: "#0e0e0f", border: "1px solid #26262a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{publicKey}</div>
            : <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 13, padding: "10px 12px", borderRadius: 8, background: "#0e0e0f", border: "1px solid #26262a", color: "#71717a" }}>{keyError || "Loading public key…"}</div>
          }
        </div>
      </div>
      {keyError && <p role="alert" style={{ margin: "12px 0 0", color: ERR, fontSize: 13 }}>{keyError}</p>}
    </section>
  );
}

type ProjectStats = { cpu: number | null; ram: number | null; disk: number | null; connections: string | null };

function MetricsSection({ project }: { project: Project }) {
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [requestCount, setRequestCount] = useState<number | null>(null);
  const [statsError, setStatsError] = useState("");
  const [metricsError, setMetricsError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setStats(null);
    setRequestCount(null);
    setStatsError("");
    setMetricsError("");
    setLoading(true);

    async function load() {
      const [statsResult, metricsResult] = await Promise.allSettled([
        fetch(`/api/projects/${project.id}/stats`, { signal: controller.signal }).then(async response => {
          const data = await response.json();
          if (!response.ok) throw new Error(data.error ?? "Could not load provider usage");
          return data as ProjectStats;
        }),
        fetch(`/api/projects/${project.id}/metrics?window=60m`, { signal: controller.signal }).then(async response => {
          const data: unknown = await response.json();
          if (!response.ok) {
            const message = data && typeof data === "object" && "error" in data && typeof data.error === "string"
              ? data.error
              : "Could not load request metrics";
            throw new Error(message);
          }
          if (!Array.isArray(data)) throw new Error("Metrics API returned an unexpected response");
          return (data as { requests: number }[]).reduce((sum, item) => sum + item.requests, 0);
        }),
      ]);
      if (controller.signal.aborted) return;
      if (statsResult.status === "fulfilled") setStats(statsResult.value);
      else setStatsError(statsResult.reason instanceof Error ? statsResult.reason.message : "Could not load provider usage");
      if (metricsResult.status === "fulfilled") setRequestCount(metricsResult.value);
      else setMetricsError(metricsResult.reason instanceof Error ? metricsResult.reason.message : "Could not load request metrics");
      setLoading(false);
    }

    void load();
    return () => controller.abort();
  }, [project.id]);

  const values = [
    { label: "CPU utilization", value: stats?.cpu == null ? "Unavailable" : `${stats.cpu}%`, error: statsError },
    { label: "Memory utilization", value: stats?.ram == null ? "Unavailable" : `${stats.ram}%`, error: statsError },
    { label: "Disk I/O", value: stats?.disk == null ? "Unavailable" : `${stats.disk}%`, error: statsError },
    { label: "Database connections", value: stats?.connections ?? "Unavailable", error: statsError },
    { label: "Requests · last hour", value: requestCount?.toLocaleString() ?? "Unavailable", error: metricsError },
  ];
  return (
    <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
      {values.map(({ label, value, error }) => (
        <div key={label} style={{ border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 20 }}>
          <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 11, color: "#a1a1aa" }}>{label}</div>
          <div style={{ fontSize: 26, fontWeight: 600, margin: "8px 0 10px", letterSpacing: "-.02em" }}>{loading ? "Loading…" : value}</div>
          {error && <div style={{ color: ERR, fontSize: 11 }}>{error}</div>}
        </div>
      ))}
    </section>
  );
}

function ServicesSection({ project }: { project: Project }) {
  const [logs, setLogs] = useState<{ timestamp?: string; source_name?: string; event_message?: string; method?: string; path?: string; status_code?: string | number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setLogs([]);
    setLoading(true);
    setError("");
    fetch(`/api/projects/${project.id}/logs?window=60m`, { signal: controller.signal })
      .then(async response => {
        const data: unknown = await response.json();
        if (!response.ok) {
          const message = data && typeof data === "object" && "error" in data && typeof data.error === "string"
            ? data.error
            : "Could not load recent project activity";
          throw new Error(message);
        }
        if (!data || typeof data !== "object" || !("logs" in data) || !Array.isArray(data.logs)) {
          throw new Error("Logs API returned an unexpected response");
        }
        setLogs(data.logs);
      })
      .catch(e => {
        if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "Could not load recent project activity");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [project.id]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))", gap: 20 }}>
      <div style={{ border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 20 }}>
        <h3 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 600 }}>Services</h3>
        {[
          { name: "Database", href: "/dashboard/table-editor" },
          { name: "Auth", href: "/dashboard/auth" },
          { name: "Storage", href: "/dashboard/storage" },
          { name: "Domains", href: "/dashboard/domains" },
          { name: "Email", href: "/dashboard/email" },
        ].map(({ name, href }) => (
          <Link key={name} href={href} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderTop: "1px solid #26262a", fontSize: 14, textDecoration: "none", color: "inherit" }}>
            <span style={{ flex: 1 }}>{name}</span>
            <span style={{ color: "#a1a1aa" }}>Open →</span>
          </Link>
        ))}
      </div>
      <div style={{ border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Recent project activity</h3>
          <Link href="/dashboard/logs" style={{ fontSize: 14, color: ACCENT, textDecoration: "none" }}>Open logs →</Link>
        </div>
        {error ? <p role="alert" style={{ color: ERR, fontSize: 13 }}>{error}</p>
          : loading ? <p style={{ color: "#a1a1aa", fontSize: 13 }}>Loading recent project activity…</p>
          : logs.length === 0 ? <p style={{ color: "#a1a1aa", fontSize: 13 }}>No project log events were recorded in the last hour.</p>
          : logs.slice(0, 6).map((log, index) => (
            <div key={`${log.timestamp ?? "log"}-${index}`} style={{ display: "grid", gridTemplateColumns: "72px minmax(0,1fr) 44px", gap: 8, padding: "10px 0", borderTop: "1px solid #26262a", fontSize: 12 }}>
              <span style={{ color: "#a1a1aa" }}>{log.status_code ?? "—"}</span>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {[log.method, log.path].filter(Boolean).join(" ") || log.event_message || log.source_name || "Project event"}
              </span>
              <time style={{ color: "#71717a", textAlign: "right" }}>{log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : "—"}</time>
            </div>
          ))}
      </div>
    </div>
  );
}

// ── Registry of all sections ──────────────────────────────────────────────────
const SECTION_TITLES: Record<string, string> = {
  connect: "Connect your app",
  metrics: "Usage metrics",
  services: "Services & requests",
};

const DEFAULT_ORDER = ["connect", "metrics", "services"];

// ── Main page ─────────────────────────────────────────────────────────────────
export default function OverviewPage() {
  const { project: selectedProject, loading: selectedProjectLoading } = useProject();
  const [org, setOrg] = useState<Org | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [projectUrl, setProjectUrl] = useState<string | null>(null);
  const [keyError, setKeyError] = useState("");
  const [overviewError, setOverviewError] = useState("");

  // Create flow
  const [step, setStep] = useState<"idle" | "creating-org" | "creating-project">("idle");
  const [orgName, setOrgName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projectSlug, setProjectSlug] = useState("");
  const [formError, setFormError] = useState("");
  const [planRequired, setPlanRequired] = useState(false);

  // Layout state — load from localStorage, persist on change
  const [sections, setSections] = useState<string[]>(DEFAULT_ORDER);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const draggingId = useRef<string | null>(null);
  const [draggingState, setDraggingState] = useState<string | null>(null);

  // Load saved layout
  useEffect(() => {
    try {
      const saved = localStorage.getItem("masidy_overview_layout");
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.every(s => typeof s === "string")) {
          // Only keep known sections, ignore unknown
          const valid = (parsed as string[]).filter(s => s in SECTION_TITLES);
          if (valid.length > 0) setSections(valid);
        }
      }
    } catch { /* ignore */ }
  }, []);

  // Save layout on change
  useEffect(() => {
    try { localStorage.setItem("masidy_overview_layout", JSON.stringify(sections)); } catch { /* ignore */ }
  }, [sections]);

  const load = useCallback(async () => {
    setOverviewError("");
    try {
      const sb = getSupabase();
      const { data: { user }, error: userError } = await sb.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error("Sign in to load your organization.");
      const { data: m, error: membershipError } = await sb.from("org_members")
        .select("org_id, orgs(id, name, plan)").eq("user_id", user.id).limit(1).maybeSingle();
      if (membershipError) throw membershipError;
      if (!m) {
        setOrg(null);
        setProject(null);
        return;
      }
      const organization = m.orgs as unknown as Org;
      setOrg(organization);
      const { data: p, error: projectsError } = await sb.from("projects").select("*")
        .eq("org_id", organization.id).order("created_at", { ascending: true }).limit(1).maybeSingle();
      if (projectsError) throw projectsError;
      setProject((p as Project | null) ?? null);
    } catch (e) {
      setOverviewError(e instanceof Error ? e.message : "Could not load your dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!selectedProjectLoading) setProject(selectedProject);
  }, [selectedProject, selectedProjectLoading]);

  useEffect(() => {
    if (!project) return;
    const controller = new AbortController();
    setPublicKey(null);
    setProjectUrl(null);
    setKeyError("");
    if (project.status !== "active") {
      setKeyError("Project keys are available after provisioning completes.");
      return () => controller.abort();
    }
    fetch(`/api/projects/${project.id}/keys`, { signal: controller.signal })
      .then(async response => {
        const data: unknown = await response.json();
        if (!response.ok) {
          const message = data && typeof data === "object" && "error" in data && typeof data.error === "string"
            ? data.error
            : "Could not load project keys";
          throw new Error(message);
        }
        if (!data || typeof data !== "object" || !("url" in data) || typeof data.url !== "string" ||
            !("publicKey" in data) || typeof data.publicKey !== "string" || !data.publicKey) {
          throw new Error("Project connection details are incomplete.");
        }
        setProjectUrl(data.url);
        setPublicKey(data.publicKey);
      })
      .catch(e => {
        if (!controller.signal.aborted) setKeyError(e instanceof Error ? e.message : "Could not load project keys");
      });
    return () => controller.abort();
  }, [project]);

  function handleDragStart(id: string) {
    draggingId.current = id;
    setDraggingState(id);
  }

  function handleDrop(targetId: string) {
    const fromId = draggingId.current;
    if (!fromId || fromId === targetId) { draggingId.current = null; setDraggingState(null); return; }
    setSections(prev => {
      const next = [...prev];
      const fromIdx = next.indexOf(fromId);
      const toIdx = next.indexOf(targetId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      next.splice(fromIdx, 1);
      next.splice(toIdx, 0, fromId);
      return next;
    });
    draggingId.current = null;
    setDraggingState(null);
  }

  function removeSection(id: string) {
    setSections(prev => prev.filter(s => s !== id));
  }

  function addSection(id: string) {
    setSections(prev => [...prev, id]);
    setShowAddMenu(false);
  }

  const hiddenSections = Object.keys(SECTION_TITLES).filter(id => !sections.includes(id));

  async function copyEnv() {
    if (!projectUrl || !publicKey) {
      setKeyError("Project connection details are not available yet.");
      return;
    }
    try {
      await navigator.clipboard.writeText(`MASIDY_URL=${projectUrl}\nMASIDY_KEY=${publicKey}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      setKeyError(e instanceof Error ? e.message : "Clipboard access was denied.");
    }
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) return <main style={{ padding: "32px 40px" }}><div style={{ color: "#a1a1aa" }}>Loading…</div></main>;
  if (overviewError) return <main style={{ padding: "32px 40px" }}><p role="alert" style={{ color: ERR }}>{overviewError}</p><button onClick={() => { setLoading(true); void load(); }}>Retry</button></main>;

  // ── No org ─────────────────────────────────────────────────────────────────
  if (!org) {
    return (
      <main style={{ padding: "32px 40px", maxWidth: 480 }}>
        <h1 style={{ margin: "0 0 8px", fontSize: 36, letterSpacing: "-.02em", fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500 }}>Welcome to Masidy</h1>
        <p style={{ margin: "0 0 28px", color: "#a1a1aa", fontSize: 15 }}>Create an organization to get started.</p>
        <form onSubmit={async e => {
          e.preventDefault(); setFormError(""); setStep("creating-org");
          const sb = getSupabase();
          const { data, error } = await sb.rpc("create_org", { p_name: orgName });
          if (error) { setFormError(error.message); setStep("idle"); return; }
          const { data: o, error: orgLoadError } = await sb.from("orgs").select("*").eq("id", data).single();
          if (orgLoadError) throw orgLoadError;
          setOrg(o as Org);
          window.dispatchEvent(new CustomEvent("masidy:projects-refresh"));
          setStep("idle");
        }} style={{ border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 24 }}>
          <label style={{ display: "block", fontSize: 13, color: "#a1a1aa", marginBottom: 6 }}>Organization name</label>
          <input type="text" required placeholder="Acme Inc." value={orgName} onChange={e => setOrgName(e.target.value)} style={inputStyle} />
          {formError && <p style={{ color: ERR, fontSize: 14, margin: "0 0 12px" }}>{formError}</p>}
          <button type="submit" disabled={step === "creating-org"} style={{ padding: "10px 20px", borderRadius: 8, border: 0, background: "#f4f4f5", color: "#0b0b0c", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
            {step === "creating-org" ? "Creating…" : "Create organization"}
          </button>
        </form>
      </main>
    );
  }

  // ── No project ─────────────────────────────────────────────────────────────
  if (!project) {
    return (
      <main style={{ padding: "32px 40px", maxWidth: 520 }}>
        <h1 style={{ margin: "0 0 8px", fontSize: 36, letterSpacing: "-.02em", fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500 }}>Create your first project</h1>
        <p style={{ margin: "0 0 28px", color: "#a1a1aa", fontSize: 15 }}>A project gives your app an isolated database, auth and storage.</p>
        <form onSubmit={async e => {
          e.preventDefault(); if (!org) return; setFormError(""); setPlanRequired(false); setStep("creating-project");
          try {
            const r = await fetch(`/api/orgs/${org.id}/projects`, {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: projectName, slug: projectSlug, region: "us-east-1" }),
            });
            const data = await r.json();
            if (!r.ok) { setFormError(data.error ?? "Failed"); setPlanRequired(r.status === 402); setStep("idle"); return; }
            const sb = getSupabase();
            const { data: p, error: projectLoadError } = await sb.from("projects").select("*").eq("id", data.id).single();
            if (projectLoadError) throw projectLoadError;
            setProject(p as Project);
            window.dispatchEvent(new CustomEvent("masidy:projects-refresh", { detail: { id: data.id } }));
          } catch (err: unknown) { setFormError(err instanceof Error ? err.message : "Failed"); }
          setStep("idle");
        }} style={{ border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 24 }}>
          <label style={{ display: "block", fontSize: 13, color: "#a1a1aa", marginBottom: 6 }}>Project name</label>
          <input type="text" required placeholder="My App" value={projectName} onChange={e => setProjectName(e.target.value)} style={inputStyle} />
          <label style={{ display: "block", fontSize: 13, color: "#a1a1aa", marginBottom: 6 }}>Project slug <span style={{ color: "#71717a" }}>→ project subdomain on the configured gateway domain</span></label>
          <input type="text" required placeholder="my-app" value={projectSlug}
            onChange={e => setProjectSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} style={inputStyle} />
          {formError && <p style={{ color: ERR, fontSize: 14, margin: "0 0 12px" }}>{formError}</p>}
          {planRequired && <Link href="/dashboard/plans" style={{ display: "inline-block", margin: "0 0 12px", color: ACCENT, fontSize: 14 }}>Choose or upgrade your plan</Link>}
          <button type="submit" disabled={step === "creating-project"} style={{ padding: "10px 20px", borderRadius: 8, border: 0, background: "#f4f4f5", color: "#0b0b0c", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
            {step === "creating-project" ? "Provisioning (~30s)…" : "Create project"}
          </button>
        </form>
      </main>
    );
  }

  // ── Full overview ──────────────────────────────────────────────────────────
  const isActive = project.status === "active";
  const statusColor = isActive ? ACCENT : project.status === "failed" ? ERR : WARN;

  return (
    <main style={{ padding: "32px 40px" }}>
      {/* Page header */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 16, flexWrap: "wrap", marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 36, letterSpacing: "-.02em", fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500 }}>Overview</h1>
        <span style={{ fontSize: 13, color: "#a1a1aa" }}>
          <span style={{ color: statusColor }}>●</span> {project.status} · {project.region} · {org.plan} plan
        </span>
      </div>

      {/* Draggable sections */}
      {sections.map(id => (
        <Section
          key={id}
          id={id}
          title={SECTION_TITLES[id] ?? id}
          onRemove={() => removeSection(id)}
          onDragStart={handleDragStart}
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
          dragging={draggingState}
        >
          {id === "connect" && <ConnectSection projectUrl={projectUrl} publicKey={publicKey} keyError={keyError} copied={copied} onCopy={() => void copyEnv()} />}
          {id === "metrics" && <MetricsSection project={project} />}
          {id === "services" && <ServicesSection project={project} />}
        </Section>
      ))}

      {/* Add section button */}
      {hiddenSections.length > 0 && (
        <div style={{ position: "relative", display: "inline-block", marginTop: 8 }}>
          <button
            onClick={() => setShowAddMenu(o => !o)}
            aria-label="Add a section"
            style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #33333a", background: "transparent", color: "#a1a1aa", fontSize: 14, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
            Add section
          </button>
          {showAddMenu && (
            <div style={{ position: "absolute", bottom: "110%", left: 0, background: "#151517", border: "1px solid #26262a", borderRadius: 10, padding: "6px 0", minWidth: 200, zIndex: 50, boxShadow: "0 8px 32px rgba(0,0,0,.5)" }}>
              {hiddenSections.map(id => (
                <button
                  key={id}
                  onClick={() => addSection(id)}
                  style={{ display: "block", width: "100%", padding: "9px 16px", background: "transparent", border: "none", color: "#f4f4f5", fontSize: 14, textAlign: "left", cursor: "pointer", fontFamily: "inherit" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#1c1c1f")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  {SECTION_TITLES[id]}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
