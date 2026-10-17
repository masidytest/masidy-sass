import { requireProject, fail } from "@/lib/auth";
import { admin } from "@/lib/supabase/server";
import { gatewayDomainStatus } from "@/lib/vercel";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { project } = await requireProject((await params).id, ["owner", "admin", "developer", "read_only"]);
    const db = admin();
    const [domains, orders] = await Promise.all([
      db.from("project_domains")
        .select("id, domain, kind, status, order_id, created_at")
        .eq("project_id", project.id).order("created_at", { ascending: false }),
      db.from("domain_orders")
        .select("id, domain, status, error_message, purchase_amount_cents, renewal_amount_cents, created_at")
        .eq("project_id", project.id).order("created_at", { ascending: false }),
    ]);
    if (domains.error || orders.error) throw new Error("Could not load domain records");
    const projectDomains = await Promise.all((domains.data ?? []).map(async domain => {
      const current = await gatewayDomainStatus(domain.domain);
      const status = current.active ? "active" : "pending";
      if (domain.status !== status) {
        const { error: updateError } = await db.from("project_domains").update({ status }).eq("id", domain.id);
        if (updateError) throw new Error("Could not save the latest domain status");
      }
      return { ...domain, status, dnsConfigured: current.dnsConfigured, dnsRecords: [current.record] };
    }));
    const orderIds = (orders.data ?? []).map(order => order.id);
    const { data: failedRenewals, error: renewalError } = orderIds.length
      ? await db.from("domain_renewals").select("domain_order_id")
        .in("domain_order_id", orderIds).eq("status", "failed")
      : { data: [], error: null };
    if (renewalError) throw new Error("Could not load domain renewal attempts");
    const safeOrders = (orders.data ?? []).map(order => ({
      ...order,
      error_message: order.error_message ? "The domain renewal could not be completed. Contact Masidy support." : null,
    }));
    return Response.json({ domains: projectDomains, orders: safeOrders, retryableRenewals: [...new Set((failedRenewals ?? []).map(row => row.domain_order_id))] });
  } catch (e) {
    return fail(e);
  }
}
