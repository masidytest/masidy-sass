"use client";

import { useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

function PaymentMethodFormContent({ orgId, onSaved }: { orgId: string; onSaved: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!stripe || !elements) return;
    setBusy(true);
    setError("");
    try {
      const result = await stripe.confirmSetup({ elements, redirect: "if_required" });
      if (result.error || result.setupIntent?.status !== "succeeded") {
        throw new Error("Check the card details and try again.");
      }
      const response = await fetch(`/api/orgs/${orgId}/billing/payment-method`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setupIntentId: result.setupIntent.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not update the payment method.");
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update the payment method.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
      <PaymentElement />
      {error && <p role="alert" style={{ margin: 0, color: "#f87171", fontSize: 13 }}>{error}</p>}
      <button type="submit" disabled={!stripe || !elements || busy}
        style={{ padding: "9px 14px", border: 0, borderRadius: 8, background: "#f4f4f5", color: "#0b0b0c", fontWeight: 600, fontSize: 14, cursor: busy ? "wait" : "pointer" }}>
        {busy ? "Saving…" : "Save payment method"}
      </button>
    </form>
  );
}

export function PaymentMethodForm({ orgId, clientSecret, onSaved }: { orgId: string; clientSecret: string; onSaved: () => void }) {
  if (!stripePromise) {
    return <p role="alert" style={{ color: "#f87171", fontSize: 14 }}>Payment method setup is not configured. Please contact Masidy support.</p>;
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "night",
          variables: { colorPrimary: "#75ea5e", colorBackground: "#151517", colorText: "#f4f4f5" },
        },
      }}
    >
      <PaymentMethodFormContent orgId={orgId} onSaved={onSaved} />
    </Elements>
  );
}
