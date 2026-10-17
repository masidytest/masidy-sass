import { requireProject, fail } from "@/lib/auth";
import { supabaseManagementRequest } from "@/lib/supabase-mgmt";

type LogRow = {
  timestamp?: string;
  source_name?: string;
  event_message?: string;
  method?: string;
  path?: string;
  status_code?: string | number;
};

const windows: Record<string, number> = { "15m": 15, "60m": 60, "3h": 180, "24h": 1440 };

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { project } = await requireProject((await params).id, ["owner", "admin", "developer", "read_only"]);
    if (!project.supabase_ref) return Response.json({ error: "Project is still provisioning" }, { status: 409 });
    const requestedWindow = new URL(req.url).searchParams.get("window") ?? "60m";
    const minutes = windows[requestedWindow];
    if (!minutes) return Response.json({ error: "Unsupported log time window" }, { status: 400 });

    const end = new Date();
    const start = new Date(end.getTime() - minutes * 60_000);
    const sql = `SELECT timestamp, source AS source_name, event_message,
       log_attributes['request.method'] AS method,
       log_attributes['request.path'] AS path,
       log_attributes['response.status_code'] AS status_code
       FROM logs ORDER BY timestamp DESC LIMIT 200`;
    const query = new URLSearchParams({
      sql,
      iso_timestamp_start: start.toISOString(),
      iso_timestamp_end: end.toISOString(),
    });
    const result = await supabaseManagementRequest<{ result?: LogRow[]; error?: string }>(
      `/projects/${encodeURIComponent(project.supabase_ref)}/analytics/endpoints/logs?${query}`,
    );
    if (result.error) return Response.json({ error: result.error }, { status: 502 });
    if (!Array.isArray(result.result)) {
      return Response.json({ error: "Project logs returned an unexpected response" }, { status: 502 });
    }
    return Response.json({ logs: result.result, window: requestedWindow });
  } catch (e) { return fail(e); }
}
