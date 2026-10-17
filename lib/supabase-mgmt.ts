import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

const base = "https://api.supabase.com/v1";
const headers = { Authorization: `Bearer ${env.SUPABASE_MGMT_TOKEN}` };

export async function supabaseManagementRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const requestHeaders = new Headers(headers);
  if (init.body && !(typeof FormData !== "undefined" && init.body instanceof FormData)) {
    requestHeaders.set("Content-Type", "application/json");
  }
  new Headers(init.headers).forEach((value, key) => requestHeaders.set(key, value));
  const response = await fetch(`${base}${path}`, {
    ...init,
    headers: requestHeaders,
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Supabase Management API request failed (${response.status}): ${detail.slice(0, 400)}`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function queryCustomerDatabase<T = Record<string, unknown>>(
  ref: string,
  query: string,
  readOnly = true,
): Promise<T[]> {
  const result = await supabaseManagementRequest<unknown>(
    `/projects/${encodeURIComponent(ref)}/database/query${readOnly ? "/read-only" : ""}`,
    {
    method: "POST",
    body: JSON.stringify({ query }),
    },
  );
  if (Array.isArray(result)) return result as T[];
  if (result == null) return [];
  if (result && typeof result === "object") {
    const payload = result as { result?: unknown; data?: unknown };
    const rows = payload.result ?? payload.data;
    if (Array.isArray(rows)) return rows as T[];
    if (payload.result === null || payload.data === null) return [];
  }
  throw new Error("Supabase returned an unexpected database query response");
}

export async function projectAdminKey(ref: string) {
  const keys = await supabaseManagementRequest<{ name: string; api_key: string }[]>(
    `/projects/${encodeURIComponent(ref)}/api-keys`,
  );
  const key = keys.find(item => item.name === "secret") ?? keys.find(item => item.name === "service_role");
  if (!key) throw new Error("Customer project server key is unavailable");
  return key.api_key;
}

export async function customerProjectAdmin(ref: string) {
  const key = await projectAdminKey(ref);
  return createClient(`https://${encodeURIComponent(ref)}.supabase.co`, key, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
}

export async function createCustomerProject(name: string, region: string) {
  return supabaseManagementRequest<{ id: string; status?: string }>("/projects", {
    method: "POST",
    body: JSON.stringify({ name, organization_id: env.SUPABASE_ORG_ID, region, db_pass: randomBytes(24).toString("hex") }),
  });
}
export async function projectStatus(ref: string) {
  return supabaseManagementRequest<{ status: string }>(`/projects/${encodeURIComponent(ref)}`);
}
// Fetched on demand and never stored, so a leak of your database does not leak customer keys.
export async function apiKeys(ref: string) {
  return supabaseManagementRequest<{ name: string; api_key: string }[]>(
    `/projects/${encodeURIComponent(ref)}/api-keys`,
  );
}
