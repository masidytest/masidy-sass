import { admin } from "@/lib/supabase/server";
import { stripeClient } from "@/lib/stripe";
import { env } from "@/lib/env";
import { planCatalog } from "@/lib/plans";
import type { PaidPlan } from "@/lib/plans";

export const paidPlans = planCatalog;

export function checkoutUrl(path: string) {
  if (!env.NEXT_PUBLIC_APP_URL || env.NEXT_PUBLIC_APP_URL === "https://placeholder.supabase.co") {
    throw new Error("NEXT_PUBLIC_APP_URL is not configured");
  }
  return new URL(path, env.NEXT_PUBLIC_APP_URL).toString();
}

export async function getOrCreateStripeCustomer(orgId: string, email?: string) {
  const db = admin();
  const { data: org, error } = await db.from("orgs")
    .select("id, name, stripe_customer_id").eq("id", orgId).single();
  if (error || !org) throw new Error("Organization not found");
  if (org.stripe_customer_id) return org.stripe_customer_id;

  const customer = await stripeClient().customers.create(
    { name: org.name, email, metadata: { orgId } },
    { idempotencyKey: `org-customer-${orgId}` },
  );
  const { error: updateError } = await db.from("orgs")
    .update({ stripe_customer_id: customer.id }).eq("id", orgId);
  if (updateError) throw new Error("Could not save the billing customer");
  return customer.id;
}

export async function getOrCreatePlanPrice(planId: PaidPlan) {
  const stripe = stripeClient();
  const plan = paidPlans[planId];
  const products = await stripe.products.list({ active: true, limit: 100 });
  let product = products.data.find(item => item.metadata.masidy_plan === planId);
  if (!product) {
    product = await stripe.products.create(
      { name: `Masidy ${plan.name}`, metadata: { masidy_plan: planId } },
      { idempotencyKey: `masidy-plan-product-${planId}` },
    );
  }

  const prices = await stripe.prices.list({ product: product.id, active: true, limit: 100 });
  const price = prices.data.find(item =>
    item.currency === "usd" &&
    item.unit_amount === plan.amount &&
    item.recurring?.interval === "month"
  );
  if (price) return price.id;

  const created = await stripe.prices.create(
    {
      product: product.id,
      currency: "usd",
      unit_amount: plan.amount,
      recurring: { interval: "month" },
    },
    { idempotencyKey: `masidy-plan-price-${planId}-${plan.amount}` },
  );
  return created.id;
}
