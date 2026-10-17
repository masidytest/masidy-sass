"use client";

import { useState, useEffect, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";

import { InfraCanvas } from "./InfraCanvas";
import { SortableSection } from "./SortableSection";
import { WIDGET_REGISTRY } from "./widget-registry";
import { useDashboardLayout } from "@/lib/hooks/use-dashboard-layout";
import type { InfraData, DbStats, BranchInfo, BackupInfo } from "@/lib/types/overview";

const ACCENT = "#75ea5e";
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

function InfoCard({ label, value, sub, loading }: { label: string; value: string; sub?: string; loading?: boolean }) {
  return (
    <div style={{ border: "1px solid #26262a", borderRadius: 10, background: "#151517", padding: "14px 16px" }}>
      <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 10, color: "#71717a", marginBottom: 6, letterSpacing: ".06em" }}>{label}</div>
      {loading
        ? <div style={{ height: 18, width: 100, background: "#26262a", borderRadius: 4 }} />
        : <>
            <div style={{ fontSize: 14, fontWeight: 500, color: "#f4f4f5" }}>{value}</div>
            {sub && <div style={{ fontSize: 11, color: "#71717a", marginTop: 3 }}>{sub}</div>}
          </>
      }
    </div>
  );
}

function ProjectSection({
  project, infra, stats, branches, backups,
  infraLoading, statsLoading, branchesLoading, backupsLoading,
}: {
  project: Project; infra: InfraData | null; stats: DbStats | null;
  branches: BranchInfo[]; backups: BackupInfo[];
  infraLoading: boolean; statsLoading: boolean; branchesLoading: boolean; backupsLoading: boolean;
}) {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const projectUrl = `https://${project.slug}.masidy.com`;
  const lastBranch = branches[0]?.name ?? null;
  const lastBackup = backups[0]?.created_at
    ? new Date(backups[0].created_at).toLocaleDateString() : null;
  const isActive = project.status === "active";

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ margin: "0 0 6px", fontSize: 28, letterSpacing: "-.02em", fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500 }}>
          {project.name}
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 13, color: "#a1a1aa" }}>{projectUrl}</span>
          <button onClick={() => { navigator.clipboard.writeText(projectUrl); setCopiedUrl(true); setTimeout(() => setCopiedUrl(false), 2000); }}
            style={{ padding: "3px 10px", borderRadius: 6, border: "1px solid #33333a", background: "transparent", color: "#a1a1aa", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
            {copiedUrl ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10, marginBottom: 16 }}>
        <InfoCard label="STATUS" loading={infraLoading} value={isActive ? "Healthy" : project.status} />
        <InfoCard label="COMPUTE SIZE" loading={infraLoading} value={infra?.compute ?? "—"} sub="Free tier" />
        <InfoCard label="GITHUB" loading={false} value="Not connected" sub="Connect a repo" />
        <InfoCard label="RECENT BRANCH" loading={branchesLoading} value={lastBranch ?? "No branches"} />
        <InfoCard label="LAST MIGRATION" loading={false} value="No migrations" />
        <InfoCard label="LAST BACKUP" loading={backupsLoading} value={lastBackup ?? "No backups"} />
      </div>

      <InfraCanvas infra={infra} stats={stats} loading={infraLoading || statsLoading} />
    </div>
  );
}

export default function OverviewClient() {
  const [org, setOrg] = useState<Org | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loadingBase, setLoadingBase] = useState(true);
  const [infra, setInfra] = useState<InfraData | null>(null);
  const [stats, setStats] = useState<DbStats | null>(null);
  const [branches, setBranches] = useState<BranchInfo[]>([]);
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [infraLoading, setInfraLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [backupsLoading, setBackupsLoading] = useState(true);

  const [step, setStep] = useState<"idle" | "creating-org" | "creating-project">("idle");
  const [orgName, setOrgName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projectSlug, setProjectSlug] = useState("");
  const [formError, setFormError] = useState("");
  const [addMenuOpen, setAddMenuOpen] = useState(false);

  const { widgets, setWidgets, KNOWN_WIDGETS } = useDashboardLayout();
  const safeWidgets = Array.isArray(widgets) ? widgets : ["project", "requests", "advisor"];

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const loadBase = useCallback(async () => {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoadingBase(false); return; }
    const { data: member } = await supabase
      .from("org_members").select("org_id, orgs(id, name, plan)")
      .eq("user_id", user.id).limit(1).single();
    if (!member) { setLoadingBase(false); return; }
    const orgData = (member.orgs as unknown) as Org;
    setOrg(orgData);
    const { data: proj } = await supabase.from("projects").select("*")
      .eq("org_id", orgData.id).order("created_at", { ascending: true }).limit(1).single();
    if (proj) setProject(proj as Project);
    setLoadingBase(false);
  }, []);

  useEffect(() => { loadBase(); }, [loadBase]);

  useEffect(() => {
    if (!project) return;
    const id = project.id;
    setInfraLoading(true);
    fetch(`/api/projects/${id}/infra`).then(r => r.json())
      .then(d => { if (d?.ref) setInfra(d); }).catch(() => {})
      .finally(() => setInfraLoading(false));
    setStatsLoading(true);
    fetch(`/api/projects/${id}/stats`).then(r => r.json())
      .then(d => { if (d?.cpu !== undefined) setStats(d); }).catch(() => {})
      .finally(() => setStatsLoading(false));
    setBranchesLoading(true);
    fetch(`/api/projects/${id}/branches`).then(r => r.json())
      .then(d => { if (Array.isArray(d)) setBranches(d); }).catch(() => {})
      .finally(() => setBranchesLoading(false));
    setBackupsLoading(true);
    fetch(`/api/projects/${id}/backups`).then(r => r.json())
      .then(d => { if (Array.isArray(d)) setBackups(d); }).catch(() => {})
      .finally(() => setBackupsLoading(false));
  }, [project]);

  useEffect(() => {
    if (!project) return;
    const interval = setInterval(() => {
      fetch(`/api/projects/${project.id}/stats`).then(r => r.json())
        .then(d => { if (d?.cpu !== undefined) setStats(d); }).catch(() => {});
    }, 60_000);
    return () => clearInterval(interval);
  }, [project]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIdx = safeWidgets.indexOf(String(active.id));
      const newIdx = safeWidgets.indexOf(String(over.id));
      if (oldIdx !== -1 && newIdx !== -1) setWidgets(arrayMove(safeWidgets, oldIdx, newIdx));
    }
  }

  const removeWidget = (id: string) => setWidgets(safeWidgets.filter(w => w !== id));
  const addWidget = (id: string) => { if (!safeWidgets.includes(id)) setWidgets([...safeWidgets, id]); setAddMenuOpen(false); };
  const hiddenWidgets = Array.from(KNOWN_WIDGETS).filter(id => !safeWidgets.includes(id));

  if (loadingBase) {
    return <main style={{ padding: "32px 40px" }}><div style={{ color: "#a1a1aa" }}>Loading…</div></main>;
  }

  if (!org) {
    return (
      <main style={{ padding: "32px 40px", maxWidth: 480 }}>
        <h1 style={{ margin: "0 0 8px", fontSize: 36, letterSpacing: "-.02em", fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500 }}>Welcome to Masidy</h1>
        <p style={{ margin: "0 0 28px", color: "#a1a1aa", fontSize: 15 }}>Create an organization to get started.</p>
        <form onSubmit={async e => {
          e.preventDefault(); setFormError(""); setStep("creating-org");
          const supabase = getSupabase();
          const { data, error } = await supabase.rpc("create_org", { p_name: orgName });
          if (error) { setFormError(error.message); setStep("idle"); return; }
          const { data: orgData } = await supabase.from("orgs").select("*").eq("id", data).single();
          setOrg(orgData as Org); setStep("idle");
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
            const supabase = getSupabase();
            const { data: proj } = await supabase.from("projects").select("*").eq("id", data.id).single();
            setProject(proj as Project);
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

  return (
    <main style={{ padding: "32px 40px" }}>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={safeWidgets} strategy={verticalListSortingStrategy}>
          {safeWidgets.map(id => {
            if (id === "project") {
              return (
                <SortableSection key="project" id="project" title="Project Overview" onRemove={() => removeWidget("project")}>
                  <ProjectSection
                    project={project} infra={infra} stats={stats}
                    branches={branches} backups={backups}
                    infraLoading={infraLoading} statsLoading={statsLoading}
                    branchesLoading={branchesLoading} backupsLoading={backupsLoading}
                  />
                </SortableSection>
              );
            }
            const entry = WIDGET_REGISTRY[id];
            if (!entry) return null;
            const Widget = entry.component;
            return (
              <SortableSection key={id} id={id} title={entry.title} onRemove={() => removeWidget(id)}>
                <Widget projectId={project.id} />
              </SortableSection>
            );
          })}
        </SortableContext>
      </DndContext>

      {hiddenWidgets.length > 0 && (
        <div style={{ position: "relative", display: "inline-block", marginTop: 8 }}>
          <button onClick={() => setAddMenuOpen(o => !o)} aria-label="Add a section"
            style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #33333a", background: "transparent", color: "#a1a1aa", fontSize: 14, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
            Add section
          </button>
          {addMenuOpen && (
            <div style={{ position: "absolute", bottom: "110%", left: 0, background: "#151517", border: "1px solid #26262a", borderRadius: 10, padding: "6px 0", minWidth: 180, zIndex: 50, boxShadow: "0 8px 32px rgba(0,0,0,.5)" }}>
              {hiddenWidgets.map(id => {
                const title = id === "project" ? "Project Overview" : (WIDGET_REGISTRY[id]?.title ?? id);
                return (
                  <button key={id} onClick={() => addWidget(id)}
                    style={{ display: "block", width: "100%", padding: "9px 16px", background: "transparent", border: "none", color: "#f4f4f5", fontSize: 14, textAlign: "left", cursor: "pointer", fontFamily: "inherit" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#1c1c1f")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    {title}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
