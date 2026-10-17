"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { planCatalog, type PaidPlan } from "@/lib/plans";
import { EmbeddedCheckoutPanel } from "@/components/billing/EmbeddedCheckoutPanel";
import { PaymentMethodForm } from "@/components/billing/PaymentMethodForm";

const ACCENT = "#75ea5e";
const PLANS = Object.entries(planCatalog) as [PaidPlan, (typeof planCatalog)[PaidPlan]][];
type Organization = { id: string; plan: string; stripe_customer_id: string | null; stripe_subscription_id: string | null };
type BillingData = {
  subscription: { status: string; cancelAtPeriodEnd: boolean } | null;
  paymentMethod: { brand: string; last4: string; expMonth: number; expYear: number } | null;
  invoices: { id: string; number: string | null; created: number; status: string | null; currency: string | null; amountPaid: number; amountDue: number }[];
};

export default function PlansPage() {
  const [org, setOrg] = useState<Organization | null>(null);
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [billingLoading, setBillingLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [checkoutSecret, setCheckoutSecret] = useState<string | null>(null);
  const [paymentSecret, setPaymentSecret] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageError, setMessageError] = useState(false);
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
        setMessage("Could not load account billing details.");
        setMessageError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!org) return;
    void (async () => {
      setBillingLoading(true);
      try {
        const response = await fetch(`/api/orgs/${org.id}/billing/subscription`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Could not load billing details.");
        setBilling(data as BillingData);
      } catch {
        setBilling(null);
        setMessage("Could not load billing details. Refresh the page to try again.");
        setMessageError(true);
      } finally {
        setBillingLoading(false);
      }
    })();
  }, [org]);

  async function openCheckout(plan: PaidPlan) {
    if (!org) return;
    setBusy(true);
    setMessage("");
    setMessageError(false);
    try {
      const response = await fetch(`/api/orgs/${org.id}/billing/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not start checkout");
      if (typeof data.clientSecret !== "string" || !data.clientSecret) throw new Error("Secure checkout could not be started.");
      setCheckoutSecret(data.clientSecret);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not start checkout");
      setMessageError(true);
      setBusy(false);
    }
  }

  async function changePlan(plan: PaidPlan) {
    if (!org || !org.stripe_subscription_id) return;
    if (!window.confirm("Change your plan? Any prorated amount will appear on an upcoming invoice.")) return;
    setBusy(true);
    setMessage("");
    setMessageError(false);
    try {
      const response = await fetch(`/api/orgs/${org.id}/billing/subscription`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "change_plan", plan }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not update your plan.");
      setOrg(current => current ? { ...current, plan: data.plan } : current);
      setMessage("Plan updated. Any prorated amount will appear on an upcoming invoice.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update your plan.");
      setMessageError(true);
    } finally {
      setBusy(false);
    }
  }

  async function setCancellation(cancelAtPeriodEnd: boolean) {
    if (!org || !billing?.subscription) return;
    if (cancelAtPeriodEnd && !window.confirm("Cancel this subscription at the end of the current billing period?")) return;
    setBusy(true);
    setMessage("");
    setMessageError(false);
    try {
      const response = await fetch(`/api/orgs/${org.id}/billing/subscription`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set_cancellation", cancelAtPeriodEnd }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not update your subscription.");
      setBilling(current => current?.subscription
        ? { ...current, subscription: { ...current.subscription, cancelAtPeriodEnd: data.cancelAtPeriodEnd } }
        : current);
      setMessage(cancelAtPeriodEnd ? "Your plan will remain active until the end of the billing period." : "Subscription cancellation was withdrawn.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update your subscription.");
      setMessageError(true);
    } finally {
      setBusy(false);
    }
  }

  async function addPaymentMethod() {
    if (!org) return;
    setBusy(true);
    setMessage("");
    setMessageError(false);
    try {
      const response = await fetch(`/api/orgs/${org.id}/billing/payment-method`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not open payment method setup.");
      if (typeof data.clientSecret !== "string" || !data.clientSecret) throw new Error("Payment method setup could not be started.");
      setPaymentSecret(data.clientSecret);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not open payment method setup.");
      setMessageError(true);
    } finally {
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
                <button disabled={busy || !org} onClick={() => org?.stripe_subscription_id ? void changePlan(id) : void openCheckout(id)}
                  style={{ width: "100%", padding: "9px 0", borderRadius: 8, border: isRecommended ? 0 : "1px solid #33333a", background: isRecommended ? "#f4f4f5" : "transparent", color: isRecommended ? "#0b0b0c" : "#f4f4f5", fontWeight: 600, fontSize: 14, cursor: busy || !org ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
                  {org?.stripe_subscription_id ? "Switch to plan" : "Choose plan"}
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
            <div style={{ fontSize: 13, color: "#a1a1aa" }}>
              {billingLoading ? "Loading…" : billing?.paymentMethod
                ? `${billing.paymentMethod.brand} ending in ${billing.paymentMethod.last4} · expires ${String(billing.paymentMethod.expMonth).padStart(2, "0")}/${billing.paymentMethod.expYear}`
                : "No saved card"}
            </div>
          </div>
          <button disabled={busy || !org?.stripe_customer_id} onClick={() => void addPaymentMethod()}
            style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #33333a", background: "transparent", color: "#f4f4f5", fontSize: 14, cursor: busy ? "wait" : "pointer", fontFamily: "inherit" }}>
            Update card
          </button>
        </div>
        {billing?.subscription && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 0", borderTop: "1px solid #26262a" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Subscription</div>
              <div style={{ fontSize: 13, color: "#a1a1aa" }}>
                {billing.subscription.cancelAtPeriodEnd ? "Scheduled to end at the close of this billing period." : `Status: ${billing.subscription.status.replaceAll("_", " ")}.`}
              </div>
            </div>
            <button disabled={busy} onClick={() => void setCancellation(!billing.subscription?.cancelAtPeriodEnd)}
              style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #33333a", background: "transparent", color: "#f4f4f5", fontSize: 14, cursor: busy ? "wait" : "pointer", fontFamily: "inherit" }}>
              {billing.subscription.cancelAtPeriodEnd ? "Keep subscription" : "Cancel plan"}
            </button>
          </div>
        )}
        <div style={{ padding: "14px 0 0", borderTop: "1px solid #26262a" }}>
          <h3 style={{ margin: "0 0 10px", fontSize: 14 }}>Recent invoices</h3>
          {billingLoading ? <p style={{ color: "#a1a1aa", fontSize: 13 }}>Loading invoices…</p>
            : billing?.invoices.length ? billing.invoices.map(invoice => (
              <div key={invoice.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "8px 0", fontSize: 13, borderTop: "1px solid #26262a" }}>
                <span>{invoice.number ?? new Date(invoice.created * 1000).toLocaleDateString()} · {invoice.status ?? "unknown"}</span>
                <span>{new Intl.NumberFormat(undefined, { style: "currency", currency: (invoice.currency ?? "usd").toUpperCase() }).format((invoice.amountPaid || invoice.amountDue) / 100)}</span>
              </div>
            )) : <p style={{ margin: 0, color: "#a1a1aa", fontSize: 13 }}>No invoices yet.</p>}
        </div>
      </section>
      {currentPlan === "team" && <p style={{ color: "#a1a1aa", fontSize: 13 }}>Your organization has a legacy Team plan. Contact Masidy support for plan changes.</p>}
      {checkoutSecret && (
        <div style={{ marginTop: 20 }}>
          <EmbeddedCheckoutPanel
            clientSecret={checkoutSecret}
            title="Choose a secure payment method"
            onClose={() => { setCheckoutSecret(null); setBusy(false); }}
            onComplete={() => {
              setCheckoutSecret(null);
              setMessage("Payment received. Your plan will appear here once confirmed.");
              setMessageError(false);
              window.setTimeout(() => window.location.reload(), 2000);
            }}
          />
        </div>
      )}
      {paymentSecret && org && (
        <section style={{ marginTop: 20, border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 17 }}>Update payment method</h2>
            <button type="button" onClick={() => setPaymentSecret(null)}
              style={{ padding: "7px 12px", border: "1px solid #33333a", borderRadius: 8, background: "transparent", color: "#f4f4f5", cursor: "pointer", font: "inherit" }}>Close</button>
          </div>
          <PaymentMethodForm orgId={org.id} clientSecret={paymentSecret} onSaved={() => {
            setPaymentSecret(null);
            setMessage("Payment method updated.");
            setMessageError(false);
            window.location.reload();
          }} />
        </section>
      )}
      {message && <p role={messageError ? "alert" : "status"} style={{ color: messageError ? "#f87171" : ACCENT, fontSize: 14 }}>{message}</p>}
    </main>
  );
}
