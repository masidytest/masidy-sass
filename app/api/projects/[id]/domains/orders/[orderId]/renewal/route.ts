import { requireProject, fail, HttpError } from "@/lib/auth";
import { admin } from "@/lib/supabase/server";
import { renewDomain, type DomainContact } from "@/lib/vercel";

export async function POST(_: Request, { params }: { params: Promise<{ id: string; orderId: string }> }) {
  try {
    const { id, orderId } = await params;
    const { project } = await requireProject(id, ["owner", "admin"]);
    const db = admin();
    const { data: order, error: orderError } = await db.from("domain_orders")
      .select("id, project_id, domain, contact_information, expected_renewal_price")
      .eq("id", orderId).single();
    if (orderError || !order || order.project_id !== project.id) throw new HttpError(404, "Domain order not found");

    const { data: failedRenewal, error: renewalError } = await db.from("domain_renewals")
      .select("id, status").eq("domain_order_id", order.id).eq("status", "failed")
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (renewalError) throw new Error("Could not load the failed renewal");
    if (!failedRenewal) return Response.json({ error: "No failed paid renewal needs retrying" }, { status: 409 });

    const { data: claimed, error: claimError } = await db.from("domain_renewals")
      .update({ status: "processing", error_message: null, updated_at: new Date().toISOString() })
      .eq("id", failedRenewal.id).eq("status", "failed").select("id").maybeSingle();
    if (claimError) throw new Error("Could not claim the renewal retry");
    if (!claimed) return Response.json({ error: "This renewal is already being processed" }, { status: 409 });

    let renewed: { orderId: string };
    try {
      renewed = await renewDomain(
        order.domain,
        Number(order.expected_renewal_price),
        order.contact_information as DomainContact,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Domain renewal failed";
      await Promise.all([
        db.from("domain_renewals").update({
          status: "failed",
          error_message: message.slice(0, 500),
          updated_at: new Date().toISOString(),
        }).eq("id", failedRenewal.id),
        db.from("domain_orders").update({
          status: "renewal_failed",
          error_message: message.slice(0, 500),
          updated_at: new Date().toISOString(),
        }).eq("id", order.id),
      ]);
      throw error;
    }

    const { error: ledgerError } = await db.from("domain_renewals").update({
      status: "renewed",
      vercel_order_id: renewed.orderId,
      error_message: null,
      updated_at: new Date().toISOString(),
    }).eq("id", failedRenewal.id);
    if (ledgerError) throw new Error("Domain renewed but its registrar order could not be recorded");
    const { error: orderUpdateError } = await db.from("domain_orders").update({
      status: "registered",
      error_message: null,
      updated_at: new Date().toISOString(),
    }).eq("id", order.id);
    if (orderUpdateError) throw new Error("Domain renewed but its order status could not be saved");
    return Response.json({ status: "renewed" });
  } catch (e) {
    return fail(e);
  }
}
