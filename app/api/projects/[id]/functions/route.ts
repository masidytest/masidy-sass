import { HttpError, requireProject, fail } from "@/lib/auth";
import { supabaseManagementRequest } from "@/lib/supabase-mgmt";
import { env } from "@/lib/env";
import { z } from "zod";

type EdgeFunction = {
  id: string;
  slug: string;
  name: string;
  status: string;
  version: number;
  created_at: number;
  updated_at: number;
  verify_jwt: boolean;
};

const deploySchema = z.object({
  slug: z.string().trim().regex(/^[a-z][a-z0-9-]{0,39}$/),
  name: z.string().trim().min(1).max(80),
  source: z.string().min(1).max(1_000_000),
  verifyJwt: z.boolean(),
});

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { project } = await requireProject((await params).id, ["owner", "admin", "developer", "read_only"]);
    if (!project.supabase_ref) return Response.json({ error: "Project is still provisioning" }, { status: 409 });
    const functions = await supabaseManagementRequest<EdgeFunction[]>(
      `/projects/${encodeURIComponent(project.supabase_ref)}/functions`,
    );
    return Response.json({
      functions,
      baseUrl: `https://${project.slug}.${env.GATEWAY_BASE_DOMAIN}/functions/v1`,
    });
  } catch (e) { return fail(e); }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { project } = await requireProject((await params).id, ["owner", "admin"]);
    if (!project.supabase_ref) throw new HttpError(409, "Project is still provisioning");
    const input = deploySchema.parse(await req.json());
    const body = new FormData();
    body.set("metadata", JSON.stringify({
      entrypoint_path: "index.ts",
      name: input.name,
      verify_jwt: input.verifyJwt,
    }));
    body.set("file", new Blob([input.source], { type: "application/typescript" }), "index.ts");
    const deployed = await supabaseManagementRequest<EdgeFunction>(
      `/projects/${encodeURIComponent(project.supabase_ref)}/functions/deploy?slug=${encodeURIComponent(input.slug)}`,
      { method: "POST", body },
    );
    return Response.json({ function: deployed }, { status: 201 });
  } catch (e) { return fail(e); }
}
