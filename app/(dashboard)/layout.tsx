import { redirect } from "next/navigation";
import { userClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let email = "";
  let name = "You";

  try {
    const supabase = await userClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) redirect("/sign-in");

    email = data.user.email ?? "";
    name =
      (data.user.user_metadata?.full_name as string | undefined) ??
      (data.user.user_metadata?.name as string | undefined) ??
      email.split("@")[0] ??
      "You";
  } catch {
    // Placeholder credentials or network error — send to sign-in.
    redirect("/sign-in");
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0e0e0f", color: "#f4f4f5" }}>
      <Sidebar userName={name} userEmail={email} projectName="My Project" plan="FREE" />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {children}
      </div>
    </div>
  );
}
