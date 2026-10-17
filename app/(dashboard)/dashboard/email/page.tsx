"use client";

import { useCallback, useEffect, useState } from "react";
import { useProject } from "@/lib/hooks/use-project";

type DnsRecord = {
  record: string;
  name: string;
  value: string;
  type: string;
  ttl: string;
  status: string;
  priority?: number;
};
type EmailDomain = { domain: string; status: string; records: DnsRecord[] } | null;

const panel = { border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 20 } as const;
const input = { width: "100%", boxSizing: "border-box" as const, padding: "10px 12px", borderRadius: 8, border: "1px solid #33333a", background: "#0e0e0f", color: "#f4f4f5", fontSize: 14, fontFamily: "inherit" };
const button = { padding: "8px 14px", borderRadius: 8, border: 0, background: "#f4f4f5", color: "#0b0b0c", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" };

export default function EmailPage() {
  const { project, loading: projectLoading, error: projectError } = useProject();
  const [domainInput, setDomainInput] = useState("");
  const [domain, setDomain] = useState<EmailDomain>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [message, setMessage] = useState("");
  const [messageError, setMessageError] = useState(false);
  const [loadError, setLoadError] = useState("");

  const loadDomain = useCallback(async () => {
    if (!project) return;
    setLoading(true);
    setLoadError("");
    try {
      const response = await fetch(`/api/projects/${project.id}/email/domain`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not load email domain");
      setDomain(data.domain ? data as EmailDomain : null);
      if (data.domain) setDomainInput(data.domain);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Could not load email domain");
    } finally {
      setLoading(false);
    }
  }, [project]);

  useEffect(() => { void loadDomain(); }, [loadDomain]);

  async function addDomain(e: React.FormEvent) {
    e.preventDefault();
    if (!project || !domainInput.trim()) return;
    setSaving(true);
    setMessage("");
    setMessageError(false);
    try {
      const response = await fetch(`/api/projects/${project.id}/email/domain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: domainInput.trim().toLowerCase() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not add the email domain");
      setDomain(data as EmailDomain);
      setDomainInput(data.domain);
      setMessage("Domain added. Publish the DNS records below, then verify it.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not add the email domain");
      setMessageError(true);
    } finally {
      setSaving(false);
    }
  }

  async function verifyDomain() {
    if (!project) return;
    setVerifying(true);
    setMessage("");
    setMessageError(false);
    try {
      const response = await fetch(`/api/projects/${project.id}/email/domain`, { method: "PATCH" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not verify the domain");
      setDomain(data as EmailDomain);
      setMessage(data.status === "verified" ? "Sending domain verified." : `Resend reports status: ${data.status}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not verify the domain");
      setMessageError(true);
    } finally {
      setVerifying(false);
    }
  }

  if (projectLoading) return <main style={{ padding: "32px 40px", color: "#a1a1aa" }}>Loading project…</main>;
  if (projectError || !project) return <main style={{ padding: "32px 40px", color: "#f87171" }}>{projectError ?? "No project available."}</main>;

  return (
    <main style={{ padding: "32px 40px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: "0 0 6px", fontSize: 36, letterSpacing: "-.02em", fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500 }}>Email</h1>
        <p style={{ margin: 0, color: "#a1a1aa", fontSize: 15 }}>Set up a sending domain with Resend and verify its DNS records.</p>
      </div>

      <section style={panel}>
        <h2 style={{ margin: "0 0 6px", fontSize: 17 }}>Sending domain</h2>
        {loading ? <p style={{ color: "#a1a1aa", fontSize: 14 }}>Loading…</p> : loadError ? (
          <div role="alert" style={{ color: "#f87171", fontSize: 14 }}>
            <p>{loadError}</p>
            <button type="button" onClick={() => void loadDomain()} style={button}>Retry</button>
          </div>
        ) : (
          <>
            {!domain && (
              <form onSubmit={addDomain} style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
                <label htmlFor="email-domain" style={{ position: "absolute", left: -9999 }}>Domain name</label>
                <input id="email-domain" type="text" required placeholder="yourdomain.com" value={domainInput}
                  onChange={e => setDomainInput(e.target.value)} style={{ ...input, flex: "1 1 260px" }} />
                <button type="submit" disabled={saving} style={button}>{saving ? "Adding…" : "Add domain"}</button>
              </form>
            )}
            {domain && (
              <>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 14, padding: "12px 0", borderTop: "1px solid #26262a" }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>{domain.domain}</div>
                    <div style={{ marginTop: 4, fontSize: 13, color: domain.status === "verified" ? "#75ea5e" : "#a1a1aa" }}>
                      Resend status: {domain.status.replaceAll("_", " ")}
                    </div>
                  </div>
                  <button onClick={() => void verifyDomain()} disabled={verifying} style={button}>
                    {verifying ? "Checking…" : "Verify DNS"}
                  </button>
                </div>
                <h3 style={{ margin: "16px 0 8px", fontSize: 14 }}>Required DNS records</h3>
                {domain.records.length === 0 ? <p style={{ color: "#a1a1aa", fontSize: 13 }}>Resend has not returned DNS records for this domain.</p>
                  : domain.records.map((record, index) => (
                    <div key={`${record.type}-${record.name}-${index}`} style={{ padding: "12px 0", borderTop: "1px solid #26262a", fontSize: 13 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
                        <strong>{record.record} · {record.type}</strong>
                        <span style={{ color: record.status === "verified" ? "#75ea5e" : "#a1a1aa" }}>{record.status}</span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "72px 1fr", gap: "4px 8px", color: "#a1a1aa", overflowWrap: "anywhere" }}>
                        <span>Name</span><code>{record.name}</code>
                        <span>Value</span><code>{record.value}</code>
                        <span>TTL</span><span>{record.ttl}</span>
                        {record.priority !== undefined && <><span>Priority</span><span>{record.priority}</span></>}
                      </div>
                    </div>
                  ))}
                {domain.status === "verified" && <p style={{ color: "#75ea5e", fontSize: 13 }}>This domain is verified and ready to use with Resend.</p>}
              </>
            )}
          </>
        )}
      </section>
      {message && <p role={messageError ? "alert" : "status"} style={{ marginTop: 14, color: messageError ? "#f87171" : message.includes("verified") || message.includes("Publish") ? "#75ea5e" : "#a1a1aa", fontSize: 14 }}>{message}</p>}
    </main>
  );
}
