import { Vercel } from "@vercel/sdk";
import { env } from "./env";

export const vercel = new Vercel({ bearerToken: env.VERCEL_TOKEN });
const base = "https://api.vercel.com";
const q = `teamId=${env.VERCEL_TEAM_ID}`;
const h = { Authorization: `Bearer ${env.VERCEL_TOKEN}`, "Content-Type": "application/json" };

// Registrar API pricing is returned in USD.
export async function domainPrice(domain: string) {
  const encoded = encodeURIComponent(domain);
  const [priceResponse, availabilityResponse] = await Promise.all([
    fetch(`${base}/v1/registrar/domains/${encoded}/price?${q}`, { headers: h }),
    fetch(`${base}/v1/registrar/domains/${encoded}/availability?${q}`, { headers: h }),
  ]);
  if (!priceResponse.ok) throw new Error(`price lookup failed: ${priceResponse.status}`);
  if (!availabilityResponse.ok) throw new Error(`availability lookup failed: ${availabilityResponse.status}`);
  const price = await priceResponse.json() as {
    purchasePrice: number | string;
    renewalPrice: number | string;
    years: number;
  };
  const availability = await availabilityResponse.json() as { available: boolean };
  return { ...price, available: availability.available };
}

export type DomainContact = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  companyName?: string;
  fax?: string;
};

// Vercel's registrar charges Masidy; call only after the customer's Stripe payment succeeds.
export async function buyDomain(domain: string, expectedPrice: number, contact: DomainContact) {
  const r = await fetch(`${base}/v1/registrar/domains/${encodeURIComponent(domain)}/buy?${q}`, {
    method: "POST",
    headers: h,
    body: JSON.stringify({ autoRenew: false, years: 1, expectedPrice, contactInformation: contact }),
  });
  if (!r.ok) throw new Error(`purchase failed: ${r.status}`);
  return r.json() as Promise<{ orderId: string }>;
}

export async function renewDomain(domain: string, expectedPrice: number, contact: DomainContact) {
  const r = await fetch(`${base}/v1/registrar/domains/${encodeURIComponent(domain)}/renew?${q}`, {
    method: "POST",
    headers: h,
    body: JSON.stringify({ years: 1, expectedPrice, contactInformation: contact }),
  });
  if (!r.ok) throw new Error(`renewal failed: ${r.status}`);
  return r.json() as Promise<{ orderId: string }>;
}
// Attach a hostname to the gateway project, so https://api.customer.com reaches the customer's backend.
export const attachGatewayDomain = (name: string) =>
  vercel.projects.addProjectDomain({ idOrName: env.VERCEL_GATEWAY_PROJECT_ID, teamId: env.VERCEL_TEAM_ID, requestBody: { name } });
