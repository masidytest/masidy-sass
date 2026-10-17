import { requireProject, fail } from "@/lib/auth";
import { supabaseManagementRequest } from "@/lib/supabase-mgmt";

type AuthUsersResponse = { users?: unknown[] } | unknown[];

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { project } = await requireProject((await params).id, ["owner", "admin", "developer"]);
    if (!project.supabase_ref) return Response.json({ error: "Project is still provisioning" }, { status: 409 });
    const data = await supabaseManagementRequest<AuthUsersResponse>(
      `/projects/${encodeURIComponent(project.supabase_ref)}/auth/users?page=1&per_page=100`,
    );
    const users = Array.isArray(data) ? data : data.users;
    if (!Array.isArray(users)) return Response.json({ error: "User data returned an unexpected response" }, { status: 502 });
    return Response.json(users);
  } catch (e) { return fail(e); }
}
