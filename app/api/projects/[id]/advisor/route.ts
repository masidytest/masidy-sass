import { requireProject, fail } from "@/lib/auth";
import { supabaseManagementRequest } from "@/lib/supabase-mgmt";

type AdvisorLint = {
  name?: string;
  title?: string;
  level?: string;
  description?: string;
  detail?: string;
  remediation?: string;
};
type AdvisorResponse = { lints?: AdvisorLint[] };

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { project } = await requireProject((await params).id, ["owner", "admin", "developer"]);
    if (!project.supabase_ref) return Response.json({ error: "Still provisioning" }, { status: 409 });

    const ref = encodeURIComponent(project.supabase_ref);
    const [security, performance] = await Promise.all([
      supabaseManagementRequest<AdvisorResponse>(`/projects/${ref}/advisors/security`),
      supabaseManagementRequest<AdvisorResponse>(`/projects/${ref}/advisors/performance`),
    ]);
    const lints = [...(security.lints ?? []), ...(performance.lints ?? [])];
    return Response.json(lints.map(lint => {
      const level = (lint.level ?? "WARN").toUpperCase();
      const severity = level === "ERROR" || level === "WARN" || level === "INFO"
        ? level
        : level === "WARNING" ? "WARN" : "INFO";
      const description = [lint.detail ?? lint.description, lint.remediation && `Recommended action: ${lint.remediation}`]
        .filter(Boolean).join("\n\n");
      return { title: lint.title ?? lint.name ?? "Project finding", severity, description };
    }));
  } catch (e) { return fail(e); }
}
