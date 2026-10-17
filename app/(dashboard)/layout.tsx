import { redirect } from "next/navigation";
import { userClient, admin } from "@/lib/supabase/server";
import { Sidebar } from "@/components/sidebar";
import { TopBar } from "@/components/topbar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let email = "";
  let name = "User";
  let projectName = "My Project";
  let plan = "FREE";

  try {
    const supabase = await userClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) redirect("/sign-in");

    email = data.user.email ?? "";
    name =
      (data.user.user_metadata?.full_name as string | undefined) ??
      (data.user.user_metadata?.name as string | undefined) ??
      (email ? email.split("@")[0] : "User") ??
      "User";

    // Fetch org name and first project for top bar
    try {
      const db = admin();
      const { data: member } = await db.from("org_members")
        .select("org_id, orgs(name, plan)").eq("user_id", data.user.id).limit(1).single();
      if (member) {
        const orgData = (member.orgs as unknown) as { name: string; plan: string } | null;
        if (orgData) {
          projectName = orgData.name; // show org name in top bar
          plan = (orgData.plan as string).toUpperCase();
        }
        const { data: proj } = await db.from("projects")
          .select("name, status").eq("org_id", member.org_id)
          .order("created_at", { ascending: true }).limit(1).single();
        if (proj) { projectName = proj.name ?? projectName; }
      }
    } catch { /* no project yet — fine */ }

  } catch {
    redirect("/sign-in");
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0e0e0f", color: "#f4f4f5" }}>
      <Sidebar userName={name} userEmail={email} projectName={projectName} plan={plan} />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <TopBar projectName={projectName} plan={plan} />
        {children}
      </div>
    </div>
  );
}
