import { requireProject, fail } from "@/lib/auth";
import { supabaseManagementRequest } from "@/lib/supabase-mgmt";
import { z } from "zod";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { project } = await requireProject((await params).id, ["owner", "admin", "developer"]);
    if (!project.supabase_ref) return Response.json({ error: "Project is still provisioning" }, { status: 409 });
    const buckets = await supabaseManagementRequest<unknown[]>(
      `/projects/${encodeURIComponent(project.supabase_ref)}/storage/buckets`,
    );
    return Response.json(buckets);
  } catch (e) { return fail(e); }
}

const body = z.object({
  name: z.string().min(1).max(63),
  public: z.boolean().default(false),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { project } = await requireProject((await params).id, ["owner", "admin"]);
    if (!project.supabase_ref) return Response.json({ error: "Still provisioning" }, { status: 409 });

    const input = body.parse(await req.json());
    const bucket = await supabaseManagementRequest<unknown>(
      `/projects/${encodeURIComponent(project.supabase_ref)}/storage/buckets`,
      {
        method: "POST",
        body: JSON.stringify({ id: input.name, name: input.name, public: input.public }),
      },
    );
    return Response.json(bucket, { status: 201 });
  } catch (e) { return fail(e); }
}
