import Stripe from "stripe";
import { admin } from "@/lib/supabase/server";
import { stripeClient, stripeWebhookSecret } from "@/lib/stripe";
import { buyDomain, renewDomain, attachGatewayDomain, type DomainContact } from "@/lib/vercel";

export const runtime = "nodejs";

function stripeId(value: string | { id: string } | null | undefined) {
  return typeof value === "string" ? value : value?.id ?? null;
}

function yearFromNow() {
  const date = new Date();
  date.setUTCFullYear(date.getUTCFullYear() + 1);
  return Math.floor(date.getTime() / 1000);
}

async function fulfillDomainPurchase(session: Stripe.Checkout.Session) {
  if (session.payment_status !== "paid") return;
  const orderId = session.metadata?.orderId;
  const projectId = session.metadata?.projectId;
  if (!orderId || !projectId) throw new Error("Domain checkout is missing its order reference");

  const db = admin();
  const { data: order, error } = await db.from("domain_orders").select("*").eq("id", orderId).single();
  if (error || !order || order.project_id !== projectId) throw new Error("Domain order could not be matched");
  if (order.status === "registered" && order.stripe_subscription_id) return;
  if (order.status === "processing" && !order.vercel_order_id) {
    throw new Error("A previous domain registration attempt needs manual review");
  }

  const customerId = stripeId(session.customer);
  const paymentIntentId = stripeId(session.payment_intent);
  if (!customerId || !paymentIntentId) throw new Error("Paid domain checkout has no customer or payment intent");
  const stripe = stripeClient();
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  const paymentMethodId = stripeId(paymentIntent.payment_method);
  if (!paymentMethodId) throw new Error("Checkout did not save a payment method for annual renewal");

  const contact = order.contact_information as DomainContact;
  let vercelOrderId = order.vercel_order_id as string | null;
  if (!vercelOrderId) {
    const { data: claimed, error: claimError } = await db.from("domain_orders")
      .update({ status: "processing", updated_at: new Date().toISOString() })
      .eq("id", order.id).eq("status", "pending_payment").select("id").maybeSingle();
    if (claimError) throw new Error("Could not claim the paid domain order");
    if (!claimed) {
      const { data: latest } = await db.from("domain_orders")
        .select("status, vercel_order_id").eq("id", order.id).single();
      if (latest?.status === "registered" || latest?.status === "processing") return;
      throw new Error("The paid domain order could not be claimed");
    }
    const purchase = await buyDomain(order.domain, Number(order.expected_purchase_price), contact);
    vercelOrderId = purchase.orderId;
    const { error: saveOrderError } = await db.from("domain_orders")
      .update({ vercel_order_id: vercelOrderId, stripe_payment_intent_id: paymentIntentId, status: "processing" })
      .eq("id", order.id);
    if (saveOrderError) throw new Error("Domain was purchased but its order reference could not be saved");
  }

  await stripe.customers.update(customerId, {
    invoice_settings: { default_payment_method: paymentMethodId },
  });
  const renewalProduct = await stripe.products.create(
    { name: `Masidy domain renewal: ${order.domain}` },
    { idempotencyKey: `domain-renewal-product-${order.id}` },
  );
  const subscription = await stripe.subscriptions.create(
    {
      customer: customerId,
      items: [{
        price_data: {
          currency: "usd",
          unit_amount: order.renewal_amount_cents,
          recurring: { interval: "year" },
          product: renewalProduct.id,
        },
      }],
      default_payment_method: paymentMethodId,
      trial_end: yearFromNow(),
      trial_settings: { end_behavior: { missing_payment_method: "cancel" } },
      metadata: { type: "domain_renewal", orderId: order.id, projectId },
    },
    { idempotencyKey: `domain-renewal-${order.id}` },
  );

  await attachGatewayDomain(order.domain);
  const { error: domainError } = await db.from("project_domains").insert(
    { project_id: projectId, domain: order.domain, kind: "bought", status: "pending", order_id: vercelOrderId },
  );
  if (domainError) throw new Error("Domain was purchased but could not be linked to the project");

  const { error: orderError } = await db.from("domain_orders").update({
    stripe_payment_intent_id: paymentIntentId,
    stripe_subscription_id: subscription.id,
    status: "registered",
    error_message: null,
    updated_at: new Date().toISOString(),
  }).eq("id", order.id);
  if (orderError) throw new Error("Domain was purchased but its order status could not be saved");
}

async function renewPaidDomain(invoice: Stripe.Invoice) {
  if (invoice.amount_paid <= 0 || invoice.billing_reason !== "subscription_cycle") return;
  const subscription = invoice.parent?.subscription_details?.subscription;
  const subscriptionId = stripeId(subscription);
  if (!subscriptionId) return;

  const db = admin();
  const { data: order, error } = await db.from("domain_orders")
    .select("id, domain, contact_information, expected_renewal_price")
    .eq("stripe_subscription_id", subscriptionId).maybeSingle();
  if (error) throw new Error("Could not find the domain linked to a renewal invoice");
  if (!order) return;

  const { data: renewal, error: insertError } = await db.from("domain_renewals").insert({
    domain_order_id: order.id,
    stripe_invoice_id: invoice.id,
    status: "processing",
  }).select("id").single();
  if (insertError?.code === "23505") return;
  if (insertError || !renewal) throw new Error("Could not record the paid domain renewal");

  let result: { orderId: string };
  try {
    result = await renewDomain(order.domain, Number(order.expected_renewal_price), order.contact_information as DomainContact);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Domain renewal failed";
    await Promise.all([
      db.from("domain_renewals").update({
        status: "failed",
        error_message: message.slice(0, 500),
        updated_at: new Date().toISOString(),
      }).eq("id", renewal.id),
      db.from("domain_orders").update({
        status: "renewal_failed",
        error_message: message.slice(0, 500),
        updated_at: new Date().toISOString(),
      }).eq("id", order.id),
    ]);
    console.error("Paid domain renewal needs attention", { orderId: order.id, domain: order.domain, message });
    return;
  }

  const { error: ledgerError } = await db.from("domain_renewals").update({
    status: "renewed",
    vercel_order_id: result.orderId,
    updated_at: new Date().toISOString(),
  }).eq("id", renewal.id);
  if (ledgerError) throw new Error("Domain renewed but its registrar order could not be recorded");
  const { error: orderUpdateError } = await db.from("domain_orders").update({
    status: "registered",
    error_message: null,
    updated_at: new Date().toISOString(),
  }).eq("id", order.id);
  if (orderUpdateError) throw new Error("Domain renewed but its order status could not be saved");
}

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) return Response.json({ error: "Missing Stripe signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripeClient().webhooks.constructEvent(await req.text(), signature, stripeWebhookSecret());
  } catch (error) {
    console.error("Stripe webhook signature verification failed", error);
    return Response.json({ error: "Invalid Stripe webhook signature" }, { status: 400 });
  }

  try {
    const db = admin();
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        if (session.metadata?.type === "domain_purchase") {
          try {
            await fulfillDomainPurchase(session);
          } catch (error) {
            const orderId = session.metadata.orderId;
            if (orderId) {
              const message = error instanceof Error ? error.message : "Domain registration failed";
              await db.from("domain_orders").update({
                status: "fulfillment_failed",
                error_message: message.slice(0, 500),
                updated_at: new Date().toISOString(),
              }).eq("id", orderId);
            }
            console.error("Paid domain order requires manual fulfillment", error);
          }
        } else if (session.metadata?.type === "plan") {
          const orgId = session.metadata.orgId;
          const plan = session.metadata.plan;
          const subscriptionId = stripeId(session.subscription);
          if (orgId && (plan === "starter" || plan === "balance" || plan === "pro" || plan === "team") && subscriptionId) {
            const { error } = await db.from("orgs").update({
              plan,
              stripe_subscription_id: subscriptionId,
            }).eq("id", orgId);
            if (error) throw new Error("Could not update the organization plan");
          }
        }
        break;
      }
      case "checkout.session.expired": {
        const session = event.data.object;
        const orderId = session.metadata?.type === "domain_purchase" ? session.metadata.orderId : null;
        if (orderId) {
          const { error } = await db.from("domain_orders")
            .update({ status: "checkout_expired", updated_at: new Date().toISOString() })
            .eq("id", orderId).eq("status", "pending_payment");
          if (error) throw new Error("Could not release the expired domain checkout");
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        if (subscription.metadata.type === "plan" && subscription.metadata.orgId) {
          const plan = event.type === "customer.subscription.deleted"
            ? "free"
            : (subscription.status === "active" || subscription.status === "trialing"
              ? subscription.metadata.plan
              : "free");
          if (plan === "free" || plan === "starter" || plan === "balance" || plan === "pro" || plan === "team") {
            const { error } = await db.from("orgs").update({
              plan,
              stripe_subscription_id: plan === "free" ? null : subscription.id,
            }).eq("id", subscription.metadata.orgId).eq("stripe_subscription_id", subscription.id);
            if (error) throw new Error("Could not synchronize the organization subscription");
          }
        } else if (subscription.metadata.type === "domain_renewal" && subscription.metadata.orderId) {
          const status = event.type === "customer.subscription.deleted" || subscription.status === "canceled"
            ? "renewal_cancelled"
            : (subscription.status === "active" || subscription.status === "trialing" ? null : "renewal_failed");
          if (status) {
            const { error } = await db.from("domain_orders").update({
              status,
              error_message: status === "renewal_cancelled" ? "Automatic domain renewal subscription was canceled." : "Domain renewal subscription is not active.",
              updated_at: new Date().toISOString(),
            }).eq("id", subscription.metadata.orderId);
            if (error) throw new Error("Could not synchronize the domain renewal subscription");
          }
        }
        break;
      }
      case "invoice.paid":
        await renewPaidDomain(event.data.object);
        break;
      case "invoice.payment_failed": {
        const subscription = event.data.object.parent?.subscription_details?.subscription;
        const subscriptionId = stripeId(subscription);
        if (subscriptionId) {
          const { data: order, error } = await db.from("domain_orders")
            .select("id").eq("stripe_subscription_id", subscriptionId).maybeSingle();
          if (error) throw new Error("Could not find the domain for its failed renewal payment");
          if (order) {
            const { error: updateError } = await db.from("domain_orders").update({
              status: "renewal_failed",
              error_message: "Stripe could not collect the annual domain renewal payment.",
              updated_at: new Date().toISOString(),
            }).eq("id", order.id);
            if (updateError) throw new Error("Could not record the failed domain renewal payment");
          }
        }
        break;
      }
      default:
        break;
    }
    return Response.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook processing failed", error);
    return Response.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
