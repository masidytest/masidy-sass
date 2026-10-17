import { requireRole, fail } from "@/lib/auth";
import { admin } from "@/lib/supabase/server";
import { checkoutUrl } from "@/lib/billing";
import { stripeClient } from "@/lib/stripe";

export async function POST(_: Request, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    const { orgId } = await params;
    await requireRole(orgId, ["owner", "admin"]);
    const { data: org, error } = await admin().from("orgs")
      .select("stripe_customer_id").eq("id", orgId).single();
    if (error || !org) return Response.json({ error: "Organization not found" }, { status: 404 });
    if (!org.stripe_customer_id) return Response.json({ error: "No billing profile yet" }, { status: 409 });

    const session = await stripeClient().billingPortal.sessions.create({
      customer: org.stripe_customer_id,
      return_url: checkoutUrl("/dashboard/plans"),
    });
    return Response.json({ url: session.url });
  } catch (e) {
    return fail(e);
  }
}
