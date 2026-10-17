import { z } from "zod";
import { requireRole, fail, HttpError } from "@/lib/auth";
import { admin } from "@/lib/supabase/server";
import { getOrCreatePlanPrice, paidPlans } from "@/lib/billing";
import { stripeClient } from "@/lib/stripe";

const updateSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("change_plan"), plan: z.enum(["starter", "balance", "pro"]) }),
  z.object({ action: z.literal("set_cancellation"), cancelAtPeriodEnd: z.boolean() }),
]);

function objectId(value: string | { id: string } | null | undefined) {
  return typeof value === "string" ? value : value?.id ?? null;
}

export async function GET(_: Request, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    const { orgId } = await params;
    await requireRole(orgId, ["owner", "admin"]);
    const { data: org, error } = await admin().from("orgs")
      .select("stripe_customer_id, stripe_subscription_id").eq("id", orgId).single();
    if (error || !org) return Response.json({ error: "Organization not found" }, { status: 404 });
    if (!org.stripe_customer_id) {
      return Response.json({ subscription: null, paymentMethod: null, invoices: [] });
    }

    const stripe = stripeClient();
    const [customer, invoices, subscription] = await Promise.all([
      stripe.customers.retrieve(org.stripe_customer_id, { expand: ["invoice_settings.default_payment_method"] }),
      stripe.invoices.list({ customer: org.stripe_customer_id, limit: 10 }),
      org.stripe_subscription_id ? stripe.subscriptions.retrieve(org.stripe_subscription_id) : Promise.resolve(null),
    ]);
    const defaultMethod = !customer.deleted ? customer.invoice_settings.default_payment_method : null;
    const paymentMethod = typeof defaultMethod === "string"
      ? await stripe.paymentMethods.retrieve(defaultMethod)
      : defaultMethod;

    return Response.json({
      subscription: subscription ? {
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      } : null,
      paymentMethod: paymentMethod?.type === "card" && paymentMethod.card ? {
        brand: paymentMethod.card.brand,
        last4: paymentMethod.card.last4,
        expMonth: paymentMethod.card.exp_month,
        expYear: paymentMethod.card.exp_year,
      } : null,
      invoices: invoices.data.map(invoice => ({
        id: invoice.id,
        number: invoice.number,
        created: invoice.created,
        status: invoice.status,
        currency: invoice.currency,
        amountPaid: invoice.amount_paid,
        amountDue: invoice.amount_due,
      })),
    });
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    const { orgId } = await params;
    await requireRole(orgId, ["owner", "admin"]);
    const input = updateSchema.parse(await req.json());
    const db = admin();
    const { data: org, error } = await db.from("orgs")
      .select("plan, stripe_customer_id, stripe_subscription_id").eq("id", orgId).single();
    if (error || !org) return Response.json({ error: "Organization not found" }, { status: 404 });
    if (!org.stripe_customer_id || !org.stripe_subscription_id) {
      throw new HttpError(409, "An active subscription is required for this action.");
    }

    const stripe = stripeClient();
    const subscription = await stripe.subscriptions.retrieve(org.stripe_subscription_id);
    if (objectId(subscription.customer) !== org.stripe_customer_id || subscription.metadata.type !== "plan") {
      throw new HttpError(409, "This subscription cannot be managed from this account.");
    }
    if (subscription.status !== "active" && subscription.status !== "trialing") {
      throw new HttpError(409, "This subscription is not active.");
    }

    if (input.action === "set_cancellation") {
      const updated = await stripe.subscriptions.update(subscription.id, {
        cancel_at_period_end: input.cancelAtPeriodEnd,
      });
      return Response.json({ cancelAtPeriodEnd: updated.cancel_at_period_end });
    }

    if (org.plan === input.plan) return Response.json({ error: "This plan is already active." }, { status: 409 });
    const item = subscription.items.data[0];
    if (!item) throw new HttpError(409, "This subscription has no plan to update.");
    const price = await getOrCreatePlanPrice(input.plan);
    await stripe.subscriptions.update(subscription.id, {
      items: [{ id: item.id, price }],
      proration_behavior: "create_prorations",
      metadata: { type: "plan", orgId, plan: input.plan },
    });
    const { error: updateError } = await db.from("orgs").update({ plan: input.plan }).eq("id", orgId);
    if (updateError) throw new Error("Plan update could not be synchronized");
    return Response.json({ plan: input.plan });
  } catch (e) {
    return fail(e);
  }
}
