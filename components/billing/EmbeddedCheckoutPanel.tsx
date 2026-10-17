"use client";

import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

type Props = {
  clientSecret: string;
  onComplete: () => void;
  onClose: () => void;
  title: string;
};

export function EmbeddedCheckoutPanel({ clientSecret, onComplete, onClose, title }: Props) {
  return (
    <section style={{ border: "1px solid #26262a", borderRadius: 12, background: "#151517", padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 17 }}>{title}</h2>
        <button type="button" onClick={onClose}
          style={{ padding: "7px 12px", border: "1px solid #33333a", borderRadius: 8, background: "transparent", color: "#f4f4f5", cursor: "pointer", font: "inherit" }}>
          Close
        </button>
      </div>
      {stripePromise ? (
        <EmbeddedCheckoutProvider
          key={clientSecret}
          stripe={stripePromise}
          options={{ clientSecret, onComplete }}
        >
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      ) : (
        <p role="alert" style={{ color: "#f87171", fontSize: 14 }}>
          Secure checkout is not configured. Please contact Masidy support.
        </p>
      )}
    </section>
  );
}
