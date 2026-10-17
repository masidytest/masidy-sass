import { requireProject, fail } from "@/lib/auth";
import { queryCustomerDatabase } from "@/lib/supabase-mgmt";
import { z } from "zod";

const inputSchema = z.object({
  query: z.string().trim().min(1).max(10_000),
  mode: z.enum(["read", "write"]).default("read"),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { project, role } = await requireProject((await params).id, ["owner", "admin", "developer", "read_only"]);
    if (!project.supabase_ref) return Response.json({ error: "Project is still provisioning" }, { status: 409 });
    const { query, mode } = inputSchema.parse(await req.json());
    if (mode === "write" && role !== "owner") {
      return Response.json({ error: "Only the organization owner can run write queries." }, { status: 403 });
    }
    const normalized = query.replace(/;\s*$/, "").trim();
    if (normalized.includes(";")) {
      return Response.json({ error: "Only one SQL statement can be run at a time." }, { status: 400 });
    }
    if (mode === "read" && !/^select\b/i.test(normalized)) {
      return Response.json({ error: "Read mode accepts only a SELECT query." }, { status: 400 });
    }
    const rows = await queryCustomerDatabase(
      project.supabase_ref,
      mode === "read" ? `SELECT * FROM (${normalized}) AS masidy_query_result LIMIT 500` : normalized,
      mode === "read",
    );
    return Response.json({ rows });
  } catch (e) { return fail(e); }
}
