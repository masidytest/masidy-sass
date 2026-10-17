import { HttpError, requireProject, fail } from "@/lib/auth";
import { supabaseManagementRequest } from "@/lib/supabase-mgmt";

type MetricRow = {
  source_name: string;
  bucket: string;
  requests: number | string;
  warnings: number | string;
  errors: number | string;
};
type ServiceMetric = { name: string; requests: number; warnings: number; errors: number; bars: number[] };

const windows: Record<string, number> = { "15m": 15, "60m": 60, "3h": 180, "24h": 1440 };

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { project } = await requireProject((await params).id, ["owner", "admin", "developer"]);
    if (!project.supabase_ref) return Response.json({ error: "Project is still provisioning" }, { status: 409 });
    const requestedWindow = new URL(req.url).searchParams.get("window") ?? "60m";
    const minutes = windows[requestedWindow];
    if (!minutes) return Response.json({ error: "Unsupported metrics time window" }, { status: 400 });
    const end = new Date();
    const start = new Date(end.getTime() - minutes * 60_000);
    const seconds = Math.max(1, Math.ceil((minutes * 60) / 20));
    const sql = `SELECT source AS source_name,
       toStartOfInterval(timestamp, INTERVAL ${seconds} SECOND) AS bucket,
       count() AS requests,
       countIf(toInt32OrZero(log_attributes['response.status_code']) >= 400 AND toInt32OrZero(log_attributes['response.status_code']) < 500) AS warnings,
       countIf(toInt32OrZero(log_attributes['response.status_code']) >= 500) AS errors
       FROM logs
       GROUP BY source, bucket
       ORDER BY bucket ASC
       LIMIT 2000`;
    const query = new URLSearchParams({
      sql,
      iso_timestamp_start: start.toISOString(),
      iso_timestamp_end: end.toISOString(),
    });
    const result = await supabaseManagementRequest<{ result?: MetricRow[]; error?: string }>(
      `/projects/${encodeURIComponent(project.supabase_ref)}/analytics/endpoints/logs?${query}`,
    );
    if (result.error) return Response.json({ error: result.error }, { status: 502 });
    if (!Array.isArray(result.result)) {
      return Response.json({ error: "Project metrics returned an unexpected response" }, { status: 502 });
    }

    const grouped = new Map<string, ServiceMetric>();
    for (const row of result.result) {
      if (typeof row.source_name !== "string" || !row.source_name || typeof row.bucket !== "string") {
        throw new HttpError(502, "Project metrics returned an invalid row");
      }
      const source = row.source_name;
      const metric = grouped.get(source) ?? { name: source.replace(/_logs$/, "").replaceAll("_", " ").toUpperCase(), requests: 0, warnings: 0, errors: 0, bars: Array(20).fill(0) };
      const bucketMs = new Date(row.bucket).getTime();
      if (!Number.isFinite(bucketMs)) throw new HttpError(502, "Project metrics returned an invalid time bucket");
      const index = Math.max(0, Math.min(19, Math.floor((bucketMs - start.getTime()) / (seconds * 1000))));
      const requests = parseCount(row.requests);
      metric.requests += requests;
      metric.warnings += parseCount(row.warnings);
      metric.errors += parseCount(row.errors);
      metric.bars[index] += requests;
      grouped.set(source, metric);
    }
    return Response.json([...grouped.values()]);
  } catch (e) { return fail(e); }
}

function parseCount(value: unknown): number {
  const count = typeof value === "number" || (typeof value === "string" && value.trim() !== "")
    ? Number(value)
    : Number.NaN;
  if (!Number.isFinite(count) || count < 0) throw new HttpError(502, "Project metrics returned an invalid count");
  return count;
}
