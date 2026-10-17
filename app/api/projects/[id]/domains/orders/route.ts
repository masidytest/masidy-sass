import { z } from "zod";
import { requireProject, fail } from "@/lib/auth";
import { admin } from "@/lib/supabase/server";
import { domainPrice } from "@/lib/vercel";
import { getOrCreateStripeCustomer, checkoutUrl } from "@/lib/billing";
import { stripeClient } from "@/lib/stripe";
import { retailDomainPriceCents } from "@/lib/domain-pricing";

const contactSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().min(5).max(40),
  address1: z.string().trim().min(1).max(200),
  address2: z.string().trim().max(200).optional().transform(value => value || undefined),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().min(1).max(100),
  zip: z.string().trim().min(1).max(30),
  country: z.string().trim().length(2).transform(value => value.toUpperCase()),
  companyName: z.string().trim().max(200).optional().transform(value => value || undefined),
  fax: z.string().trim().max(40).optional(),
});
const body = z.object({
  domain: z.string().trim().toLowerCase().regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/),
  contact: contactSchema,
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { project, user } = await requireProject((await params).id, ["owner", "admin"]);
    if (!project.supabase_ref) return Response.json({ error: "Project is still provisioning" }, { status: 409 });
    const input = body.parse(await req.json());
    const quote = await domainPrice(input.domain);
    if (!quote.available) return Response.json({ error: "That domain is not available" }, { status: 409 });

    const purchaseAmountCents = retailDomainPriceCents(quote.purchasePrice);
    const renewalAmountCents = retailDomainPriceCents(quote.renewalPrice);
    const db = admin();
    const { data: existingDomain, error: domainLookupError } = await db.from("project_domains")
      .select("domain").eq("domain", input.domain).maybeSingle();
    if (domainLookupError) throw new Error("Could not verify whether the domain is already connected");
    if (existingDomain) return Response.json({ error: "This domain is already connected to a project" }, { status: 409 });
    const { data: order, error: insertError } = await db.from("domain_orders").insert({
      project_id: project.id,
      domain: input.domain,
      contact_information: input.contact,
      purchase_amount_cents: purchaseAmountCents,
      renewal_amount_cents: renewalAmountCents,
      expected_purchase_price: Number(quote.purchasePrice),
      expected_renewal_price: Number(quote.renewalPrice),
      status: "pending_payment",
    }).select("id").single();
    if (insertError || !order) return Response.json({ error: "This domain already has an order" }, { status: 409 });

    try {
      const customer = await getOrCreateStripeCustomer(project.org_id, user.email ?? input.contact.email);
      const session = await stripeClient().checkout.sessions.create({
        mode: "payment",
        customer,
        allowed_payment_method_types: ["card"],
        line_items: [{
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: purchaseAmountCents,
            product_data: {
              name: input.domain,
              description: `Domain registration for one year. Annual renewal: $${(renewalAmountCents / 100).toFixed(2)} USD (includes 20% Masidy markup).`,
            },
          },
        }],
        payment_intent_data: { setup_future_usage: "off_session" },
        metadata: { type: "domain_purchase", orderId: order.id, projectId: project.id },
        success_url: checkoutUrl(`/dashboard/domains?checkout=success&domain=${encodeURIComponent(input.domain)}`),
        cancel_url: checkoutUrl("/dashboard/domains?checkout=cancelled"),
      });
      if (!session.url) throw new Error("Stripe did not return a checkout URL");
      const { error: updateError } = await db.from("domain_orders")
        .update({ stripe_checkout_session_id: session.id }).eq("id", order.id);
      if (updateError) {
        await stripeClient().checkout.sessions.expire(session.id);
        throw new Error("Could not save the checkout session");
      }
      return Response.json({
        url: session.url,
        purchaseAmountCents,
        renewalAmountCents,
        currency: "usd",
      });
    } catch (e) {
      await db.from("domain_orders").delete().eq("id", order.id).eq("status", "pending_payment");
      throw e;
    }
  } catch (e) {
    return fail(e);
  }
}
