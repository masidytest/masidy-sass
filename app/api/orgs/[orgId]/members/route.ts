import { HttpError, fail, requireRole } from "@/lib/auth";
import { admin } from "@/lib/supabase/server";
import { z } from "zod";

const inviteSchema = z.object({
  email: z.string().trim().email().max(320),
  role: z.enum(["admin", "developer", "read_only"]),
});
const memberChangeSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["admin", "developer", "read_only"]),
});
const memberRemovalSchema = z.object({ userId: z.string().uuid() });

export async function GET(_: Request, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    const { orgId } = await params;
    const { user: actor } = await requireRole(orgId, ["owner", "admin", "developer", "read_only"]);
    const db = admin();
    const { data: members, error: memberError } = await db
      .from("org_members").select("user_id, role").eq("org_id", orgId);
    if (memberError) throw memberError;

    const { data: userPage, error: usersError } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (usersError) throw usersError;
    const users = new Map(userPage.users.map(user => [user.id, user]));
    return Response.json({
      members: (members ?? []).map(member => {
        const user = users.get(member.user_id);
        return {
          user_id: member.user_id,
          role: member.role,
          is_current_user: member.user_id === actor.id,
          email: user?.email ?? null,
          name: user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? null,
        };
      }),
    });
  } catch (e) { return fail(e); }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    const { orgId } = await params;
    const { user: actor, role: actorRole } = await requireRole(orgId, ["owner", "admin"]);
    const { userId, role } = memberChangeSchema.parse(await req.json());
    if (userId === actor.id) throw new HttpError(400, "You cannot change your own organization role");
    const db = admin();
    const { data: target, error: lookupError } = await db.from("org_members")
      .select("role").eq("org_id", orgId).eq("user_id", userId).maybeSingle();
    if (lookupError) throw lookupError;
    if (!target) throw new HttpError(404, "Organization member not found");
    if (target.role === "owner") throw new HttpError(403, "The organization owner role cannot be changed here");
    if (actorRole === "admin" && (target.role === "admin" || role === "admin")) {
      throw new HttpError(403, "Only the organization owner can change administrator roles");
    }
    const { error: updateError } = await db.from("org_members").update({ role })
      .eq("org_id", orgId).eq("user_id", userId);
    if (updateError) throw updateError;
    return Response.json({ ok: true });
  } catch (e) { return fail(e); }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    const { orgId } = await params;
    const { user: actor, role: actorRole } = await requireRole(orgId, ["owner", "admin"]);
    const { userId } = memberRemovalSchema.parse(await req.json());
    if (userId === actor.id) throw new HttpError(400, "You cannot remove yourself from the organization");
    const db = admin();
    const { data: target, error: lookupError } = await db.from("org_members")
      .select("role").eq("org_id", orgId).eq("user_id", userId).maybeSingle();
    if (lookupError) throw lookupError;
    if (!target) throw new HttpError(404, "Organization member not found");
    if (target.role === "owner") throw new HttpError(403, "The organization owner cannot be removed");
    if (actorRole === "admin" && target.role === "admin") {
      throw new HttpError(403, "Only the organization owner can remove an administrator");
    }
    const { error: deleteError } = await db.from("org_members").delete()
      .eq("org_id", orgId).eq("user_id", userId);
    if (deleteError) throw deleteError;
    return Response.json({ ok: true });
  } catch (e) { return fail(e); }
}

export async function POST(req: Request, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    const { orgId } = await params;
    const { role: actorRole } = await requireRole(orgId, ["owner", "admin"]);
    const { email, role } = inviteSchema.parse(await req.json());
    if (actorRole === "admin" && role === "admin") {
      throw new HttpError(403, "Only the organization owner can invite administrators");
    }
    const db = admin();
    const normalizedEmail = email.toLowerCase();
    const { data: userPage, error: usersError } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (usersError) throw usersError;
    const existingUser = userPage.users.find(user => user.email?.toLowerCase() === normalizedEmail);

    if (existingUser) {
      const { data: existingMember, error: lookupError } = await db.from("org_members")
        .select("user_id").eq("org_id", orgId).eq("user_id", existingUser.id).maybeSingle();
      if (lookupError) throw lookupError;
      if (existingMember) throw new HttpError(409, "This user is already a member of the organization");
      const { error: insertError } = await db.from("org_members").insert({
        org_id: orgId, user_id: existingUser.id, role,
      });
      if (insertError) throw insertError;
      return Response.json({ ok: true, status: "added" }, { status: 201 });
    }

    const origin = new URL(req.url).origin;
    const { data: invitation, error: inviteError } = await db.auth.admin.inviteUserByEmail(normalizedEmail, {
      data: { org_id: orgId, organization_role: role },
      redirectTo: `${origin}/auth/callback?next=/dashboard`,
    });
    if (inviteError) throw inviteError;
    if (!invitation.user) throw new Error("Invitation did not return a user");
    const { error: insertError } = await db.from("org_members").insert({
      org_id: orgId, user_id: invitation.user.id, role,
    });
    if (insertError) {
      throw new Error(`Invite email was sent, but organization access could not be assigned: ${insertError.message}`);
    }
    return Response.json({ ok: true, status: "invited" }, { status: 201 });
  } catch (e) { return fail(e); }
}
