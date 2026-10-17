import { requireProject, fail } from "@/lib/auth";
import { env } from "@/lib/env";

type ServiceMetric = {
  name: string;
  requests: number;
  warnings: number;
  errors: number;
  bars: number[];
};

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { project } = await requireProject((await params).id, ["owner", "admin", "developer"]);
    if (!project.supabase_ref) return Response.json({ error: "Still provisioning" }, { status: 409 });

    const window = new URL(req.url).searchParams.get("window") ?? "60m";
    const intervals: Record<string, number> = { "15m": 15, "60m": 60, "3h": 180, "24h": 1440 };
    const minutes = intervals[window] ?? 60;

    const base = "https://api.supabase.com/v1";
    const h = { Authorization: `Bearer ${env.SUPABASE_MGMT_TOKEN}`, "Content-Type": "application/json" };

    const end = new Date();
    const start = new Date(end.getTime() - minutes * 60 * 1000);
    const iso = (d: Date) => d.toISOString();

    const services = ["rest", "auth", "storage", "realtime"];
    const names: Record<string, string> = { rest: "API GATEWAY", auth: "AUTH", storage: "STORAGE", realtime: "REALTIME" };

    // Fetch metrics for each service
    const results = await Promise.allSettled(
      services.map(svc =>
        fetch(`${base}/projects/${project.supabase_ref}/analytics/endpoints/logs.all?service=${svc}&iso_timestamp_start=${iso(start)}&iso_timestamp_end=${iso(end)}`, { headers: h })
          .then(r => r.ok ? r.json() : null)
      )
    );

    // Also fetch postgres metrics
    const pgResult = await fetch(
      `${base}/projects/${project.supabase_ref}/analytics/endpoints/logs.all?service=postgres&iso_timestamp_start=${iso(start)}&iso_timestamp_end=${iso(end)}`,
      { headers: h }
    ).then(r => r.ok ? r.json() : null).catch(() => null);

    const BARS = 20;

    function parseLogs(data: unknown): { requests: number; warnings: number; errors: number; bars: number[] } {
      if (!data || typeof data !== "object" || !("result" in data)) {
        return { requests: 0, warnings: 0, errors: 0, bars: Array(BARS).fill(0) };
      }
      const rows = (data as { result: Array<{ timestamp?: string; status_code?: number }> }).result ?? [];
      const requests = rows.length;
      const errors = rows.filter(r => (r.status_code ?? 0) >= 500).length;
      const warnings = rows.filter(r => (r.status_code ?? 0) >= 400 && (r.status_code ?? 0) < 500).length;

      // Distribute into BARS buckets
      const bars = Array(BARS).fill(0);
      const bucketMs = (minutes * 60 * 1000) / BARS;
      rows.forEach(r => {
        if (!r.timestamp) return;
        const t = new Date(r.timestamp).getTime();
        const idx = Math.min(BARS - 1, Math.floor((t - start.getTime()) / bucketMs));
        if (idx >= 0) bars[idx]++;
      });

      return { requests, warnings, errors, bars };
    }

    const metrics: ServiceMetric[] = [
      { name: "POSTGRES", ...parseLogs(pgResult) },
      ...services.map((svc, i) => ({
        name: names[svc] ?? svc.toUpperCase(),
        ...parseLogs(results[i].status === "fulfilled" ? results[i].value : null),
      })),
    ];

    return Response.json(metrics);
  } catch (e) { return fail(e); }
}
