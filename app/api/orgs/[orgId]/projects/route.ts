import { z } from "zod";
import { requireRole, fail } from "@/lib/auth";
import { admin } from "@/lib/supabase/server";
import { createCustomerProject } from "@/lib/supabase-mgmt";
import { planCatalog } from "@/lib/plans";

const MAX_PROJECTS: Record<string, number> = {
  free: 0,
  starter: planCatalog.starter.projectLimit,
  balance: planCatalog.balance.projectLimit,
  pro: planCatalog.pro.projectLimit,
  team: planCatalog.pro.projectLimit,
};
const body = z.object({
  name: z.string().min(2).max(60),
  slug: z.string().regex(/^[a-z0-9][a-z0-9-]{1,38}$/),
  region: z.string().min(2),
});

export async function POST(req: Request, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    const { orgId } = await params;
    await requireRole(orgId, ["owner", "admin"]);
    const input = body.parse(await req.json());
    const db = admin();

    const { data: org, error: orgError } = await db.from("orgs").select("plan").eq("id", orgId).single();
    if (orgError || !org) throw new Error("Organization not found");
    const { count, error: projectCountError } = await db.from("projects")
      .select("id", { count: "exact", head: true }).eq("org_id", orgId);
    if (projectCountError) throw new Error("Could not check the organization's project limit");
    const planLimit = MAX_PROJECTS[org.plan] ?? 0;
    if (planLimit === 0) {
      return Response.json({ error: "Choose a paid plan before creating a project." }, { status: 402 });
    }
    if ((count ?? 0) >= planLimit) {
      return Response.json({ error: "You have reached your plan's project limit." }, { status: 402 });
    }

    // Reserve the row first so the slug is ours, then call the paid API.
    const { data: row, error } = await db.from("projects").insert({ org_id: orgId, ...input }).select("id").single();
    if (error) return Response.json({ error: "Slug taken" }, { status: 409 });
    try {
      const created = await createCustomerProject(`${orgId.slice(0, 8)}-${input.slug}`, input.region);
      await db.from("projects").update({ supabase_ref: created.id }).eq("id", row.id);
      return Response.json({ id: row.id, status: "provisioning" }, { status: 202 });
    } catch (error) {
      await db.from("projects").update({ status: "failed" }).eq("id", row.id);
      console.error("Customer project provisioning failed", { orgId, projectId: row.id, plan: org.plan, error });
      return Response.json({ error: "Provisioning failed" }, { status: 502 });
    }
  } catch (e) { return fail(e); }
}
