"use client";

import Link from "next/link";
import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import type { Metadata } from "next";

const ACCENT = "#75ea5e";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicSent, setMagicSent] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    router.push("/dashboard");
  }

  async function handleOAuth(provider: "github" | "google") {
    await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: `${location.origin}/dashboard` } });
  }

  async function handleMagicLink() {
    if (!email) { setError("Enter your email first."); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${location.origin}/dashboard` } });
    if (error) { setError(error.message); } else { setMagicSent(true); }
    setLoading(false);
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 8,
    border: "1px solid #33333a", background: "#0e0e0f", color: "#f4f4f5", fontSize: 15,
    margin: "6px 0 16px", fontFamily: "inherit",
  };
  const socialStyle: React.CSSProperties = {
    display: "block", textAlign: "center", marginBottom: 10, padding: "13px 22px",
    borderRadius: 8, border: "1px solid #33333a", textDecoration: "none", color: "#f4f4f5", cursor: "pointer",
    background: "transparent", width: "100%", fontFamily: "inherit", fontSize: "inherit",
  };

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(#2c2c30 1px,transparent 1.3px) 0 0/18px 18px,#0e0e0f", color: "#f4f4f5", fontFamily: "'Geist',system-ui,sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: 32, boxSizing: "border-box" }}>
      <div style={{ width: "100%", maxWidth: 400, padding: 36, borderRadius: 14, border: "1px solid #26262a", background: "#151517", boxSizing: "border-box" }}>
        <Link href="/" style={{ display: "block", fontWeight: 600, fontSize: 19, marginBottom: 24, textDecoration: "none", color: "#f4f4f5" }}>masidy</Link>
        <h1 style={{ margin: "0 0 6px", fontSize: 34, letterSpacing: "-.02em", fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500 }}>Sign in to Masidy</h1>
        <p style={{ margin: "0 0 24px", color: "#a1a1aa" }}>Welcome back.</p>

        {magicSent ? (
          <p style={{ color: ACCENT, textAlign: "center" }}>Magic link sent — check your email.</p>
        ) : (
          <>
            <button onClick={() => handleOAuth("github")} style={socialStyle}>Continue with GitHub</button>
            <button onClick={() => handleOAuth("google")} style={{ ...socialStyle, marginBottom: 20 }}>Continue with Google</button>
            <div style={{ fontFamily: "'Geist Mono',monospace", fontSize: 12, color: "#a1a1aa", textAlign: "center", marginBottom: 20 }}>OR</div>

            <form onSubmit={handleSignIn}>
              <label htmlFor="e" style={{ fontSize: 14, color: "#a1a1aa" }}>Email</label>
              <input id="e" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} required />
              <label htmlFor="p" style={{ fontSize: 14, color: "#a1a1aa" }}>Password</label>
              <input id="p" type="password" value={password} onChange={e => setPassword(e.target.value)} style={{ ...inputStyle, marginBottom: 8 }} required />
              <Link href="#" style={{ display: "block", fontSize: 14, color: "#a1a1aa", marginBottom: 20, textDecoration: "none" }}>Forgot password?</Link>
              {error && <p style={{ color: "#f87171", fontSize: 14, margin: "0 0 12px" }}>{error}</p>}
              <button type="submit" disabled={loading} style={{ width: "100%", padding: 13, borderRadius: 8, border: 0, background: "#f4f4f5", color: "#0b0b0c", fontFamily: "inherit", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer" }}>
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </form>

            <button onClick={handleMagicLink} style={{ display: "block", textAlign: "center", marginTop: 14, fontSize: 14, color: ACCENT, background: "transparent", border: 0, cursor: "pointer", fontFamily: "inherit", width: "100%" }}>
              Email me a magic link instead
            </button>
          </>
        )}

        <p style={{ margin: "24px 0 0", textAlign: "center", fontSize: 14, color: "#a1a1aa" }}>
          New here? <Link href="/sign-in" style={{ color: "#f4f4f5", fontWeight: 600, textDecoration: "none" }}>Start free</Link>
        </p>
      </div>
    </div>
  );
}
