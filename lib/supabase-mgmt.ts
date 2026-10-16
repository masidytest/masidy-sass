import { randomBytes } from "node:crypto";
import { env } from "./env";

const base = "https://api.supabase.com/v1";
const h = { Authorization: `Bearer ${env.SUPABASE_MGMT_TOKEN}`, "Content-Type": "application/json" };

// TODO: confirm field names against the current Management API OpenAPI spec before launch
// (newer versions may expect organization_slug instead of organization_id).
export async function createCustomerProject(name: string, region: string) {
  const r = await fetch(`${base}/projects`, {
    method: "POST", headers: h,
    body: JSON.stringify({ name, organization_id: env.SUPABASE_ORG_ID, region, db_pass: randomBytes(24).toString("hex") }),
  });
  if (!r.ok) throw new Error(`create project failed: ${r.status}`);
  return (await r.json()) as { id: string; status?: string };
}
export async function projectStatus(ref: string) {
  const r = await fetch(`${base}/projects/${ref}`, { headers: h });
  if (!r.ok) throw new Error(`status failed: ${r.status}`);
  return (await r.json()) as { status: string };
}
// Fetched on demand and never stored, so a leak of your database does not leak customer keys.
export async function apiKeys(ref: string) {
  const r = await fetch(`${base}/projects/${ref}/api-keys`, { headers: h });
  if (!r.ok) throw new Error(`keys failed: ${r.status}`);
  return (await r.json()) as { name: string; api_key: string }[];
}
