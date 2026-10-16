import { requireProject, fail } from "@/lib/auth";
import { apiKeys } from "@/lib/supabase-mgmt";
import { env } from "@/lib/env";

// Returns the PUBLIC key only. The secret key is never sent to the browser.
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { project } = await requireProject((await params).id, ["owner", "admin", "developer"]);
    if (!project.supabase_ref) return Response.json({ error: "Still provisioning" }, { status: 409 });
    const keys = await apiKeys(project.supabase_ref);
    return Response.json({ url: `https://${project.slug}.${env.GATEWAY_BASE_DOMAIN}`, publicKey: keys.find((k) => k.name === "anon")?.api_key });
  } catch (e) { return fail(e); }
}
