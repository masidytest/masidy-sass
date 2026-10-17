export type ServiceHealth = { name: string; status: "HEALTHY" | "UNHEALTHY" | "UNKNOWN" };
export type ReplicaNode = { ref: string; region: string; status: string };
export type InfraData = {
  name: string; region: string; status: string; compute: string;
  ref: string; readReplicas: ReplicaNode[] | null; health: ServiceHealth[];
};
export type DbStats = { cpuLoad: number | null; disk: number | null; ram: number | null; connections: string | null };
export type BranchInfo = { id: string; name: string; status: string; created_at: string };
export type BackupInfo = { id: string; status: string; created_at: string; size_bytes?: number };
export type MetricBucket = { ts: string; ok: number; warn: number; error: number };
export type ServiceMetrics = {
  service: string; total: number; warnings: number; errors: number; buckets: MetricBucket[];
};
export type AdvisorIssue = { title: string; severity: "ERROR" | "WARN" | "INFO"; description: string };
export type DashboardLayout = { widgets: string[] };
