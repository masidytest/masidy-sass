"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

const ACCENT = "#75ea5e";

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
  );
}

export default function AccountPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    setRecoveryMode(new URLSearchParams(location.search).get("recovery") === "1");
    getSupabase().auth.getUser().then(({ data, error }) => {
      if (error) throw error;
      if (data.user) {
        setEmail(data.user.email ?? "");
        setDisplayName(
          (data.user.user_metadata?.full_name as string) ??
          (data.user.user_metadata?.name as string) ??
          (data.user.email?.split("@")[0] ?? "")
        );
      }
      setLoading(false);
    }).catch(e => {
      setError(e instanceof Error ? e.message : "Could not load account profile");
      setLoading(false);
    });
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setStatus("");
    try {
      const { error } = await getSupabase().auth.updateUser({ data: { full_name: displayName.trim() } });
      if (error) throw error;
      setSaved(true);
      setStatus("Profile saved.");
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save profile");
    } finally {
      setSaving(false);
    }
  }

  async function signOutAll() {
    setSigningOut(true);
    setError("");
    try {
      const { error } = await getSupabase().auth.signOut({ scope: "global" });
      if (error) throw error;
      router.push("/sign-in");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not sign out");
      setSigningOut(false);
    }
  }

  async function resetPassword() {
    setResetting(true);
    setError("");
    setStatus("");
    try {
      const { error } = await getSupabase().auth.resetPasswordForEmail(email, {
        redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent("/dashboard/account?recovery=1")}`,
      });
      if (error) throw error;
      setStatus("Password reset email sent.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send password reset email");
    } finally {
      setResetting(false);
    }
  }

  async function updatePassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setStatus("");
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setUpdatingPassword(true);
    try {
      const { error } = await getSupabase().auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNewPassword("");
      setConfirmPassword("");
      setRecoveryMode(false);
      setStatus("Password updated.");
      router.replace("/dashboard/account");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update password");
    } finally {
      setUpdatingPassword(false);
    }
  }

  if (loading) return <main style={{ padding: "32px 40px" }}><div style={{ color: "#a1a1aa" }}>Loading…</div></main>;

  return (
    <main style={{ padding: "32px 40px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: "0 0 6px", fontSize: 36, letterSpacing: "-.02em", fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500 }}>Account settings</h1>
        <p style={{ margin: 0, color: "#a1a1aa", fontSize: 15 }}>Your profile, security and preferences.</p>
      </div>
      {error && <p role="alert" style={{ color: "#f87171", fontSize: 14 }}>{error}</p>}
      {status && <p role="status" style={{ color: "#75ea5e", fontSize: 14 }}>{status}</p>}

      <section style={{ border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 20, marginBottom: 20 }}>
        <h2 style={{ margin: "0 0 6px", fontSize: 17 }}>Profile</h2>
        <form onSubmit={saveProfile} style={{ marginTop: 14, maxWidth: 420 }}>
          <label style={{ display: "block", fontSize: 13, color: "#a1a1aa", marginBottom: 6 }}>Display name</label>
          <input type="text" maxLength={100} value={displayName} onChange={e => setDisplayName(e.target.value)}
            style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8, border: "1px solid #33333a", background: "#0e0e0f", color: "#f4f4f5", fontSize: 14, fontFamily: "inherit", marginBottom: 16 }} />
          <label style={{ display: "block", fontSize: 13, color: "#a1a1aa", marginBottom: 6 }}>Email</label>
          <input type="email" value={email} readOnly
            style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8, border: "1px solid #26262a", background: "#0e0e0f", color: "#71717a", fontSize: 14, fontFamily: "inherit", marginBottom: 16 }} />
          <button type="submit" disabled={saving}
            style={{ padding: "8px 14px", borderRadius: 8, border: 0, background: "#f4f4f5", color: "#0b0b0c", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
            {saved ? "Saved!" : saving ? "Saving…" : "Save profile"}
          </button>
        </form>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))", gap: 20, marginBottom: 20 }}>
        <section style={{ border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 20 }}>
          <h2 style={{ margin: "0 0 6px", fontSize: 17 }}>Security</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 0", borderTop: "1px solid #26262a" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Password</div>
              <div style={{ fontSize: 13, color: "#a1a1aa" }}>Update the password you sign in with.</div>
            </div>
            <button onClick={() => void resetPassword()} disabled={resetting} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #33333a", background: "transparent", color: "#f4f4f5", fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
              {resetting ? "Sending…" : "Reset"}
            </button>
          </div>
          {recoveryMode && (
            <form onSubmit={updatePassword} style={{ maxWidth: 420, paddingTop: 14, borderTop: "1px solid #26262a" }}>
              <label htmlFor="new-password" style={{ display: "block", fontSize: 13, color: "#a1a1aa", marginBottom: 6 }}>New password</label>
              <input id="new-password" type="password" autoComplete="new-password" minLength={8} required value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8, border: "1px solid #33333a", background: "#0e0e0f", color: "#f4f4f5", fontSize: 14, fontFamily: "inherit", marginBottom: 12 }} />
              <label htmlFor="confirm-password" style={{ display: "block", fontSize: 13, color: "#a1a1aa", marginBottom: 6 }}>Confirm password</label>
              <input id="confirm-password" type="password" autoComplete="new-password" minLength={8} required value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8, border: "1px solid #33333a", background: "#0e0e0f", color: "#f4f4f5", fontSize: 14, fontFamily: "inherit", marginBottom: 12 }} />
              <button type="submit" disabled={updatingPassword}
                style={{ padding: "8px 14px", borderRadius: 8, border: 0, background: "#f4f4f5", color: "#0b0b0c", fontWeight: 600, fontSize: 14, cursor: updatingPassword ? "wait" : "pointer", fontFamily: "inherit" }}>
                {updatingPassword ? "Updating…" : "Update password"}
              </button>
            </form>
          )}
        </section>

        <section style={{ border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 20 }}>
          <h2 style={{ margin: "0 0 6px", fontSize: 17 }}>Preferences</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 0", borderTop: "1px solid #26262a" }}>
            <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 600 }}>Sidebar mode</div></div>
            <div style={{ display: "flex", gap: 6 }}>
              {["expanded", "collapsed", "hover"].map(m => {
                const saved = typeof window !== "undefined" && localStorage.getItem("masidy_sidebar_mode") === m;
                return (
                  <button key={m} onClick={() => { localStorage.setItem("masidy_sidebar_mode", m); location.reload(); }}
                    style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${saved ? ACCENT : "#33333a"}`, background: "transparent", color: saved ? ACCENT : "#a1a1aa", fontSize: 12, cursor: "pointer", fontFamily: "inherit", textTransform: "capitalize" }}>
                    {m}
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      <section style={{ border: "1px solid #3f1d1d", borderRadius: 12, background: "#151517", padding: 20 }}>
        <h2 style={{ margin: "0 0 6px", fontSize: 17 }}>Sessions</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 0", borderTop: "1px solid #26262a" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Sign out everywhere</div>
            <div style={{ fontSize: 13, color: "#a1a1aa" }}>Ends every session including this one.</div>
          </div>
          <button onClick={signOutAll} disabled={signingOut}
            style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #33333a", background: "transparent", color: "#f87171", fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
            {signingOut ? "Signing out…" : "Sign out all"}
          </button>
        </div>
      </section>
    </main>
  );
}
