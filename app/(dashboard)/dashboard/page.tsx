"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";

const ACCENT = "#75ea5e";
const WARN = "#f59e0b";

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
  );
}

export const dynamic = "force-dynamic";

type Project = {
  id: string;
  name: string;
  slug: string;
  region: string;
  status: string;
  supabase_ref: string | null;
  org_id: string;
  created_at: string;
};

type Org = {
  id: string;
  name: string;
  plan: string;
};

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8,
  border: "1px solid #33333a", background: "#0e0e0f", color: "#f4f4f5",
  fontSize: 14, fontFamily: "inherit", marginBottom: 12,
};

function MetricBar({ value, label }: { value: number; label: string }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#a1a1aa" }}>
      <span style={{ color: "#f4f4f5", fontWeight: 500 }}>{label}</span>
      <span>{value}%</span>
      <span style={{ color: "#333" }}>·</span>
    </span>
  );
}

function InfoCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div style={{ border: "1px solid #26262a", borderRadius: 10, background: "#151517", padding: "16px 18px", display: "flex", gap: 14, alignItems: "flex-start" }}>
      <div style={{ width: 36, height: 36, borderRadius: 8, background: "#1c1c1f", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#a1a1aa" }}>
        {icon}
      </div>
      <div>
        <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 11, color: "#71717a", marginBottom: 4, letterSpacing: ".05em" }}>{label}</div>
        <div style={{ fontSize: 15, fontWeight: 500, color: "#f4f4f5" }}>{value}</div>
      </div>
    </div>
  );
}

export default function OverviewPage() {
  const [org, setOrg] = useState<Org | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);

  const [step, setStep] = useState<"idle" | "creating-org" | "creating-project">("idle");
  const [orgName, setOrgName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projectSlug, setProjectSlug] = useState("");
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: member } = await supabase
      .from("org_members")
      .select("org_id, orgs(id, name, plan)")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    if (!member) { setLoading(false); return; }
    const orgData = (member.orgs as unknown) as Org;
    setOrg(orgData);

    const { data: proj } = await supabase
      .from("projects")
      .select("*")
      .eq("org_id", orgData.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .single();

    if (proj) setProject(proj as Project);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (!project || project.status !== "active") return;
    fetch(`/api/projects/${project.id}/keys`)
      .then(r => r.json())
      .then(d => { if (d.publicKey) setPublicKey(d.publicKey); })
      .catch(() => {});
  }, [project]);

  useEffect(() => {
    if (!project || project.status === "active" || project.status === "failed") return;
    setPolling(true);
    const interval = setInterval(async () => {
      const supabase = getSupabase();
      const { data } = await supabase
        .from("projects")
        .select("status, supabase_ref")
        .eq("id", project.id)
        .single();
      if (data?.status === "active" || data?.status === "failed") {
        setProject(p => p ? { ...p, status: data.status, supabase_ref: data.supabase_ref } : p);
        setPolling(false);
        clearInterval(interval);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [project]);

  async function createOrg(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setStep("creating-org");
    const supabase = getSupabase();
    const { data, error } = await supabase.rpc("create_org", { p_name: orgName });
    if (error) { setError(error.message); setStep("idle"); return; }
    const { data: orgData } = await supabase.from("orgs").select("*").eq("id", data).single();
    setOrg(orgData as Org);
    setStep("idle");
  }

  async function createProject(e: React.FormEvent) {
    e.preventDefault();
    if (!org) return;
    setError("");
    setStep("creating-project");
    try {
      const r = await fetch(`/api/orgs/${org.id}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: projectName, slug: projectSlug, region: "us-east-1" }),
      });
      const data = await r.json();
      if (!r.ok) { setError(data.error ?? "Failed"); setStep("idle"); return; }
      const supabase = getSupabase();
      const { data: proj } = await supabase.from("projects").select("*").eq("id", data.id).single();
      setProject(proj as Project);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed");
    }
    setStep("idle");
  }

  if (loading) {
    return <main style={{ padding: "32px 40px" }}><div style={{ color: "#a1a1aa", fontSize: 14 }}>Loading…</div></main>;
  }

  if (!org) {
    return (
      <main style={{ padding: "32px 40px", maxWidth: 480 }}>
        <h1 style={{ margin: "0 0 8px", fontSize: 36, letterSpacing: "-.02em", fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500 }}>Welcome to Masidy</h1>
        <p style={{ margin: "0 0 28px", color: "#a1a1aa", fontSize: 15 }}>Create an organization to get started.</p>
        <form onSubmit={createOrg} style={{ border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 24 }}>
          <label style={{ display: "block", fontSize: 13, color: "#a1a1aa", marginBottom: 6 }}>Organization name</label>
          <input type="text" required placeholder="Acme Inc." value={orgName} onChange={e => setOrgName(e.target.value)} style={inputStyle} />
          {error && <p style={{ color: "#f87171", fontSize: 14, margin: "0 0 12px" }}>{error}</p>}
          <button type="submit" disabled={step === "creating-org"} style={{ padding: "10px 20px", borderRadius: 8, border: 0, background: "#f4f4f5", color: "#0b0b0c", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
            {step === "creating-org" ? "Creating…" : "Create organization"}
          </button>
        </form>
      </main>
    );
  }

  if (!project) {
    return (
      <main style={{ padding: "32px 40px", maxWidth: 520 }}>
        <h1 style={{ margin: "0 0 8px", fontSize: 36, letterSpacing: "-.02em", fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500 }}>Create your first project</h1>
        <p style={{ margin: "0 0 28px", color: "#a1a1aa", fontSize: 15 }}>A project is an isolated database + API for your app.</p>
        <form onSubmit={createProject} style={{ border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 24 }}>
          <label style={{ display: "block", fontSize: 13, color: "#a1a1aa", marginBottom: 6 }}>Project name</label>
          <input type="text" required placeholder="My App" value={projectName} onChange={e => setProjectName(e.target.value)} style={inputStyle} />
          <label style={{ display: "block", fontSize: 13, color: "#a1a1aa", marginBottom: 6 }}>
            Slug <span style={{ color: "#71717a" }}>→ becomes slug.masidy.com</span>
          </label>
          <input
            type="text" required placeholder="my-app"
            value={projectSlug}
            onChange={e => setProjectSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
            style={inputStyle}
          />
          {error && <p style={{ color: "#f87171", fontSize: 14, margin: "0 0 12px" }}>{error}</p>}
          <button type="submit" disabled={step === "creating-project"} style={{ padding: "10px 20px", borderRadius: 8, border: 0, background: "#f4f4f5", color: "#0b0b0c", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
            {step === "creating-project" ? "Provisioning — this takes ~30s…" : "Create project"}
          </button>
        </form>
      </main>
    );
  }

  const isActive = project.status === "active";
  const isFailed = project.status === "failed";
  const projectUrl = `https://${project.slug}.masidy.com`;
  const statusColor = isActive ? ACCENT : isFailed ? "#f87171" : WARN;
  const supabaseUrl = `https://${project.supabase_ref}.supabase.co`;

  const snippets = [
    {
      lang: "JavaScript",
      icon: "JS",
      code: `import { createClient } from '@supabase/supabase-js'\n\nconst supabase = createClient(\n  '${projectUrl}',\n  '${publicKey ?? "YOUR_PUBLIC_KEY"}'\n)`,
    },
    {
      lang: "Python",
      icon: "Py",
      code: `from supabase import create_client\n\nsupabase = create_client(\n    "${projectUrl}",\n    "${publicKey ?? "YOUR_PUBLIC_KEY"}"\n)`,
    },
    {
      lang: ".env",
      icon: "Env",
      code: `MASIDY_URL=${projectUrl}\nMASIDY_KEY=${publicKey ?? "YOUR_PUBLIC_KEY"}`,
    },
  ];

  return (
    <main style={{ padding: "32px 40px", display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Project header */}
      <div>
        <h1 style={{ margin: "0 0 6px", fontSize: 30, letterSpacing: "-.02em", fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500 }}>
          {project.name}
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 13, color: "#a1a1aa" }}>{projectUrl}</span>
          <button
            onClick={() => { navigator.clipboard.writeText(projectUrl); setCopiedUrl(true); setTimeout(() => setCopiedUrl(false), 2000); }}
            style={{ padding: "3px 10px", borderRadius: 6, border: "1px solid #33333a", background: "transparent", color: "#a1a1aa", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
          >
            {copiedUrl ? "Copied!" : "Copy"}
          </button>
          {!isActive && !isFailed && (
            <button onClick={loadData} style={{ padding: "3px 10px", borderRadius: 6, border: "1px solid #33333a", background: "transparent", color: "#a1a1aa", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
              ↻ Refresh status
            </button>
          )}
        </div>
      </div>

      {/* Provisioning / failed banners */}
      {!isActive && !isFailed && (
        <div style={{ padding: "13px 18px", borderRadius: 10, border: `1px solid ${WARN}44`, background: `${WARN}11`, fontSize: 14, color: WARN }}>
          Your project is being provisioned. This usually takes 1–2 minutes. The page will update automatically.
          {polling && <span style={{ marginLeft: 8, opacity: 0.7 }}>Checking…</span>}
        </div>
      )}
      {isFailed && (
        <div style={{ padding: "13px 18px", borderRadius: 10, border: "1px solid #f8717144", background: "#f8717111", fontSize: 14, color: "#f87171" }}>
          Provisioning failed. Please contact support or create a new project.
        </div>
      )}

      {/* Info cards grid — like Supabase */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
        <InfoCard
          label="STATUS"
          value={isActive ? "Healthy" : isFailed ? "Failed" : "Provisioning"}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={statusColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
            </svg>
          }
        />
        <InfoCard
          label="PLAN"
          value={org.plan.charAt(0).toUpperCase() + org.plan.slice(1)}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l9 5-9 5-9-5zM3 13l9 5 9-5" />
            </svg>
          }
        />
        <InfoCard
          label="REGION"
          value={project.region}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
            </svg>
          }
        />
        <InfoCard
          label="CREATED"
          value={new Date(project.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
          }
        />
      </div>

      {/* Primary database card */}
      {isActive && (
        <div style={{ border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: "#1c1c1f", display: "flex", alignItems: "center", justifyContent: "center", color: ACCENT }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5" /><path d="M3 12c0 1.7 4 3 9 3s9-1.3 9-3" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>Primary Database</div>
                <div style={{ fontSize: 13, color: "#a1a1aa", marginTop: 2 }}>{project.region} · free tier</div>
              </div>
            </div>
            <a href={`https://supabase.com/dashboard/project/${project.supabase_ref}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: ACCENT, textDecoration: "none" }}>
              Open in Supabase →
            </a>
          </div>
          <div style={{ display: "flex", gap: 20, marginTop: 16, flexWrap: "wrap" }}>
            {[["CPU", "—"], ["Disk", "—"], ["RAM", "—"], ["Connections", "—"]].map(([label, val]) => (
              <span key={label} style={{ fontSize: 13, color: "#a1a1aa" }}>
                <span style={{ color: "#f4f4f5", fontWeight: 500 }}>{label}</span> {val}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Connect section */}
      <section style={{ border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
          <h2 style={{ margin: 0, fontSize: 17 }}>Connect your app</h2>
          <button
            onClick={() => { navigator.clipboard.writeText(`MASIDY_URL=${projectUrl}\nMASIDY_KEY=${publicKey ?? "pending"}`); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #33333a", background: "transparent", color: "#f4f4f5", fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}
          >
            {copied ? "Copied!" : "Copy .env"}
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 12 }}>
          <div>
            <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 11, color: "#a1a1aa", marginBottom: 6 }}>MASIDY_URL</div>
            <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 13, padding: "10px 12px", borderRadius: 8, background: "#0e0e0f", border: "1px solid #26262a" }}>{projectUrl}</div>
          </div>
          <div>
            <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 11, color: "#a1a1aa", marginBottom: 6 }}>MASIDY_KEY (public)</div>
            {publicKey ? (
              <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 12, padding: "10px 12px", borderRadius: 8, background: "#0e0e0f", border: "1px solid #26262a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{publicKey}</div>
            ) : (
              <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 13, padding: "10px 12px", borderRadius: 8, background: "#0e0e0f", border: "1px solid #26262a", color: "#71717a" }}>
                {isActive ? "Loading…" : "Available once active"}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Metrics */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
        {[
          { label: "DATABASE SIZE", limit: "500 MB" },
          { label: "ACTIVE USERS", limit: "10,000" },
          { label: "STORAGE", limit: "1 GB" },
          { label: "EGRESS", limit: "2 GB/mo" },
        ].map(({ label, limit }) => (
          <div key={label} style={{ border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 20 }}>
            <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 11, color: "#a1a1aa" }}>{label}</div>
            <div style={{ fontSize: 28, fontWeight: 600, margin: "8px 0 10px", letterSpacing: "-.02em" }}>—</div>
            <div style={{ height: 6, borderRadius: 99, background: "#26262a" }} />
            <div style={{ fontSize: 12, color: "#71717a", marginTop: 8 }}>of {limit}</div>
          </div>
        ))}
      </section>

      {/* Services + Recent requests */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))", gap: 20 }}>
        <section style={{ border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 20 }}>
          <h2 style={{ margin: "0 0 8px", fontSize: 17 }}>Services</h2>
          {[
            { name: "Database", href: "/dashboard/table-editor", status: isActive ? "Ready" : "Provisioning" },
            { name: "Auth", href: "/dashboard/auth", status: isActive ? "Ready" : "Provisioning" },
            { name: "Storage", href: "/dashboard/storage", status: isActive ? "Ready" : "Provisioning" },
            { name: "Domains", href: "/dashboard/domains", status: "No domain connected" },
            { name: "Email", href: "/dashboard/email", status: "Not configured" },
          ].map(({ name, href, status }) => (
            <Link key={name} href={href} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderTop: "1px solid #26262a", fontSize: 14, textDecoration: "none", color: "inherit" }}>
              <span style={{ color: isActive ? ACCENT : WARN }}>●</span>
              <span style={{ flex: 1 }}>{name}</span>
              <span style={{ color: "#a1a1aa" }}>{status}</span>
            </Link>
          ))}
        </section>

        <section style={{ border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <h2 style={{ margin: 0, fontSize: 17 }}>Recent requests</h2>
            <Link href="/dashboard/logs" style={{ fontSize: 14, color: ACCENT, textDecoration: "none" }}>Open logs →</Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "70px 1fr 60px", gap: 8, padding: "10px 0", borderTop: "1px solid #26262a", fontFamily: "'Geist Mono',monospace", fontSize: 11, color: "#71717a" }}>
            <span>METHOD</span><span>PATH</span><span>STATUS</span>
          </div>
          <div style={{ padding: "36px 0", textAlign: "center", borderTop: "1px solid #26262a", color: "#a1a1aa", fontSize: 14 }}>
            No requests yet. Make your first call from your app and it shows up here.
          </div>
        </section>
      </div>

      {/* Get connected — quick-start snippets */}
      <section>
        <h2 style={{ margin: "0 0 16px", fontSize: 20, letterSpacing: "-.01em", fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500 }}>Get connected</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 12 }}>
          {snippets.map(({ lang, icon, code }) => (
            <div key={lang} style={{ border: "1px solid #26262a", borderRadius: 12, background: "#151517", overflow: "hidden" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderBottom: "1px solid #26262a" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 11, padding: "2px 7px", borderRadius: 5, background: "#26262a", color: "#a1a1aa" }}>{icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{lang}</span>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(code)}
                  style={{ fontSize: 12, color: "#a1a1aa", background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit" }}
                >
                  Copy
                </button>
              </div>
              <pre style={{ margin: 0, padding: "14px", fontFamily: "'Geist Mono',monospace", fontSize: 12, lineHeight: 1.7, color: "#a1a1aa", overflowX: "auto", whiteSpace: "pre" }}>
                {code}
              </pre>
            </div>
          ))}
        </div>
      </section>

    </main>
  );
}
