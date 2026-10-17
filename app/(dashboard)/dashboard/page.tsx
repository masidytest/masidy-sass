"use client";

import { useState, useEffect, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";

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

export default function OverviewPage() {
  const [org, setOrg] = useState<Org | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);

  const [step, setStep] = useState<"idle" | "creating-org" | "creating-project">("idle");
  const [orgName, setOrgName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projectSlug, setProjectSlug] = useState("");
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    const sb = getSupabase();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data: m } = await sb.from("org_members")
      .select("org_id, orgs(id, name, plan)").eq("user_id", user.id).limit(1).single();
    if (!m) { setLoading(false); return; }
    setOrg((m.orgs as unknown) as Org);
    const { data: p } = await sb.from("projects").select("*")
      .eq("org_id", (m.orgs as unknown as Org).id).order("created_at", { ascending: true }).limit(1).single();
    if (p) setProject(p as Project);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!project || project.status !== "active") return;
    fetch(`/api/projects/${project.id}/keys`)
      .then(r => r.json()).then(d => { if (d.publicKey) setPublicKey(d.publicKey); }).catch(() => {});
  }, [project]);

  if (loading) {
    return <main style={{ padding: "32px 40px" }}><div style={{ color: "#a1a1aa" }}>Loading…</div></main>;
  }

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
          const { data: o } = await sb.from("orgs").select("*").eq("id", data).single();
          setOrg(o as Org); setStep("idle");
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

  if (!project) {
    return (
      <main style={{ padding: "32px 40px", maxWidth: 520 }}>
        <h1 style={{ margin: "0 0 8px", fontSize: 36, letterSpacing: "-.02em", fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500 }}>Create your first project</h1>
        <p style={{ margin: "0 0 28px", color: "#a1a1aa", fontSize: 15 }}>A project gives your app an isolated database, auth and storage.</p>
        <form onSubmit={async e => {
          e.preventDefault(); if (!org) return; setFormError(""); setStep("creating-project");
          try {
            const r = await fetch(`/api/orgs/${org.id}/projects`, {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: projectName, slug: projectSlug, region: "us-east-1" }),
            });
            const data = await r.json();
            if (!r.ok) { setFormError(data.error ?? "Failed"); setStep("idle"); return; }
            const sb = getSupabase();
            const { data: p } = await sb.from("projects").select("*").eq("id", data.id).single();
            setProject(p as Project);
          } catch (err: unknown) { setFormError(err instanceof Error ? err.message : "Failed"); }
          setStep("idle");
        }} style={{ border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 24 }}>
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
  }

  const isActive = project.status === "active";
  const projectUrl = `https://${project.slug}.masidy.com`;
  const statusColor = isActive ? ACCENT : project.status === "failed" ? ERR : WARN;

  return (
    <main style={{ padding: "32px 40px", display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 16, flexWrap: "wrap" }}>
        <h1 style={{ margin: 0, fontSize: 36, letterSpacing: "-.02em", fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500 }}>Overview</h1>
        <span style={{ fontSize: 13, color: "#a1a1aa" }}>
          <span style={{ color: statusColor }}>●</span> {project.status} · {project.region} · {org.plan} plan
        </span>
      </div>

      {/* Connect your app */}
      <section style={{ border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
          <h2 style={{ margin: 0, fontSize: 17 }}>Connect your app</h2>
          <button onClick={() => {
            navigator.clipboard.writeText(`MASIDY_URL=${projectUrl}\nMASIDY_KEY=${publicKey ?? "pending"}`);
            setCopied(true); setTimeout(() => setCopied(false), 2000);
          }} style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #33333a", background: "transparent", color: "#f4f4f5", fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
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
            {publicKey
              ? <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 12, padding: "10px 12px", borderRadius: 8, background: "#0e0e0f", border: "1px solid #26262a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{publicKey}</div>
              : <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 13, padding: "10px 12px", borderRadius: 8, background: "#0e0e0f", border: "1px solid #26262a", color: "#71717a" }}>{isActive ? "Loading…" : "Available once active"}</div>
            }
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

    </main>
  );
}
