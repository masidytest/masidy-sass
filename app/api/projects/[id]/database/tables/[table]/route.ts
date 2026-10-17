import { requireProject, fail } from "@/lib/auth";
import { queryCustomerDatabase } from "@/lib/supabase-mgmt";
import { z } from "zod";

type ColumnInfo = {
  column_name: string;
  data_type: string;
  is_generated: string;
  is_identity: string;
};

const identifier = /^[A-Za-z_][A-Za-z0-9_]{0,62}$/;
const insertSchema = z.object({ values: z.record(z.string(), z.unknown()).refine(value => Object.keys(value).length > 0) });

function sqlLiteral(value: unknown, type: string): string {
  if (value === null) return "NULL";
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "string") return `'${value.replaceAll("'", "''")}'`;
  if (type === "jsonb" && typeof value === "object" && !Array.isArray(value)) {
    return `'${JSON.stringify(value).replaceAll("'", "''")}'::jsonb`;
  }
  throw new Error(`Unsupported value for ${type}; use a string, number, boolean, null, or JSON object for jsonb columns.`);
}

async function tableColumns(ref: string, table: string) {
  return queryCustomerDatabase<ColumnInfo>(
    ref,
    `SELECT column_name, data_type, is_generated, is_identity
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = '${table}'
     ORDER BY ordinal_position`,
  );
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string; table: string }> }) {
  try {
    const { id, table } = await params;
    if (!identifier.test(table)) return Response.json({ error: "Invalid table name" }, { status: 400 });
    const { project } = await requireProject(id, ["owner", "admin", "developer", "read_only"]);
    if (!project.supabase_ref) return Response.json({ error: "Project is still provisioning" }, { status: 409 });
    const url = new URL(req.url);
    const offset = Number(url.searchParams.get("offset") ?? "0");
    if (!Number.isSafeInteger(offset) || offset < 0 || offset > 10_000) {
      return Response.json({ error: "Offset must be between 0 and 10000" }, { status: 400 });
    }
    const columns = await tableColumns(project.supabase_ref, table);
    if (!columns.length) return Response.json({ error: "Table not found in the public schema" }, { status: 404 });
    const rows = await queryCustomerDatabase(
      project.supabase_ref,
      `SELECT * FROM public."${table}" LIMIT 101 OFFSET ${offset}`,
    );
    return Response.json({
      columns,
      rows: rows.slice(0, 100),
      hasMore: rows.length > 100,
      offset,
    });
  } catch (e) { return fail(e); }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string; table: string }> }) {
  try {
    const { id, table } = await params;
    if (!identifier.test(table)) return Response.json({ error: "Invalid table name" }, { status: 400 });
    const { project } = await requireProject(id, ["owner", "admin"]);
    if (!project.supabase_ref) return Response.json({ error: "Project is still provisioning" }, { status: 409 });
    const { values } = insertSchema.parse(await req.json());
    const columns = await tableColumns(project.supabase_ref, table);
    if (!columns.length) return Response.json({ error: "Table not found in the public schema" }, { status: 404 });
    const byName = new Map(columns.map(column => [column.column_name, column]));
    const entries = Object.entries(values);
    for (const [name] of entries) {
      if (!identifier.test(name) || !byName.has(name)) {
        return Response.json({ error: `Unknown column: ${name}` }, { status: 400 });
      }
      const column = byName.get(name)!;
      if (column.is_generated !== "NEVER" || column.is_identity === "ALWAYS") {
        return Response.json({ error: `Column ${name} is generated and cannot be set` }, { status: 400 });
      }
    }
    const sqlColumns = entries.map(([name]) => `"${name}"`).join(", ");
    const sqlValues = entries.map(([name, value]) => sqlLiteral(value, byName.get(name)!.data_type)).join(", ");
    const rows = await queryCustomerDatabase(
      project.supabase_ref,
      `INSERT INTO public."${table}" (${sqlColumns}) VALUES (${sqlValues}) RETURNING *`,
      false,
    );
    return Response.json({ rows }, { status: 201 });
  } catch (e) { return fail(e); }
}
