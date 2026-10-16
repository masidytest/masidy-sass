"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";

const ACCENT = "#75ea5e";

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
};

type Org = {
  id: string;
  name: string;
  plan: string;
};

export default function OverviewPage() {
  const [org, setOrg] = useState<Org | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Create org + project flow
  const [step, setStep] = useState<"idle" | "creating-org" | "creating-project">("idle");
  const [orgName, setOrgName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projectSlug, setProjectSlug] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get orgs the user belongs to
      const { data: members } = await supabase
        .from("org_members")
        .select("org_id, orgs(id, name, plan)")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      if (!members) { setLoading(false); return; }

      const orgData = (members.orgs as unknown) as Org;
      setOrg(orgData);

      // Get first project in that org
      const { data: proj } = await supabase
        .from("projects")
        .select("*")
        .eq("org_id", orgData.id)
        .limit(1)
        .single();

      if (proj) setProject(proj as Project);
      setLoading(false);
    }
    load();
  }, []);

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
      // Reload project
      const supabase = getSupabase();
      const { data: proj } = await supabase.from("projects").select("*").eq("id", data.id).single();
      setProject(proj as Project);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed");
    }
    setStep("idle");
  }

  function copyEnv() {
    if (!project) return;
    const url = `https://${project.slug}.masidy.com`;
    navigator.clipboard.writeText(`MASIDY_URL=${url}\nMASIDY_KEY=your-public-key`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8,
    border: "1px solid #33333a", background: "#0e0e0f", color: "#f4f4f5",
    fontSize: 14, fontFamily: "inherit", marginBottom: 12,
  };

  if (loading) {
    return (
      <main style={{ padding: "32px 40px" }}>
        <div style={{ color: "#a1a1aa" }}>Loading…</div>
      </main>
    );
  }

  // ── No org yet ──────────────────────────────────────────────
  if (!org) {
    return (
      <main style={{ padding: "32px 40px", maxWidth: 480 }}>
        <h1 style={{ margin: "0 0 8px", fontSize: 36, letterSpacing: "-.02em", fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500 }}>Welcome to Masidy</h1>
        <p style={{ margin: "0 0 28px", color: "#a1a1aa", fontSize: 15 }}>Create an organization to get started.</p>
        <form onSubmit={createOrg} style={{ border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 24 }}>
          <label style={{ display: "block", fontSize: 13, color: "#a1a1aa", marginBottom: 6 }}>Organization name</label>
          <input
            type="text" required placeholder="Acme Inc."
            value={orgName} onChange={e => setOrgName(e.target.value)}
            style={inputStyle}
          />
          {error && <p style={{ color: "#f87171", fontSize: 14, margin: "0 0 12px" }}>{error}</p>}
          <button type="submit" disabled={step === "creating-org"} style={{ padding: "10px 20px", borderRadius: 8, border: 0, background: "#f4f4f5", color: "#0b0b0c", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
            {step === "creating-org" ? "Creating…" : "Create organization"}
          </button>
        </form>
      </main>
    );
  }

  // ── Org exists but no project yet ───────────────────────────
  if (!project) {
    return (
      <main style={{ padding: "32px 40px", maxWidth: 520 }}>
        <h1 style={{ margin: "0 0 8px", fontSize: 36, letterSpacing: "-.02em", fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500 }}>Create your first project</h1>
        <p style={{ margin: "0 0 28px", color: "#a1a1aa", fontSize: 15 }}>A project is an isolated database + API for your app.</p>
        <form onSubmit={createProject} style={{ border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 24 }}>
          <label style={{ display: "block", fontSize: 13, color: "#a1a1aa", marginBottom: 6 }}>Project name</label>
          <input
            type="text" required placeholder="My App"
            value={projectName} onChange={e => setProjectName(e.target.value)}
            style={inputStyle}
          />
          <label style={{ display: "block", fontSize: 13, color: "#a1a1aa", marginBottom: 6 }}>
            Slug <span style={{ color: "#71717a" }}>— becomes myapp.masidy.com</span>
          </label>
          <input
            type="text" required placeholder="my-app"
            value={projectSlug}
            onChange={e => setProjectSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
            style={inputStyle}
          />
          {error && <p style={{ color: "#f87171", fontSize: 14, margin: "0 0 12px" }}>{error}</p>}
          <button type="submit" disabled={step === "creating-project"} style={{ padding: "10px 20px", borderRadius: 8, border: 0, background: "#f4f4f5", color: "#0b0b0c", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
            {step === "creating-project" ? "Provisioning…" : "Create project"}
          </button>
          <p style={{ margin: "12px 0 0", fontSize: 13, color: "#71717a" }}>This provisions a real Supabase database — takes ~30 seconds.</p>
        </form>
      </main>
    );
  }

  // ── Project exists — show dashboard ─────────────────────────
  const projectUrl = `https://${project.slug}.masidy.com`;

  return (
    <main style={{ padding: "32px 40px", display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 16, flexWrap: "wrap" }}>
        <h1 style={{ margin: 0, fontSize: 36, letterSpacing: "-.02em", fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500 }}>Overview</h1>
        <span style={{ fontSize: 13, color: "#a1a1aa" }}>
          <span style={{ color: project.status === "active" ? ACCENT : "#f59e0b" }}>●</span>
          {" "}{project.status} · {project.region} · {org.plan} plan
        </span>
      </div>

      {/* Connect your app */}
      <section style={{ border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
          <h2 style={{ margin: 0, fontSize: 17 }}>Connect your app</h2>
          <button onClick={copyEnv} style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #33333a", background: "transparent", color: "#f4f4f5", fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
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
            <Link href="/api-keys" style={{ display: "block", fontFamily: "'Geist Mono',monospace", fontSize: 13, padding: "10px 12px", borderRadius: 8, background: "#0e0e0f", border: "1px solid #26262a", color: ACCENT, textDecoration: "none" }}>
              View in API keys →
            </Link>
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
            { name: "Database", status: "Ready" },
            { name: "Auth", status: "Ready" },
            { name: "Storage", status: "Ready" },
            { name: "Domains", status: "No domain connected" },
            { name: "Email", status: "Not configured" },
          ].map(({ name, status }) => (
            <div key={name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderTop: "1px solid #26262a", fontSize: 14 }}>
              <span style={{ color: ACCENT }}>●</span>
              <span style={{ flex: 1 }}>{name}</span>
              <span style={{ color: "#a1a1aa" }}>{status}</span>
            </div>
          ))}
        </section>

        <section style={{ border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <h2 style={{ margin: 0, fontSize: 17 }}>Recent requests</h2>
            <Link href="/logs" style={{ fontSize: 14, color: ACCENT, textDecoration: "none" }}>Open logs →</Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "70px 1fr 60px", gap: 8, padding: "10px 0", borderTop: "1px solid #26262a", fontFamily: "'Geist Mono',monospace", fontSize: 11, color: "#71717a" }}>
            <span>METHOD</span><span>PATH</span><span>STATUS</span>
          </div>
          <div style={{ padding: "36px 0", textAlign: "center", borderTop: "1px solid #26262a", color: "#a1a1aa", fontSize: 14 }}>
            No requests yet. Make your first call from your app and it shows up here.
          </div>
        </section>
      </div>
    </main>
  );
}
