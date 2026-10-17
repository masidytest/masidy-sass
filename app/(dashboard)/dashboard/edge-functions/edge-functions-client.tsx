"use client";

import { useCallback, useEffect, useState } from "react";
import { useProject } from "@/lib/hooks/use-project";

type EdgeFunction = { id: string; slug: string; name: string; status: string; version: number; updated_at: number; verify_jwt: boolean };
const panel = { border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 20 } as const;
const button = { padding: "8px 14px", borderRadius: 8, border: "1px solid #33333a", background: "transparent", color: "#f4f4f5", fontSize: 13, cursor: "pointer", fontFamily: "inherit" } as const;

export default function EdgeFunctionsClient() {
  const { project, loading: projectLoading, error: projectError } = useProject();
  const [functions, setFunctions] = useState<EdgeFunction[]>([]);
  const [baseUrl, setBaseUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState(false);
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [source, setSource] = useState('Deno.serve(() => new Response("Hello from Masidy"));\n');
  const [verifyJwt, setVerifyJwt] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadFunctions = useCallback(async () => {
    if (!project) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/projects/${project.id}/functions`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not load Edge Functions");
      if (!Array.isArray(data.functions)) throw new Error("Functions API returned an unexpected response");
      setFunctions(data.functions);
      setBaseUrl(data.baseUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load Edge Functions");
    } finally {
      setLoading(false);
    }
  }, [project]);

  useEffect(() => { void loadFunctions(); }, [loadFunctions]);

  async function copyText(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setMessage("Copied to clipboard.");
    } catch {
      setError("Clipboard access was denied. Copy the command manually.");
    }
  }

  async function deployFunction(event: React.FormEvent) {
    event.preventDefault();
    if (!project) return;
    setDeploying(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/projects/${project.id}/functions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, name, source, verifyJwt }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not deploy Edge Function");
      setMessage(`Function ${data.function?.slug ?? slug} deployed.`);
      await loadFunctions();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not deploy Edge Function");
    } finally {
      setDeploying(false);
    }
  }

  if (projectLoading) return <main style={{ padding: "32px 40px", color: "#a1a1aa" }}>Loading project…</main>;
  if (projectError || !project) return <main style={{ padding: "32px 40px", color: "#f87171" }}>{projectError ?? "No project available."}</main>;

  return (
    <main style={{ padding: "32px 40px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: "0 0 6px", fontSize: 36, letterSpacing: "-.02em", fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500 }}>Edge Functions</h1>
          <p style={{ margin: 0, color: "#a1a1aa", fontSize: 15 }}>Functions currently deployed to {project.name}.</p>
        </div>
        <button onClick={() => void loadFunctions()} disabled={loading} style={button}>{loading ? "Refreshing…" : "Refresh"}</button>
      </div>
      {error && <p role="alert" style={{ color: "#f87171", fontSize: 14 }}>{error}</p>}
      {message && <p role="status" style={{ color: "#75ea5e", fontSize: 14 }}>{message}</p>}

      <section style={panel}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr minmax(180px,2fr) 100px 100px 90px", gap: 8, padding: "10px 0", borderBottom: "1px solid #26262a", fontFamily: "'Geist Mono',monospace", fontSize: 11, color: "#71717a" }}>
          <span>NAME</span><span>URL</span><span>VERSION</span><span>STATUS</span><span>ACTION</span>
        </div>
        {loading ? <p style={{ padding: 36, color: "#a1a1aa", textAlign: "center" }}>Loading functions…</p>
          : error ? <p style={{ padding: 36, color: "#f87171", textAlign: "center" }}>Function data could not be loaded.</p>
          : functions.length === 0 ? <div style={{ padding: "44px 20px", textAlign: "center", color: "#a1a1aa" }}>No Edge Functions are deployed in this project.</div>
          : functions.map(item => (
            <div key={item.id} style={{ display: "grid", gridTemplateColumns: "1fr minmax(180px,2fr) 100px 100px 90px", gap: 8, alignItems: "center", padding: "12px 0", borderBottom: "1px solid #26262a", fontSize: 13 }}>
              <span>{item.name || item.slug}</span>
              <span style={{ color: "#a1a1aa", overflowWrap: "anywhere" }}>{baseUrl}/{item.slug}</span>
              <button onClick={() => void copyText(`${baseUrl}/${encodeURIComponent(item.slug)}`)} style={button}>Copy URL</button>
              <span>{item.version}</span><span style={{ color: item.status === "ACTIVE" ? "#75ea5e" : "#a1a1aa" }}>{item.status}</span>
            </div>
          ))}
      </section>

      <section style={{ ...panel, marginTop: 20 }}>
        <h2 style={{ margin: "0 0 8px", fontSize: 16 }}>Deploy an Edge Function</h2>
        <p style={{ margin: "0 0 12px", color: "#a1a1aa", fontSize: 13, lineHeight: 1.6 }}>
          Deploy a single-file TypeScript function from Masidy. Functions with local imports or bundled dependencies should be bundled before deployment.
        </p>
        <form onSubmit={deployFunction} style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
            <label style={{ display: "grid", gap: 6, color: "#a1a1aa", fontSize: 13 }}>
              Function slug
              <input required pattern="[a-z][a-z0-9-]{0,39}" value={slug} onChange={event => setSlug(event.target.value)}
                placeholder="hello-world" style={{ padding: 9, border: "1px solid #33333a", borderRadius: 8, background: "#0e0e0f", color: "#f4f4f5", font: "inherit" }} />
            </label>
            <label style={{ display: "grid", gap: 6, color: "#a1a1aa", fontSize: 13 }}>
              Display name
              <input required maxLength={80} value={name} onChange={event => setName(event.target.value)}
                placeholder="Hello World" style={{ padding: 9, border: "1px solid #33333a", borderRadius: 8, background: "#0e0e0f", color: "#f4f4f5", font: "inherit" }} />
            </label>
          </div>
          <label htmlFor="function-source" style={{ color: "#a1a1aa", fontSize: 13 }}>Source (index.ts)</label>
          <textarea id="function-source" required maxLength={1_000_000} value={source} onChange={event => setSource(event.target.value)}
            spellCheck={false} rows={12} style={{ width: "100%", boxSizing: "border-box", padding: 12, border: "1px solid #33333a", borderRadius: 8, background: "#0e0e0f", color: "#f4f4f5", fontFamily: "'Geist Mono',monospace", fontSize: 12 }} />
          <label style={{ display: "flex", alignItems: "center", gap: 8, color: "#a1a1aa", fontSize: 13 }}>
            <input type="checkbox" checked={verifyJwt} onChange={event => setVerifyJwt(event.target.checked)} />
            Require a valid project access token
          </label>
          <div>
            <button type="submit" disabled={deploying || !source.trim()} style={button}>
              {deploying ? "Deploying…" : "Deploy function"}
            </button>
          </div>
        </form>
        <p style={{ margin: "16px 0 0", color: "#71717a", fontSize: 12 }}>Function endpoints use your Masidy project domain. Copy an endpoint from the list to invoke it from your application.</p>
      </section>
    </main>
  );
}
