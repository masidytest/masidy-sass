import { z } from "zod";
import { requireRole, fail, HttpError } from "@/lib/auth";
import { admin } from "@/lib/supabase/server";
import { stripeClient } from "@/lib/stripe";

const updateSchema = z.object({ setupIntentId: z.string().min(1) });

export async function POST(_: Request, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    const { orgId } = await params;
    await requireRole(orgId, ["owner", "admin"]);
    if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      return Response.json({ error: "Payment method setup is not configured yet." }, { status: 503 });
    }
    const { data: org, error } = await admin().from("orgs")
      .select("stripe_customer_id").eq("id", orgId).single();
    if (error || !org) return Response.json({ error: "Organization not found" }, { status: 404 });
    if (!org.stripe_customer_id) return Response.json({ error: "Choose a paid plan before adding a payment method." }, { status: 409 });

    const intent = await stripeClient().setupIntents.create({
      customer: org.stripe_customer_id,
      allowed_payment_method_types: ["card"],
      usage: "off_session",
    });
    if (!intent.client_secret) throw new Error("Payment method setup could not be started");
    return Response.json({ clientSecret: intent.client_secret });
  } catch (e) {
    return fail(e);
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    const { orgId } = await params;
    await requireRole(orgId, ["owner", "admin"]);
    const input = updateSchema.parse(await req.json());
    const { data: org, error } = await admin().from("orgs")
      .select("stripe_customer_id, stripe_subscription_id").eq("id", orgId).single();
    if (error || !org) return Response.json({ error: "Organization not found" }, { status: 404 });
    if (!org.stripe_customer_id) throw new HttpError(409, "Choose a paid plan before adding a payment method.");

    const stripe = stripeClient();
    const setupIntent = await stripe.setupIntents.retrieve(input.setupIntentId);
    if (setupIntent.status !== "succeeded" || (typeof setupIntent.customer === "string" ? setupIntent.customer : setupIntent.customer?.id) !== org.stripe_customer_id) {
      throw new HttpError(409, "The payment method could not be verified. Please try again.");
    }
    const paymentMethodId = typeof setupIntent.payment_method === "string"
      ? setupIntent.payment_method
      : setupIntent.payment_method?.id;
    if (!paymentMethodId) throw new HttpError(409, "No payment method was provided.");

    await stripe.customers.update(org.stripe_customer_id, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });
    if (org.stripe_subscription_id) {
      await stripe.subscriptions.update(org.stripe_subscription_id, {
        default_payment_method: paymentMethodId,
      });
    }
    return Response.json({ updated: true });
  } catch (e) {
    return fail(e);
  }
}
