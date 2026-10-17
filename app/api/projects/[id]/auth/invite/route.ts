import { requireProject, fail } from "@/lib/auth";
import { env } from "@/lib/env";
import { z } from "zod";

const body = z.object({ email: z.string().email() });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { project } = await requireProject((await params).id, ["owner", "admin"]);
    if (!project.supabase_ref) return Response.json({ error: "Still provisioning" }, { status: 409 });

    const { email } = body.parse(await req.json());

    const r = await fetch(
      `https://api.supabase.com/v1/projects/${project.supabase_ref}/auth/invite`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${env.SUPABASE_MGMT_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      }
    );
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      return Response.json({ error: (err as { message?: string }).message ?? "Failed to invite" }, { status: r.status });
    }
    return Response.json({ ok: true });
  } catch (e) { return fail(e); }
}
