import { admin } from "@/lib/supabase/server";
import { stripeClient } from "@/lib/stripe";
import { env } from "@/lib/env";
import { planCatalog } from "@/lib/plans";

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
