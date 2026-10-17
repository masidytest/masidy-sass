"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { planCatalog, type PaidPlan } from "@/lib/plans";

const ACCENT = "#75ea5e";
const PLANS = Object.entries(planCatalog) as [PaidPlan, (typeof planCatalog)[PaidPlan]][];
type Organization = { id: string; plan: string; stripe_customer_id: string | null; stripe_subscription_id: string | null };

export default function PlansPage() {
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const currentPlan = org?.plan.toLowerCase() ?? "free";

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
    );
    void (async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) {
          setMessage("Sign in to manage your plan.");
          return;
        }
        const { data: membership, error } = await supabase.from("org_members")
          .select("orgs(id, plan, stripe_customer_id, stripe_subscription_id)")
          .eq("user_id", user.id).limit(1).maybeSingle();
        if (error) throw error;
        const organization = membership?.orgs as unknown as Organization | null;
        if (!organization) setMessage("Create an organization before choosing a plan.");
        else setOrg(organization);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Could not load billing information.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function openCheckout(plan: PaidPlan) {
    if (!org) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/orgs/${org.id}/billing/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not start checkout");
      if (!data.url) throw new Error("Checkout URL was not returned");
      window.location.assign(data.url);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not start checkout");
      setBusy(false);
    }
  }

  async function openPortal() {
    if (!org) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/orgs/${org.id}/billing/portal`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not open billing portal");
      if (!data.url) throw new Error("Billing portal URL was not returned");
      window.location.assign(data.url);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not open billing portal");
      setBusy(false);
    }
  }

  if (loading) return <main style={{ padding: "32px 40px" }}><div style={{ color: "#a1a1aa" }}>Loading…</div></main>;

  return (
    <main style={{ padding: "32px 40px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: "0 0 6px", fontSize: 36, letterSpacing: "-.02em", fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500 }}>Plans</h1>
        <p style={{ margin: 0, color: "#a1a1aa", fontSize: 15 }}>Paid plans include a monthly project allowance. Choose a plan to get started.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 14, marginBottom: 24 }}>
        {PLANS.map(([id, plan]) => {
          const { name, amount, projectLimit, description } = plan;
          const isCurrent = currentPlan === id;
          const isRecommended = id === "pro";
          return (
            <section key={id} style={{ border: `1px solid ${isCurrent ? ACCENT : isRecommended ? ACCENT + "44" : "#26262a"}`, borderRadius: 12, background: "#151517", padding: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 11, color: "#a1a1aa", letterSpacing: ".04em" }}>{name.toUpperCase()}</span>
                {isCurrent && <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 10, padding: "2px 8px", borderRadius: 99, background: `${ACCENT}22`, color: ACCENT }}>CURRENT</span>}
              </div>
              <div style={{ fontSize: 36, fontFamily: "'Newsreader',Georgia,serif", fontWeight: 500, marginBottom: 8 }}>
                ${(amount / 100).toFixed(0)}<span style={{ fontSize: 16, color: "#a1a1aa" }}>/mo</span>
              </div>
              <p style={{ margin: "0 0 16px", color: "#a1a1aa", fontSize: 14, lineHeight: 1.6 }}>{description} Up to {projectLimit} {projectLimit === 1 ? "project" : "projects"}.</p>
              {!isCurrent && (
                <button disabled={busy || !org} onClick={() => {
                  if (!org) return;
                  if (org.stripe_subscription_id) void openPortal();
                  else void openCheckout(id);
                }}
                  style={{ width: "100%", padding: "9px 0", borderRadius: 8, border: isRecommended ? 0 : "1px solid #33333a", background: isRecommended ? "#f4f4f5" : "transparent", color: isRecommended ? "#0b0b0c" : "#f4f4f5", fontWeight: 600, fontSize: 14, cursor: busy || !org ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
                  {org?.stripe_subscription_id ? "Open billing portal" : "Choose plan"}
                </button>
              )}
            </section>
          );
        })}
      </div>

      <section style={{ border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 20 }}>
        <h2 style={{ margin: "0 0 6px", fontSize: 17 }}>Billing details</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 0", borderTop: "1px solid #26262a" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Current plan</div>
            <div style={{ fontSize: 13, color: "#a1a1aa" }}>You are on the <strong style={{ color: "#f4f4f5", textTransform: "capitalize" }}>{currentPlan === "free" ? "no paid" : currentPlan}</strong> plan.</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 0", borderTop: "1px solid #26262a" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Payment method</div>
            <div style={{ fontSize: 13, color: "#a1a1aa" }}>Securely managed by Stripe.</div>
          </div>
          <button disabled={busy || !org?.stripe_customer_id} onClick={() => void openPortal()}
            style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #33333a", background: "transparent", color: "#f4f4f5", fontSize: 14, cursor: busy ? "wait" : "pointer", fontFamily: "inherit" }}>
            Manage billing
          </button>
        </div>
      </section>
      {currentPlan === "team" && <p style={{ color: "#a1a1aa", fontSize: 13 }}>Your organization has a legacy Team subscription. Manage it in the billing portal.</p>}
      {message && <p role="alert" style={{ color: "#f87171", fontSize: 14 }}>{message}</p>}
    </main>
  );
}
