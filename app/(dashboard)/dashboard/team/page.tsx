"use client";

import { useState, useEffect, useCallback } from "react";
import { useProject } from "@/lib/hooks/use-project";

type Member = { user_id: string; role: string; email: string | null; name: string | null; is_current_user: boolean };

export default function TeamPage() {
  const { project, loading: projLoading, error: projectError } = useProject();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("developer");
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState("");
  const [memberActionError, setMemberActionError] = useState("");
  const [savingMember, setSavingMember] = useState("");

  const loadMembers = useCallback(async () => {
    if (!project) return;
    setLoading(true);
    setLoadError("");
    try {
      const response = await fetch(`/api/orgs/${project.org_id}/members`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not load organization members");
      if (!Array.isArray(data.members)) throw new Error("Members API returned an unexpected response");
      setMembers(data.members);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Could not load organization members");
    } finally {
      setLoading(false);
    }
  }, [project?.org_id]);

  useEffect(() => { void loadMembers(); }, [loadMembers]);

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!project) return;
    setInviting(true);
    setInviteMsg("");
    try {
      const r = await fetch(`/api/orgs/${project.org_id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Failed to add team member");
      setInviteMsg(d.status === "added" ? "Member added to the organization." : "Invite sent!");
      setInviteEmail("");
      await loadMembers();
    } catch (e) {
      setInviteMsg(e instanceof Error ? e.message : "Failed to add team member");
    } finally {
      setInviting(false);
    }
  }

  async function updateMemberRole(member: Member, role: string) {
    if (!project || role === member.role) return;
    setSavingMember(member.user_id);
    setMemberActionError("");
    try {
      const response = await fetch(`/api/orgs/${project.org_id}/members`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: member.user_id, role }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not update member role");
      await loadMembers();
    } catch (e) {
      setMemberActionError(e instanceof Error ? e.message : "Could not update member role");
    } finally {
      setSavingMember("");
    }
  }

  async function removeMember(member: Member) {
    if (!project || !window.confirm(`Remove ${member.name || member.email || "this member"} from the organization?`)) return;
    setSavingMember(member.user_id);
    setMemberActionError("");
    try {
      const response = await fetch(`/api/orgs/${project.org_id}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: member.user_id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not remove member");
      await loadMembers();
    } catch (e) {
      setMemberActionError(e instanceof Error ? e.message : "Could not remove member");
    } finally {
      setSavingMember("");
    }
  }

  if (projLoading) return <main style={{ padding: "32px 40px" }}><div style={{ color: "#a1a1aa" }}>Loading…</div></main>;
  if (projectError || !project) return <main style={{ padding: "32px 40px", color: "#f87171" }}>{projectError ?? "No project available."}</main>;

  return (
    <main style={{ padding: "32px 40px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: "0 0 6px", fontSize: 36, letterSpacing: "-.02em", fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500 }}>Team and members</h1>
        <p style={{ margin: 0, color: "#a1a1aa", fontSize: 15 }}>Who has access to this project.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))", gap: 20 }}>
        <section style={{ border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <h2 style={{ margin: "0 0 6px", fontSize: 17 }}>Members ({members.length})</h2>
            <button type="button" onClick={() => void loadMembers()} disabled={loading}
              style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #33333a", background: "transparent", color: "#f4f4f5", fontSize: 12, cursor: loading ? "wait" : "pointer", fontFamily: "inherit" }}>
              {loading ? "Refreshing…" : "Refresh"}
            </button>
          </div>
          {memberActionError && <p role="alert" style={{ color: "#f87171", fontSize: 13 }}>{memberActionError}</p>}
          <div style={{ display: "grid", gridTemplateColumns: "minmax(140px,1fr) 120px minmax(190px,auto)", gap: 8, padding: "10px 0", borderBottom: "1px solid #26262a", fontFamily: "'Geist Mono',monospace", fontSize: 11, color: "#71717a" }}>
            <span>MEMBER</span><span>ROLE</span><span>ACCESS</span>
          </div>
          {loading ? <p style={{ color: "#a1a1aa", fontSize: 13 }}>Loading members…</p>
            : loadError ? <p role="alert" style={{ color: "#f87171", fontSize: 13 }}>{loadError}</p>
            : members.length === 0 ? <p style={{ color: "#a1a1aa", fontSize: 13 }}>No members found.</p>
            : members.map(m => (
            <div key={m.user_id} style={{ display: "grid", gridTemplateColumns: "minmax(140px,1fr) 120px minmax(190px,auto)", gap: 8, alignItems: "center", padding: "12px 0", borderTop: "1px solid #26262a", fontSize: 13 }}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name || m.email || m.user_id}</span>
              <span style={{ fontWeight: 500, textTransform: "capitalize" }}>{m.role.replace("_", " ")}</span>
              {m.role === "owner" || m.is_current_user ? <span style={{ color: "#71717a", fontSize: 12 }}>{m.is_current_user ? "You" : "Protected owner"}</span>
                : <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <select aria-label={`Role for ${m.name || m.email || m.user_id}`} value={m.role}
                    disabled={savingMember === m.user_id} onChange={event => void updateMemberRole(m, event.target.value)}
                    style={{ minWidth: 110, padding: 6, border: "1px solid #33333a", borderRadius: 6, background: "#0e0e0f", color: "#f4f4f5", font: "inherit" }}>
                    <option value="admin">Admin</option><option value="developer">Developer</option><option value="read_only">Read only</option>
                  </select>
                  <button type="button" disabled={savingMember === m.user_id} onClick={() => void removeMember(m)}
                    style={{ padding: "6px 8px", border: "1px solid #5b2222", borderRadius: 6, background: "transparent", color: "#fca5a5", fontSize: 12, cursor: "pointer" }}>
                    {savingMember === m.user_id ? "Saving…" : "Remove"}
                  </button>
                </div>}
            </div>
          ))}
        </section>

        <section style={{ border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 20 }}>
          <h2 style={{ margin: "0 0 6px", fontSize: 17 }}>Invite someone</h2>
          <form onSubmit={sendInvite} style={{ marginTop: 14 }}>
            <label style={{ display: "block", fontSize: 13, color: "#a1a1aa", marginBottom: 6 }}>Email</label>
            <input type="email" required placeholder="teammate@example.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
              style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8, border: "1px solid #33333a", background: "#0e0e0f", color: "#f4f4f5", fontSize: 14, fontFamily: "inherit", marginBottom: 12 }} />
            <label style={{ display: "block", fontSize: 13, color: "#a1a1aa", marginBottom: 6 }}>Role</label>
            <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #33333a", background: "#0e0e0f", color: "#f4f4f5", fontSize: 14, fontFamily: "inherit", marginBottom: 16 }}>
              <option value="admin">Admin</option>
              <option value="developer">Developer</option>
              <option value="read_only">Read only</option>
            </select>
            <button type="submit" disabled={inviting}
              style={{ padding: "8px 14px", borderRadius: 8, border: 0, background: "#f4f4f5", color: "#0b0b0c", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
              {inviting ? "Sending…" : "Send invite"}
            </button>
            {inviteMsg && <p role="status" style={{ margin: "10px 0 0", fontSize: 13, color: inviteMsg.includes("sent") || inviteMsg.includes("added") ? "#75ea5e" : "#f87171" }}>{inviteMsg}</p>}
          </form>
        </section>
      </div>

      <div style={{ height: 20 }} />
      <section style={{ border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 20 }}>
        <h2 style={{ margin: "0 0 6px", fontSize: 17 }}>Roles</h2>
        <p style={{ margin: "8px 0 0", color: "#71717a", fontSize: 12 }}>Owners and admins can change member roles or remove members. The owner role is protected; only the owner can manage administrator access.</p>
        {[
          { role: "Owner", desc: "Full control, including billing and deleting the project." },
          { role: "Admin", desc: "Manage everything except billing and deletion." },
          { role: "Developer", desc: "Work with data, auth, storage and keys." },
          { role: "Read-only", desc: "View the dashboard without changing anything." },
        ].map(({ role, desc }) => (
          <div key={role} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 0", borderTop: "1px solid #26262a" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{role}</div>
              <div style={{ fontSize: 13, color: "#a1a1aa" }}>{desc}</div>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
