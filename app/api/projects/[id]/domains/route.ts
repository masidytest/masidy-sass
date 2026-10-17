import { requireProject, fail } from "@/lib/auth";
import { admin } from "@/lib/supabase/server";

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
    const orderIds = (orders.data ?? []).map(order => order.id);
    const { data: failedRenewals, error: renewalError } = orderIds.length
      ? await db.from("domain_renewals").select("domain_order_id")
        .in("domain_order_id", orderIds).eq("status", "failed")
      : { data: [], error: null };
    if (renewalError) throw new Error("Could not load domain renewal attempts");
    return Response.json({ domains: domains.data, orders: orders.data, retryableRenewals: [...new Set((failedRenewals ?? []).map(row => row.domain_order_id))] });
  } catch (e) {
    return fail(e);
  }
}
