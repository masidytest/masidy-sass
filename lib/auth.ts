import { admin, userClient } from "./supabase/server";

export type Role = "owner" | "admin" | "developer" | "read_only";
export class HttpError extends Error { constructor(public status: number, msg: string) { super(msg); } }

export async function requireUser() {
  const { data } = await (await userClient()).auth.getUser();
  if (!data.user) throw new HttpError(401, "Sign in required");
  return data.user;
}
export async function requireRole(orgId: string, allowed: Role[]) {
  const user = await requireUser();
  const { data } = await admin().from("org_members").select("role").eq("org_id", orgId).eq("user_id", user.id).maybeSingle();
  if (!data || !allowed.includes(data.role as Role)) throw new HttpError(403, "Not allowed");
  return { user, role: data.role as Role };
}
// Resolve a project and prove the caller may act on it. Every project route starts here.
export async function requireProject(projectId: string, allowed: Role[]) {
  const { data: project } = await admin().from("projects").select("*").eq("id", projectId).maybeSingle();
  if (!project) throw new HttpError(404, "Project not found");
  const who = await requireRole(project.org_id, allowed);
  return { project, ...who };
}
export const fail = (e: unknown) =>
  e instanceof HttpError ? Response.json({ error: e.message }, { status: e.status }) : Response.json({ error: "Server error" }, { status: 500 });
