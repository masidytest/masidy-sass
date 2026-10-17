import { userClient } from "@/lib/supabase/server";
import { HttpError, fail } from "@/lib/auth";

export async function GET() {
  try {
    const supabase = await userClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new HttpError(401, "Sign in required");

    const { data } = await supabase
      .from("user_preferences")
      .select("value")
      .eq("user_id", user.id)
      .eq("key", "dashboard_layout")
      .maybeSingle();

    return Response.json(data?.value ?? null);
  } catch (e) { return fail(e); }
}

export async function PATCH(req: Request) {
  try {
    const supabase = await userClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new HttpError(401, "Sign in required");

    const value = await req.json();

    await supabase.from("user_preferences").upsert({
      user_id: user.id,
      key: "dashboard_layout",
      value,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,key" });

    return Response.json({ ok: true });
  } catch (e) { return fail(e); }
}
