import { requireProject, fail } from "@/lib/auth";
import { customerProjectAdmin } from "@/lib/supabase-mgmt";
import { z } from "zod";

const body = z.object({ email: z.string().email() });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { project } = await requireProject((await params).id, ["owner", "admin"]);
    if (!project.supabase_ref) return Response.json({ error: "Still provisioning" }, { status: 409 });

    const { email } = body.parse(await req.json());

    const { error } = await (await customerProjectAdmin(project.supabase_ref))
      .auth.admin.inviteUserByEmail(email);
    if (error) throw error;
    return Response.json({ ok: true });
  } catch (e) { return fail(e); }
}
