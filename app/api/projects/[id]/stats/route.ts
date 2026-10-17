import { requireProject, fail } from "@/lib/auth";
import { projectAdminKey } from "@/lib/supabase-mgmt";

type MetricSample = { labels: Record<string, string>; value: number };

function metricSamples(text: string, name: string): MetricSample[] {
  const samples: MetricSample[] = [];
  for (const line of text.split(/\r?\n/)) {
    const match = /^([a-zA-Z_:][a-zA-Z0-9_:]*)(?:\{([^}]*)\})?\s+([-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?)(?:\s+\d+)?$/.exec(line);
    if (!match || match[1] !== name) continue;
    const labels: Record<string, string> = {};
    for (const label of match[2]?.matchAll(/([a-zA-Z_][a-zA-Z0-9_]*)="((?:\\.|[^"\\])*)"/g) ?? []) {
      labels[label[1]] = label[2].replace(/\\(.)/g, "$1");
    }
    const value = Number(match[3]);
    if (Number.isFinite(value)) samples.push({ labels, value });
  }
  return samples.filter(sample => sample.labels.service_type === "db");
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { project } = await requireProject((await params).id, ["owner", "admin", "developer"]);
    if (!project.supabase_ref) return Response.json({ error: "Project is still provisioning" }, { status: 409 });
    const key = await projectAdminKey(project.supabase_ref);
    const authorization = Buffer.from(`username:${key}`).toString("base64");
    const response = await fetch(
      `https://${encodeURIComponent(project.supabase_ref)}.supabase.co/customer/v1/privileged/metrics`,
      {
        headers: { Authorization: `Basic ${authorization}` },
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      },
    );
    if (!response.ok) throw new Error(`Project metrics request failed (${response.status})`);
    const text = await response.text();
    if (text.length > 5_000_000) throw new Error("Project metrics response exceeded the supported size");

    const load15 = metricSamples(text, "node_load15")[0]?.value ?? null;
    const totalMemory = metricSamples(text, "node_memory_MemTotal_bytes")[0]?.value ?? null;
    const availableMemory = metricSamples(text, "node_memory_MemAvailable_bytes")[0]?.value ?? null;
    const filesystemSizes = metricSamples(text, "node_filesystem_size_bytes");
    const filesystemAvailable = metricSamples(text, "node_filesystem_avail_bytes");
    const dataFilesystem = filesystemSizes.find(sample => sample.labels.mountpoint === "/data")
      ?? filesystemSizes.find(sample => sample.labels.mountpoint === "/");
    const availableOnFilesystem = dataFilesystem
      ? filesystemAvailable.find(sample =>
        sample.labels.device === dataFilesystem.labels.device
        && sample.labels.mountpoint === dataFilesystem.labels.mountpoint,
      )?.value
      : undefined;
    const activeConnections = metricSamples(text, "pgbouncer_pools_client_active_connections")
      .reduce((sum, sample) => sum + sample.value, 0);
    const maxConnections = metricSamples(text, "pgbouncer_config_max_client_connections")[0]?.value;
    const ram = totalMemory && availableMemory !== null
      ? Math.round(((totalMemory - availableMemory) / totalMemory) * 1000) / 10
      : null;
    const disk = dataFilesystem && availableOnFilesystem !== undefined && dataFilesystem.value > 0
      ? Math.round(((dataFilesystem.value - availableOnFilesystem) / dataFilesystem.value) * 1000) / 10
      : null;
    return Response.json({
      cpuLoad: load15,
      disk,
      ram,
      connections: maxConnections === undefined ? null : `${activeConnections}/${maxConnections}`,
    });
  } catch (e) { return fail(e); }
}
