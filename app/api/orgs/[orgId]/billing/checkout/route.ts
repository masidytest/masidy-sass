import { z } from "zod";
import { requireRole, fail } from "@/lib/auth";
import { paidPlans, checkoutUrl, getOrCreateStripeCustomer } from "@/lib/billing";
import { admin } from "@/lib/supabase/server";
import { stripeClient } from "@/lib/stripe";
import type { PaidPlan } from "@/lib/plans";

const body = z.object({ plan: z.enum(["starter", "balance", "pro"]) });

export async function POST(req: Request, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    const { orgId } = await params;
    const { user } = await requireRole(orgId, ["owner", "admin"]);
    const { plan } = body.parse(await req.json());
    if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      return Response.json({ error: "Secure checkout is not configured yet." }, { status: 503 });
    }
    const db = admin();
    const { data: org, error } = await db.from("orgs")
      .select("plan, stripe_subscription_id").eq("id", orgId).single();
    if (error || !org) return Response.json({ error: "Organization not found" }, { status: 404 });
    if (org.plan === plan) return Response.json({ error: "This plan is already active" }, { status: 409 });
    if (org.stripe_subscription_id) {
      return Response.json({ error: "Manage your existing subscription from the billing portal." }, { status: 409 });
    }

    const customer = await getOrCreateStripeCustomer(orgId, user.email ?? undefined);
    const selected = paidPlans[plan];
    const session = await stripeClient().checkout.sessions.create({
      mode: "subscription",
      customer,
      line_items: [{
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: selected.amount,
          recurring: { interval: "month" },
          product_data: { name: `Masidy ${selected.name}` },
        },
      }],
      metadata: { type: "plan", orgId, plan },
      subscription_data: { metadata: { type: "plan", orgId, plan: plan as PaidPlan } },
      allowed_payment_method_types: ["card"],
      ui_mode: "embedded_page",
      redirect_on_completion: "if_required",
      return_url: checkoutUrl("/dashboard/plans?checkout=complete&session_id={CHECKOUT_SESSION_ID}"),
    });
    if (!session.client_secret) throw new Error("Could not start secure checkout");
    return Response.json({ clientSecret: session.client_secret });
  } catch (e) {
    return fail(e);
  }
}
