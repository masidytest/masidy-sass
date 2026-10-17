"use client";

import { useState, useEffect } from "react";
import { useProject } from "@/lib/hooks/use-project";
import { useRouter } from "next/navigation";

const ERR = "#f87171";

export default function SettingsPage() {
  const { project, loading, error: projectError, updateProjectName, removeProject } = useProject();
  const router = useRouter();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => { if (project) setName(project.name); }, [project]);

  async function saveChanges(e: React.FormEvent) {
    e.preventDefault();
    if (!project) return;
    setSaving(true);
    setError("");
    setStatus("");
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not save project settings");
      setName(data.project.name);
      updateProjectName(project.id, data.project.name);
      setSaved(true);
      setStatus("Project settings saved.");
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save project settings");
    } finally {
      setSaving(false);
    }
  }

  async function deleteProject() {
    if (!project || deleteText !== project.name) return;
    setDeleting(true);
    setError("");
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: deleteText }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not delete project");
      removeProject(project.id);
      router.push("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete project");
      setDeleting(false);
    }
  }

  if (loading) return <main style={{ padding: "32px 40px" }}><div style={{ color: "#a1a1aa" }}>Loading…</div></main>;
  if (projectError || !project) return <main style={{ padding: "32px 40px", color: ERR }}>{projectError ?? "No project available."}</main>;

  return (
    <main style={{ padding: "32px 40px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: "0 0 6px", fontSize: 36, letterSpacing: "-.02em", fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500 }}>Settings</h1>
        <p style={{ margin: 0, color: "#a1a1aa", fontSize: 15 }}>Project name, region and danger zone.</p>
      </div>
      {error && <p role="alert" style={{ color: ERR, fontSize: 14 }}>{error}</p>}
      {status && <p role="status" style={{ color: "#75ea5e", fontSize: 14 }}>{status}</p>}

      <section style={{ border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 20, marginBottom: 20 }}>
        <h2 style={{ margin: "0 0 6px", fontSize: 17 }}>General</h2>
        <form onSubmit={saveChanges} style={{ marginTop: 14, maxWidth: 420 }}>
          <label htmlFor="pn" style={{ display: "block", fontSize: 13, color: "#a1a1aa", marginBottom: 6 }}>Project name</label>
          <input id="pn" type="text" value={name} onChange={e => setName(e.target.value)} required maxLength={48}
            style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8, border: "1px solid #33333a", background: "#0e0e0f", color: "#f4f4f5", fontSize: 14, fontFamily: "inherit", marginBottom: 16 }} />
          <label style={{ display: "block", fontSize: 13, color: "#a1a1aa", marginBottom: 6 }}>Region</label>
          <input type="text" value={project?.region ?? ""} readOnly
            style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8, border: "1px solid #26262a", background: "#0e0e0f", color: "#71717a", fontSize: 14, fontFamily: "inherit", marginBottom: 16 }} />
          <label style={{ display: "block", fontSize: 13, color: "#a1a1aa", marginBottom: 6 }}>Project ID</label>
          <input type="text" value={project?.id ?? ""} readOnly
            style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8, border: "1px solid #26262a", background: "#0e0e0f", color: "#71717a", fontSize: 14, fontFamily: "inherit", marginBottom: 16 }} />
          <button type="submit" disabled={saving}
            style={{ padding: "8px 14px", borderRadius: 8, border: 0, background: "#f4f4f5", color: "#0b0b0c", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
            {saved ? "Saved!" : saving ? "Saving…" : "Save changes"}
          </button>
        </form>
      </section>

      <section style={{ border: "1px solid #3f1d1d", borderRadius: 12, background: "#151517", padding: 20 }}>
        <h2 style={{ margin: "0 0 6px", fontSize: 17 }}>Danger zone</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 0", borderTop: "1px solid #26262a" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Delete project</div>
            <div style={{ fontSize: 13, color: "#a1a1aa" }}>This permanently deletes the Supabase project and its data. Projects with registered domains or an email domain must be detached first.</div>
          </div>
          <button onClick={() => { setError(""); setConfirmDelete(c => !c); }}
            style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #7f1d1d", background: "transparent", color: ERR, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
            Delete
          </button>
        </div>
        {confirmDelete && (
          <div style={{ padding: "14px 0", borderTop: "1px solid #26262a" }}>
            <p style={{ margin: "0 0 10px", fontSize: 13, color: "#a1a1aa" }}>
              Type <strong style={{ color: "#f4f4f5" }}>{project?.name}</strong> to confirm deletion:
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <input type="text" value={deleteText} onChange={e => setDeleteText(e.target.value)}
                placeholder={project?.name}
                style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: "1px solid #7f1d1d", background: "#0e0e0f", color: "#f4f4f5", fontSize: 14, fontFamily: "inherit" }} />
              <button onClick={deleteProject} disabled={deleteText !== project?.name || deleting}
                style={{ padding: "8px 14px", borderRadius: 8, border: 0, background: deleteText === project?.name ? ERR : "#33333a", color: deleteText === project?.name ? "#fff" : "#71717a", fontWeight: 600, fontSize: 14, cursor: deleteText === project?.name ? "pointer" : "not-allowed", fontFamily: "inherit" }}>
                {deleting ? "Deleting…" : "Confirm delete"}
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
