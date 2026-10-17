"use client";

import { useState, useEffect, useCallback } from "react";
import { useProject } from "@/lib/hooks/use-project";

const ACCENT = "#75ea5e";

type AuthUser = { id: string; email: string; created_at: string; last_sign_in_at?: string; app_metadata?: { provider?: string } };

export default function AuthPage() {
  const { project, loading: projLoading, error: projectError } = useProject();
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState("");

  const loadUsers = useCallback(async () => {
    if (!project?.supabase_ref) {
      setUsers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError("");
    try {
      const response = await fetch(`/api/projects/${project.id}/auth/users`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not load project users");
      if (!Array.isArray(data)) throw new Error("Users API returned an unexpected response");
      setUsers(data);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Could not load project users");
    } finally {
      setLoading(false);
    }
  }, [project?.id, project?.supabase_ref]);

  useEffect(() => { void loadUsers(); }, [loadUsers]);

  async function inviteUser(e: React.FormEvent) {
    e.preventDefault();
    if (!project) return;
    setInviting(true);
    setInviteMsg("");
    try {
      const r = await fetch(`/api/projects/${project.id}/auth/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Failed to send invitation");
      setInviteMsg("Invite sent!");
      setInviteEmail("");
      await loadUsers();
    } catch (e) {
      setInviteMsg(e instanceof Error ? e.message : "Failed to send invitation");
    } finally {
      setInviting(false);
    }
  }

  if (projLoading) return <main style={{ padding: "32px 40px" }}><div style={{ color: "#a1a1aa" }}>Loading…</div></main>;
  if (projectError || !project) return <main style={{ padding: "32px 40px", color: "#f87171" }}>{projectError ?? "No project available."}</main>;

  return (
    <main style={{ padding: "32px 40px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: "0 0 6px", fontSize: 36, letterSpacing: "-.02em", fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500 }}>Authentication</h1>
          <p style={{ margin: 0, color: "#a1a1aa", fontSize: 15 }}>Users of your project.</p>
        </div>
        <button type="button" onClick={() => void loadUsers()} disabled={loading || !project.supabase_ref}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #33333a", background: "transparent", color: "#f4f4f5", fontSize: 13, cursor: loading ? "wait" : "pointer", fontFamily: "inherit" }}>
          {loading ? "Refreshing…" : "Refresh users"}
        </button>
        <form onSubmit={inviteUser} style={{ display: "flex", gap: 8 }}>
          <input type="email" required placeholder="user@example.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #33333a", background: "#0e0e0f", color: "#f4f4f5", fontSize: 14, fontFamily: "inherit", width: 220 }} />
          <button type="submit" disabled={inviting}
            style={{ padding: "8px 14px", borderRadius: 8, border: 0, background: "#f4f4f5", color: "#0b0b0c", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
            {inviting ? "Inviting…" : "Invite user"}
          </button>
        </form>
      </div>
      {inviteMsg && <p role="status" style={{ margin: "0 0 16px", fontSize: 13, color: inviteMsg === "Invite sent!" ? ACCENT : "#f87171" }}>{inviteMsg}</p>}

      <section style={{ border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 20 }}>
        <h2 style={{ margin: "0 0 6px", fontSize: 17 }}>Users {!loading && `(${users.length})`}</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", gap: 8, padding: "10px 0", borderBottom: "1px solid #26262a", fontFamily: "'Geist Mono',monospace", fontSize: 11, color: "#71717a" }}>
          <span>EMAIL</span><span>PROVIDER</span><span>LAST SIGN-IN</span>
        </div>
        {loading ? (
          <div style={{ padding: "40px 0", textAlign: "center", color: "#a1a1aa", fontSize: 14 }}>Loading users…</div>
        ) : loadError ? (
          <div role="alert" style={{ padding: "40px 0", textAlign: "center", color: "#f87171", fontSize: 14 }}>{loadError}</div>
        ) : users.length === 0 ? (
          <div style={{ padding: "40px 0", textAlign: "center", color: "#a1a1aa", fontSize: 14 }}>
            {project.status !== "active" ? "Project is still provisioning." : "No users yet. Invite someone or let them sign up through your app."}
          </div>
        ) : (
          users.map(u => (
            <div key={u.id} style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", gap: 8, alignItems: "center", padding: "12px 0", borderTop: "1px solid #26262a", fontSize: 13 }}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</span>
              <span style={{ color: "#a1a1aa", textTransform: "capitalize" }}>{u.app_metadata?.provider ?? "email"}</span>
              <span style={{ color: "#a1a1aa", fontSize: 12 }}>{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString() : "Never"}</span>
            </div>
          ))
        )}
      </section>
    </main>
  );
}
