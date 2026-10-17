"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";

const ACCENT = "#75ea5e";
const WARN = "#f59e0b";
const ERR = "#f87171";

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
  );
}

export const dynamic = "force-dynamic";

type Project = {
  id: string; name: string; slug: string; region: string;
  status: string; supabase_ref: string | null; org_id: string; created_at: string;
};
type Org = { id: string; name: string; plan: string };

type DbStats = { cpu: number; disk: number; ram: number; connections: string };
type ServiceMetric = { name: string; requests: number; warnings: number; errors: number; bars: number[] };
type AdvisorIssue = { title: string; severity: "ERROR" | "WARN" | "INFO"; description: string };

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8,
  border: "1px solid #33333a", background: "#0e0e0f", color: "#f4f4f5",
  fontSize: 14, fontFamily: "inherit", marginBottom: 12,
};

// ─── Mini bar chart ──────────────────────────────────────────────────────────
function BarChart({ bars, color = ACCENT }: { bars: number[]; color?: string }) {
  const max = Math.max(...bars, 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 48, marginTop: 8 }}>
      {bars.map((v, i) => (
        <div key={i} style={{ flex: 1, borderRadius: 2, background: v > 0 ? color : "#26262a", height: `${Math.max(4, (v / max) * 100)}%`, transition: "height .2s" }} />
      ))}
    </div>
  );
}

// ─── Info card ───────────────────────────────────────────────────────────────
function InfoCard({ label, value, sub, icon }: { label: string; value: string; sub?: string; icon: React.ReactNode }) {
  return (
    <div style={{ border: "1px solid #26262a", borderRadius: 10, background: "#151517", padding: "16px 18px", display: "flex", gap: 14, alignItems: "flex-start" }}>
      <div style={{ width: 36, height: 36, borderRadius: 8, background: "#1c1c1f", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#a1a1aa" }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 10, color: "#71717a", marginBottom: 4, letterSpacing: ".06em" }}>{label}</div>
        <div style={{ fontSize: 14, fontWeight: 500, color: "#f4f4f5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</div>
        {sub && <div style={{ fontSize: 12, color: "#71717a", marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ─── Service metric card ─────────────────────────────────────────────────────
function ServiceCard({ s }: { s: ServiceMetric }) {
  const hasErrors = s.errors > 0;
  const hasWarnings = s.warnings > 0;
  return (
    <div style={{ border: "1px solid #26262a", borderRadius: 10, background: "#151517", padding: "16px 18px", minWidth: 180 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
        <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 10, color: "#71717a", letterSpacing: ".06em" }}>{s.name}</div>
        <div style={{ display: "flex", gap: 10, fontSize: 11, fontFamily: "'Geist Mono',monospace" }}>
          <span style={{ color: WARN }}>● {s.warnings}</span>
          <span style={{ color: ERR }}>● {s.errors}</span>
        </div>
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-.02em", color: "#f4f4f5" }}>{s.requests.toLocaleString()}</div>
      <BarChart bars={s.bars} color={hasErrors ? ERR : hasWarnings ? WARN : ACCENT} />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11, color: "#52525b", fontFamily: "'Geist Mono',monospace" }}>
        <span>—</span><span>now</span>
      </div>
    </div>
  );
}

// ─── Connect tile ─────────────────────────────────────────────────────────────
function ConnectTile({ icon, title, sub, href }: { icon: React.ReactNode; title: string; sub: string; href: string }) {
  return (
    <Link href={href} style={{ border: "1px solid #26262a", borderRadius: 10, background: "#151517", padding: "20px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, textDecoration: "none", color: "inherit", transition: "border-color .15s" }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = "#33333a")}
      onMouseLeave={e => (e.currentTarget.style.borderColor = "#26262a")}
    >
      <div style={{ color: "#a1a1aa" }}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "#f4f4f5" }}>{title}</div>
      <div style={{ fontSize: 12, color: "#71717a", textAlign: "center" }}>{sub}</div>
    </Link>
  );
}

export default function OverviewPage() {
  const [org, setOrg] = useState<Org | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [dbStats, setDbStats] = useState<DbStats | null>(null);
  const [metrics, setMetrics] = useState<ServiceMetric[]>([]);
  const [advisor, setAdvisor] = useState<AdvisorIssue[]>([]);
  const [metricsWindow, setMetricsWindow] = useState("60m");
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);

  // Create flow
  const [step, setStep] = useState<"idle" | "creating-org" | "creating-project">("idle");
  const [orgName, setOrgName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projectSlug, setProjectSlug] = useState("");
  const [formError, setFormError] = useState("");

  const loadData = useCallback(async () => {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: member } = await supabase
      .from("org_members").select("org_id, orgs(id, name, plan)")
      .eq("user_id", user.id).limit(1).single();
    if (!member) { setLoading(false); return; }
    const orgData = (member.orgs as unknown) as Org;
    setOrg(orgData);
    const { data: proj } = await supabase.from("projects").select("*")
      .eq("org_id", orgData.id).order("created_at", { ascending: true }).limit(1).single();
    if (proj) setProject(proj as Project);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Fetch keys + stats once active
  useEffect(() => {
    if (!project || project.status !== "active") return;

    fetch(`/api/projects/${project.id}/keys`)
      .then(r => r.json()).then(d => { if (d.publicKey) setPublicKey(d.publicKey); }).catch(() => {});

    // Fetch DB stats via management API proxy
    fetch(`/api/projects/${project.id}/stats`)
      .then(r => r.json()).then(d => { if (d.cpu !== undefined) setDbStats(d); }).catch(() => {});

    // Fetch request metrics
    fetch(`/api/projects/${project.id}/metrics?window=${metricsWindow}`)
      .then(r => r.json()).then(d => { if (Array.isArray(d)) setMetrics(d); }).catch(() => {});

    // Fetch advisor
    fetch(`/api/projects/${project.id}/advisor`)
      .then(r => r.json()).then(d => { if (Array.isArray(d)) setAdvisor(d); }).catch(() => {});
  }, [project, metricsWindow]);

  // Poll provisioning
  useEffect(() => {
    if (!project || project.status === "active" || project.status === "failed") return;
    setPolling(true);
    const interval = setInterval(async () => {
      const supabase = getSupabase();
      const { data } = await supabase.from("projects").select("status, supabase_ref")
        .eq("id", project.id).single();
      if (data?.status === "active" || data?.status === "failed") {
        setProject(p => p ? { ...p, status: data.status, supabase_ref: data.supabase_ref } : p);
        setPolling(false); clearInterval(interval);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [project]);

  async function createOrg(e: React.FormEvent) {
    e.preventDefault(); setFormError(""); setStep("creating-org");
    const supabase = getSupabase();
    const { data, error } = await supabase.rpc("create_org", { p_name: orgName });
    if (error) { setFormError(error.message); setStep("idle"); return; }
    const { data: orgData } = await supabase.from("orgs").select("*").eq("id", data).single();
    setOrg(orgData as Org); setStep("idle");
  }

  async function createProject(e: React.FormEvent) {
    e.preventDefault(); if (!org) return; setFormError(""); setStep("creating-project");
    try {
      const r = await fetch(`/api/orgs/${org.id}/projects`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: projectName, slug: projectSlug, region: "us-east-1" }),
      });
      const data = await r.json();
      if (!r.ok) { setFormError(data.error ?? "Failed"); setStep("idle"); return; }
      const supabase = getSupabase();
      const { data: proj } = await supabase.from("projects").select("*").eq("id", data.id).single();
      setProject(proj as Project);
    } catch (err: unknown) { setFormError(err instanceof Error ? err.message : "Failed"); }
    setStep("idle");
  }

  if (loading) return <main style={{ padding: "32px 40px" }}><div style={{ color: "#a1a1aa" }}>Loading…</div></main>;

  if (!org) return (
    <main style={{ padding: "32px 40px", maxWidth: 480 }}>
      <h1 style={{ margin: "0 0 8px", fontSize: 36, letterSpacing: "-.02em", fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500 }}>Welcome to Masidy</h1>
      <p style={{ margin: "0 0 28px", color: "#a1a1aa", fontSize: 15 }}>Create an organization to get started.</p>
      <form onSubmit={createOrg} style={{ border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 24 }}>
        <label style={{ display: "block", fontSize: 13, color: "#a1a1aa", marginBottom: 6 }}>Organization name</label>
        <input type="text" required placeholder="Acme Inc." value={orgName} onChange={e => setOrgName(e.target.value)} style={inputStyle} />
        {formError && <p style={{ color: ERR, fontSize: 14, margin: "0 0 12px" }}>{formError}</p>}
        <button type="submit" disabled={step === "creating-org"} style={{ padding: "10px 20px", borderRadius: 8, border: 0, background: "#f4f4f5", color: "#0b0b0c", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
          {step === "creating-org" ? "Creating…" : "Create organization"}
        </button>
      </form>
    </main>
  );

  if (!project) return (
    <main style={{ padding: "32px 40px", maxWidth: 520 }}>
      <h1 style={{ margin: "0 0 8px", fontSize: 36, letterSpacing: "-.02em", fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500 }}>Create your first project</h1>
      <p style={{ margin: "0 0 28px", color: "#a1a1aa", fontSize: 15 }}>A project gives your app an isolated database, auth and storage.</p>
      <form onSubmit={createProject} style={{ border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 24 }}>
        <label style={{ display: "block", fontSize: 13, color: "#a1a1aa", marginBottom: 6 }}>Project name</label>
        <input type="text" required placeholder="My App" value={projectName} onChange={e => setProjectName(e.target.value)} style={inputStyle} />
        <label style={{ display: "block", fontSize: 13, color: "#a1a1aa", marginBottom: 6 }}>Slug <span style={{ color: "#71717a" }}>→ slug.masidy.com</span></label>
        <input type="text" required placeholder="my-app" value={projectSlug}
          onChange={e => setProjectSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} style={inputStyle} />
        {formError && <p style={{ color: ERR, fontSize: 14, margin: "0 0 12px" }}>{formError}</p>}
        <button type="submit" disabled={step === "creating-project"} style={{ padding: "10px 20px", borderRadius: 8, border: 0, background: "#f4f4f5", color: "#0b0b0c", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
          {step === "creating-project" ? "Provisioning (~30s)…" : "Create project"}
        </button>
      </form>
    </main>
  );

  const isActive = project.status === "active";
  const isFailed = project.status === "failed";
  const projectUrl = `https://${project.slug}.masidy.com`;
  const statusColor = isActive ? ACCENT : isFailed ? ERR : WARN;

  // Placeholder service metrics when none loaded yet
  const displayMetrics: ServiceMetric[] = metrics.length > 0 ? metrics : [
    { name: "POSTGRES", requests: 0, warnings: 0, errors: 0, bars: Array(20).fill(0) },
    { name: "API GATEWAY", requests: 0, warnings: 0, errors: 0, bars: Array(20).fill(0) },
    { name: "AUTH", requests: 0, warnings: 0, errors: 0, bars: Array(20).fill(0) },
    { name: "STORAGE", requests: 0, warnings: 0, errors: 0, bars: Array(20).fill(0) },
    { name: "REALTIME", requests: 0, warnings: 0, errors: 0, bars: Array(20).fill(0) },
  ];

  const totalRequests = displayMetrics.reduce((s, m) => s + m.requests, 0);
  const totalErrors = displayMetrics.reduce((s, m) => s + m.errors, 0);
  const successRate = totalRequests > 0 ? (((totalRequests - totalErrors) / totalRequests) * 100).toFixed(1) : null;

  return (
    <main style={{ padding: "32px 40px", display: "flex", flexDirection: "column", gap: 28 }}>

      {/* ── Project header ── */}
      <div>
        <h1 style={{ margin: "0 0 6px", fontSize: 28, letterSpacing: "-.02em", fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500 }}>{project.name}</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 13, color: "#a1a1aa" }}>{projectUrl}</span>
          <button onClick={() => { navigator.clipboard.writeText(projectUrl); setCopiedUrl(true); setTimeout(() => setCopiedUrl(false), 2000); }}
            style={{ padding: "3px 10px", borderRadius: 6, border: "1px solid #33333a", background: "transparent", color: "#a1a1aa", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
            {copiedUrl ? "Copied!" : "Copy"}
          </button>
          {!isActive && !isFailed && (
            <button onClick={loadData} style={{ padding: "3px 10px", borderRadius: 6, border: "1px solid #33333a", background: "transparent", color: "#a1a1aa", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
              ↻ Refresh{polling ? "ing…" : ""}
            </button>
          )}
        </div>
      </div>

      {/* Banners */}
      {!isActive && !isFailed && (
        <div style={{ padding: "13px 18px", borderRadius: 10, border: `1px solid ${WARN}44`, background: `${WARN}11`, fontSize: 14, color: WARN }}>
          Your project is being provisioned. This usually takes 1–2 minutes. The page will update automatically.
        </div>
      )}
      {isFailed && (
        <div style={{ padding: "13px 18px", borderRadius: 10, border: `1px solid ${ERR}44`, background: `${ERR}11`, fontSize: 14, color: ERR }}>
          Provisioning failed. Please contact support or create a new project.
        </div>
      )}

      {/* ── Info cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 10 }}>
        <InfoCard label="STATUS" value={isActive ? "Healthy" : isFailed ? "Failed" : "Provisioning"}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={statusColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>} />
        <InfoCard label="COMPUTE SIZE" value="Nano" sub="Free tier"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>} />
        <InfoCard label="GITHUB" value="Not connected" sub="Connect a repo"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>} />
        <InfoCard label="RECENT BRANCH" value="No branches"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3v12M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 9a9 9 0 0 1-9 9"/></svg>} />
        <InfoCard label="LAST MIGRATION" value="No migrations"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5"/><path d="M3 12c0 1.7 4 3 9 3s9-1.3 9-3"/></svg>} />
        <InfoCard label="LAST BACKUP" value="No backups"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.47"/></svg>} />
      </div>

      {/* ── Primary database card ── */}
      <div style={{ border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: "#1c1c1f", display: "flex", alignItems: "center", justifyContent: "center", color: ACCENT }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5"/><path d="M3 12c0 1.7 4 3 9 3s9-1.3 9-3"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Primary Database</div>
              <div style={{ fontSize: 13, color: "#a1a1aa", marginTop: 2 }}>{project.region} · nano</div>
            </div>
          </div>
          {project.supabase_ref && (
            <a href={`https://supabase.com/dashboard/project/${project.supabase_ref}`} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 13, color: ACCENT, textDecoration: "none" }}>Open in Supabase →</a>
          )}
        </div>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          {[
            ["CPU", dbStats ? `${dbStats.cpu}%` : "—"],
            ["Disk", dbStats ? `${dbStats.disk}%` : "—"],
            ["RAM", dbStats ? `${dbStats.ram}%` : "—"],
            ["Connections", dbStats ? dbStats.connections : "—"],
          ].map(([label, val]) => (
            <span key={label} style={{ fontSize: 13, color: "#a1a1aa" }}>
              <span style={{ color: "#f4f4f5", fontWeight: 500 }}>{label}</span> {val}
              <span style={{ color: "#333", margin: "0 8px" }}>·</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Get connected ── */}
      <section>
        <h2 style={{ margin: "0 0 14px", fontSize: 18, fontWeight: 600 }}>Get connected</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10 }}>
          <ConnectTile href="/dashboard/api-keys" title="Framework" sub="Use a client library"
            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>} />
          <ConnectTile href="/dashboard/api-keys" title="Server" sub="Build APIs"
            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>} />
          <ConnectTile href="/dashboard/api-keys" title="Direct" sub="Connection string"
            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>} />
          <ConnectTile href="/dashboard/api-keys" title="ORM" sub="Third-party library"
            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5"/><path d="M3 12c0 1.7 4 3 9 3s9-1.3 9-3"/></svg>} />
          <ConnectTile href="/dashboard/api-keys" title="MCP" sub="Connect your agent"
            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12"/></svg>} />
          <ConnectTile href="/dashboard/api-keys" title="API Keys" sub="Manage project keys"
            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M16 7l3 3"/></svg>} />
        </div>
      </section>

      {/* ── Activity / metrics ── */}
      <section>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
            <span style={{ fontSize: 18, fontWeight: 700 }}>{totalRequests.toLocaleString()} Total Requests</span>
            {successRate && <span style={{ fontSize: 16, fontWeight: 600, color: ACCENT }}>{successRate}% Success Rate</span>}
            {!successRate && totalRequests === 0 && <span style={{ fontSize: 14, color: "#71717a" }}>No requests yet</span>}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {["15m", "60m", "3h", "24h"].map(w => (
              <button key={w} onClick={() => setMetricsWindow(w)}
                style={{ padding: "5px 12px", borderRadius: 6, border: `1px solid ${metricsWindow === w ? "#33333a" : "#26262a"}`, background: metricsWindow === w ? "#1c1c1f" : "transparent", color: metricsWindow === w ? "#f4f4f5" : "#71717a", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                Last {w}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 10 }}>
          {displayMetrics.map(s => <ServiceCard key={s.name} s={s} />)}
        </div>
      </section>

      {/* ── Advisor ── */}
      <section>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
            {advisor.length === 0 ? "Advisor found no issues" : `Advisor found ${advisor.length} issue${advisor.length > 1 ? "s" : ""}`}
          </h2>
          <Link href="/dashboard/sql-editor" style={{ fontSize: 13, color: "#a1a1aa", textDecoration: "none", padding: "5px 12px", borderRadius: 6, border: "1px solid #26262a" }}>SQL Editor</Link>
        </div>
        {advisor.length === 0 ? (
          <div style={{ border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: "56px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 12, color: "#26262a" }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto" }}><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
            </div>
            <div style={{ color: "#a1a1aa", fontSize: 14 }}>No security or performance issues found</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {advisor.map((issue, i) => (
              <div key={i} style={{ border: `1px solid ${issue.severity === "ERROR" ? ERR : WARN}44`, borderRadius: 10, background: "#151517", padding: "14px 18px", display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ color: issue.severity === "ERROR" ? ERR : WARN, fontSize: 18, marginTop: 1 }}>●</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{issue.title}</div>
                  <div style={{ fontSize: 13, color: "#a1a1aa", marginTop: 3 }}>{issue.description}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Reports ── */}
      <section>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Reports</h2>
          <button style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #33333a", background: "transparent", color: "#f4f4f5", fontSize: 13, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 16 }}>+</span> Add block
          </button>
        </div>
        <div style={{ border: "1px dashed #26262a", borderRadius: 12, padding: "60px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Build a custom report</div>
          <p style={{ margin: "0 0 20px", color: "#a1a1aa", fontSize: 14 }}>Keep track of your most important metrics</p>
          <button style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #33333a", background: "transparent", color: "#f4f4f5", fontSize: 14, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6 }}>
            Add your first block <span style={{ fontSize: 16 }}>+</span>
          </button>
        </div>
      </section>

    </main>
  );
}
