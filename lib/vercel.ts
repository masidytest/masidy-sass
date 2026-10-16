import { Vercel } from "@vercel/sdk";
import { env } from "./env";

export const vercel = new Vercel({ bearerToken: env.VERCEL_TOKEN });
const base = "https://api.vercel.com";
const q = `teamId=${env.VERCEL_TEAM_ID}`;
const h = { Authorization: `Bearer ${env.VERCEL_TOKEN}`, "Content-Type": "application/json" };

// Registrar API: price and availability for one domain.
export async function domainPrice(domain: string) {
  const r = await fetch(`${base}/v1/registrar/domains/${encodeURIComponent(domain)}/price?${q}`, { headers: h });
  if (!r.ok) throw new Error(`price lookup failed: ${r.status}`);
  return r.json() as Promise<{ purchasePrice?: number | string; [k: string]: unknown }>;
}
// Real money. Pass the price the customer saw; Vercel rejects the order if it no longer matches.
// TODO: the buy call also needs registrant contact details. Add them from the Registrar API reference.
export async function buyDomain(domain: string, expectedPrice: number, contact: Record<string, unknown>) {
  const r = await fetch(`${base}/v1/registrar/domains/${encodeURIComponent(domain)}/buy?${q}`, {
    method: "POST", headers: h, body: JSON.stringify({ expectedPrice, ...contact }),
  });
  if (!r.ok) throw new Error(`purchase failed: ${r.status}`);
  return r.json();
}
// Attach a hostname to the gateway project, so https://api.customer.com reaches the customer's backend.
export const attachGatewayDomain = (name: string) =>
  vercel.projects.addProjectDomain({ idOrName: env.VERCEL_GATEWAY_PROJECT_ID, teamId: env.VERCEL_TEAM_ID, requestBody: { name } });
