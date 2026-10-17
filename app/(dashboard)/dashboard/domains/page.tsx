"use client";

import { useCallback, useEffect, useState } from "react";
import { useProject } from "@/lib/hooks/use-project";
import { EmbeddedCheckoutPanel } from "@/components/billing/EmbeddedCheckoutPanel";

type Quote = {
  domain: string;
  available: boolean;
  purchaseAmountCents: number | null;
  renewalAmountCents: number | null;
  currency: string;
  markupPercent: number;
};
type DnsRecord = { type: string; name: string; value: string };
type Domain = { id: string; domain: string; kind: string; status: string; created_at: string; dnsConfigured?: boolean; dnsRecords?: DnsRecord[] };
type Order = {
  id: string;
  domain: string;
  status: string;
  purchase_amount_cents: number;
  renewal_amount_cents: number;
  error_message: string | null;
  created_at: string;
};

const panel = { border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 20 } as const;
const input = { width: "100%", boxSizing: "border-box" as const, padding: "10px 12px", borderRadius: 8, border: "1px solid #33333a", background: "#0e0e0f", color: "#f4f4f5", fontSize: 14, fontFamily: "inherit" };
const primaryButton = { padding: "9px 14px", borderRadius: 8, border: 0, background: "#f4f4f5", color: "#0b0b0c", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" };

function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export default function DomainsPage() {
  const { project, loading: projectLoading, error: projectError } = useProject();
  const [query, setQuery] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [searching, setSearching] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [checkoutSecret, setCheckoutSecret] = useState<string | null>(null);
  const [connectDomain, setConnectDomain] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [retryableRenewals, setRetryableRenewals] = useState<string[]>([]);
  const [retryingOrder, setRetryingOrder] = useState<string | null>(null);
  const [loadingDomains, setLoadingDomains] = useState(true);
  const [message, setMessage] = useState("");
  const [messageError, setMessageError] = useState(false);
  const [domainsError, setDomainsError] = useState("");
  const [contact, setContact] = useState({
    firstName: "", lastName: "", email: "", phone: "", address1: "", address2: "",
    city: "", state: "", zip: "", country: "", companyName: "",
  });

  const loadDomains = useCallback(async () => {
    if (!project) return;
    setLoadingDomains(true);
    setDomainsError("");
    try {
      const response = await fetch(`/api/projects/${project.id}/domains`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not load domains");
      setDomains(data.domains ?? []);
      setOrders(data.orders ?? []);
      setRetryableRenewals(data.retryableRenewals ?? []);
    } catch (error) {
      setDomainsError(error instanceof Error ? error.message : "Could not load domains");
    } finally {
      setLoadingDomains(false);
    }
  }, [project]);

  useEffect(() => { void loadDomains(); }, [loadDomains]);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (!project || !query.trim()) return;
    setSearching(true);
    setMessage("");
    setMessageError(false);
    setQuote(null);
    try {
      const response = await fetch(`/api/projects/${project.id}/domains/search?q=${encodeURIComponent(query.trim())}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Domain search failed");
      setQuote(data as Quote);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Domain search failed");
      setMessageError(true);
    } finally {
      setSearching(false);
    }
  }

  async function purchase(e: React.FormEvent) {
    e.preventDefault();
    if (!project || !quote?.available || quote.purchaseAmountCents === null || quote.renewalAmountCents === null) return;
    setPurchasing(true);
    setMessage("");
    setMessageError(false);
    try {
      const response = await fetch(`/api/projects/${project.id}/domains/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: quote.domain, contact }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not start checkout");
      if (typeof data.clientSecret !== "string" || !data.clientSecret) throw new Error("Secure checkout could not be started");
      setCheckoutSecret(data.clientSecret);
      setPurchasing(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not start checkout");
      setMessageError(true);
      setPurchasing(false);
    }
  }

  async function connect(e: React.FormEvent) {
    e.preventDefault();
    if (!project || !connectDomain.trim()) return;
    setConnecting(true);
    setMessage("");
    setMessageError(false);
    try {
      const response = await fetch(`/api/projects/${project.id}/domains/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: connectDomain.trim().toLowerCase() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not connect the domain");
      setConnectDomain("");
      setMessage(data.next ?? "Domain connected");
      await loadDomains();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not connect the domain");
      setMessageError(true);
    } finally {
      setConnecting(false);
    }
  }

  async function retryRenewal(orderId: string) {
    if (!project) return;
    setRetryingOrder(orderId);
    setMessage("");
    setMessageError(false);
    try {
      const response = await fetch(`/api/projects/${project.id}/domains/orders/${orderId}/renewal`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not retry the domain renewal");
      setMessage("Domain renewal completed.");
      await loadDomains();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not retry the domain renewal");
      setMessageError(true);
    } finally {
      setRetryingOrder(null);
    }
  }

  async function copyDnsValue(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setMessage("DNS value copied.");
      setMessageError(false);
    } catch {
      setMessage("Clipboard access was denied. Copy the DNS value manually.");
      setMessageError(true);
    }
  }

  if (projectLoading) return <main style={{ padding: "32px 40px", color: "#a1a1aa" }}>Loading project…</main>;
  if (projectError || !project) return <main style={{ padding: "32px 40px", color: "#f87171" }}>{projectError ?? "No project available."}</main>;

  return (
    <main style={{ padding: "32px 40px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: "0 0 6px", fontSize: 36, letterSpacing: "-.02em", fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500 }}>Domains</h1>
        <p style={{ margin: 0, color: "#a1a1aa", fontSize: 15 }}>Register a new domain with transparent pricing, or connect a domain you own.</p>
      </div>

      <section style={{ ...panel, marginBottom: 20 }}>
        <h2 style={{ margin: "0 0 6px", fontSize: 17 }}>Find a domain</h2>
        <form onSubmit={search} style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <label htmlFor="domain-search" style={{ position: "absolute", left: -9999 }}>Domain name</label>
          <input id="domain-search" required placeholder="yourapp.com" value={query} onChange={e => setQuery(e.target.value)} style={{ ...input, flex: 1 }} />
          <button type="submit" disabled={searching} style={primaryButton}>{searching ? "Searching…" : "Search"}</button>
        </form>
        {quote && (
          <div style={{ marginTop: 16, padding: 14, borderRadius: 8, background: "#0e0e0f", border: "1px solid #26262a" }}>
            {quote.available && quote.purchaseAmountCents !== null && quote.renewalAmountCents !== null ? (
              <>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>{quote.domain} is available</div>
                <div style={{ color: "#a1a1aa", fontSize: 14 }}>
                  First year: <strong style={{ color: "#f4f4f5" }}>{money(quote.purchaseAmountCents)}</strong>
                  {" · "}annual renewal: <strong style={{ color: "#f4f4f5" }}>{money(quote.renewalAmountCents)}</strong>
                </div>
                <p style={{ margin: "8px 0 0", color: "#a1a1aa", fontSize: 12 }}>Includes a 20% Masidy service fee. Annual renewals are charged through your Masidy billing account.</p>
                <form onSubmit={purchase} style={{ marginTop: 14 }}>
                  <h3 style={{ margin: "0 0 12px", fontSize: 15 }}>Registrant contact details</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 10 }}>
                    {([
                      ["firstName", "First name"], ["lastName", "Last name"], ["email", "Email"], ["phone", "Phone"],
                      ["address1", "Address"], ["address2", "Address line 2"], ["city", "City"], ["state", "State / region"],
                      ["zip", "Postal code"], ["country", "Country code (2 letters)"], ["companyName", "Company (optional)"],
                    ] as const).map(([key, label]) => (
                      <label key={key} style={{ display: "grid", gap: 5, color: "#a1a1aa", fontSize: 12 }}>
                        {label}
                        <input
                          required={!["address2", "companyName"].includes(key)}
                          type={key === "email" ? "email" : "text"}
                          autoComplete={key === "country" ? "country" : key}
                          value={contact[key]}
                          onChange={e => setContact(current => ({ ...current, [key]: e.target.value }))}
                          style={input}
                        />
                      </label>
                    ))}
                  </div>
                  <button type="submit" disabled={purchasing} style={{ ...primaryButton, marginTop: 14 }}>
                    {purchasing ? "Preparing secure checkout…" : `Continue to checkout · ${money(quote.purchaseAmountCents)}`}
                  </button>
                </form>
              </>
            ) : quote.available ? (
              <span style={{ color: "#f87171" }}>Pricing is unavailable for this domain, so checkout cannot continue.</span>
            ) : <span style={{ color: "#f87171" }}>{quote.domain} is not available.</span>}
          </div>
        )}
      </section>

      {checkoutSecret && (
        <div style={{ marginBottom: 20 }}>
          <EmbeddedCheckoutPanel
            clientSecret={checkoutSecret}
            title="Complete domain registration"
            onClose={() => { setCheckoutSecret(null); setPurchasing(false); }}
            onComplete={() => {
              setCheckoutSecret(null);
              setPurchasing(false);
              setMessage("Payment complete. Domain registration is processing.");
              setMessageError(false);
              window.setTimeout(() => void loadDomains(), 2000);
            }}
          />
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 20 }}>
        <section style={panel}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <h2 style={{ margin: "0 0 6px", fontSize: 17 }}>Connected domains</h2>
            <button type="button" onClick={() => void loadDomains()} disabled={loadingDomains} style={{ ...primaryButton, padding: "6px 10px", fontSize: 12 }}>
              {loadingDomains ? "Refreshing…" : "Refresh"}
            </button>
          </div>
          {loadingDomains ? <p style={{ color: "#a1a1aa", fontSize: 14 }}>Loading…</p>
            : domainsError ? <p role="alert" style={{ color: "#f87171", fontSize: 14 }}>{domainsError}</p>
            : domains.length === 0 ? <p style={{ color: "#a1a1aa", fontSize: 14 }}>No domains connected yet.</p>
              : domains.map(domain => (
                <div key={domain.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "12px 0", borderTop: "1px solid #26262a", fontSize: 14 }}>
                  <span style={{ flex: 1 }}>{domain.domain}<small style={{ display: "block", marginTop: 4, color: "#71717a" }}>{domain.kind}</small>
                    {domain.status !== "active" && domain.dnsRecords?.map((record, index) => (
                      <div key={`${record.type}-${record.name}-${index}`} style={{ marginTop: 10, padding: 10, borderRadius: 8, background: "#0e0e0f", color: "#a1a1aa", fontSize: 12 }}>
                        Add this DNS record at your domain provider:
                        <div style={{ display: "grid", gridTemplateColumns: "55px 1fr auto", gap: 8, alignItems: "center", marginTop: 6 }}>
                          <strong>{record.type}</strong><code style={{ overflowWrap: "anywhere" }}>{record.name} → {record.value}</code>
                          <button type="button" onClick={() => void copyDnsValue(record.value)} style={{ ...primaryButton, padding: "5px 8px", fontSize: 11 }}>Copy value</button>
                        </div>
                      </div>
                    ))}
                  </span>
                  <span style={{ color: domain.status === "active" ? "#75ea5e" : "#a1a1aa" }}>{domain.dnsConfigured ? "DNS detected" : domain.status}</span>
                </div>
              ))}
        </section>

        <section style={panel}>
          <h2 style={{ margin: "0 0 6px", fontSize: 17 }}>Connect a domain you own</h2>
          <form onSubmit={connect} style={{ marginTop: 14 }}>
            <label htmlFor="connect-domain" style={{ display: "block", fontSize: 13, color: "#a1a1aa", marginBottom: 6 }}>Domain</label>
            <input id="connect-domain" required placeholder="yourapp.com" value={connectDomain} onChange={e => setConnectDomain(e.target.value)} style={{ ...input, marginBottom: 12 }} />
            <button type="submit" disabled={connecting || loadingDomains || Boolean(domainsError)} style={primaryButton}>{connecting ? "Connecting…" : "Connect domain"}</button>
          </form>
          <p style={{ margin: "12px 0 0", color: "#a1a1aa", fontSize: 13, lineHeight: 1.6 }}>Masidy will connect the domain and show the DNS record to apply. For domains managed elsewhere, you must add that record in your domain settings; Masidy cannot change those settings without access.</p>
        </section>
      </div>

      {orders.length > 0 && (
        <section style={{ ...panel, marginTop: 20 }}>
          <h2 style={{ margin: "0 0 6px", fontSize: 17 }}>Domain orders and renewals</h2>
          {orders.map(order => (
            <div key={order.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "12px 0", borderTop: "1px solid #26262a", fontSize: 14 }}>
              <span>{order.domain}<small style={{ display: "block", marginTop: 4, color: "#71717a" }}>Renewal {money(order.renewal_amount_cents)}/year</small></span>
              <span style={{ textAlign: "right", color: order.status.includes("failed") ? "#f87171" : "#a1a1aa" }}>
                {order.status.replaceAll("_", " ")}
                {order.error_message && <small style={{ display: "block", maxWidth: 220, marginTop: 4, color: "#f87171" }}>{order.error_message}</small>}
                {retryableRenewals.includes(order.id) && (
                  <button onClick={() => void retryRenewal(order.id)} disabled={retryingOrder !== null}
                    style={{ ...primaryButton, marginTop: 8, padding: "6px 10px", fontSize: 12 }}>
                    {retryingOrder === order.id ? "Retrying…" : "Retry paid renewal"}
                  </button>
                )}
              </span>
            </div>
          ))}
        </section>
      )}
      {message && <p role={messageError ? "alert" : "status"} style={{ marginTop: 14, color: messageError ? "#f87171" : "#a1a1aa", fontSize: 14 }}>{message}</p>}
    </main>
  );
}
