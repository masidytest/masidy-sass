import { requireProject, fail } from "@/lib/auth";
import { queryCustomerDatabase } from "@/lib/supabase-mgmt";

type ColumnInfo = { table_name: string; column_name: string; data_type: string; is_nullable: string };

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { project } = await requireProject((await params).id, ["owner", "admin", "developer", "read_only"]);
    if (!project.supabase_ref) return Response.json({ error: "Project is still provisioning" }, { status: 409 });
    const columns = await queryCustomerDatabase<ColumnInfo>(
      project.supabase_ref,
      `SELECT table_name, column_name, data_type, is_nullable
       FROM information_schema.columns
       WHERE table_schema = 'public'
       ORDER BY table_name, ordinal_position`,
    );
    const tables = new Map<string, Omit<ColumnInfo, "table_name">[]>();
    for (const column of columns) {
      const current = tables.get(column.table_name) ?? [];
      current.push({
        column_name: column.column_name,
        data_type: column.data_type,
        is_nullable: column.is_nullable,
      });
      tables.set(column.table_name, current);
    }
    return Response.json({ tables: [...tables].map(([name, tableColumns]) => ({ name, columns: tableColumns })) });
  } catch (e) { return fail(e); }
}
