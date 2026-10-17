import { Vercel } from "@vercel/sdk";
import { env } from "./env";

export const vercel = new Vercel({ bearerToken: env.VERCEL_TOKEN });
const base = "https://api.vercel.com";
const q = `teamId=${env.VERCEL_TEAM_ID}`;
const h = { Authorization: `Bearer ${env.VERCEL_TOKEN}`, "Content-Type": "application/json" };

type DomainSearchResult = {
  domain: string;
  available: boolean;
  years?: number;
  price?: number | string;
  renewalPrice?: number | string;
};

type DomainQuote =
  | { available: false; purchasePrice: null; renewalPrice: null; years: number }
  | { available: true; purchasePrice: number | string; renewalPrice: number | string; years: number };

// Vercel's domain search API returns availability and USD prices without authentication.
export async function domainPrice(domain: string): Promise<DomainQuote> {
  const response = await fetch(`${base}/v1/registrar/domains/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ domains: [domain] }),
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`domain search failed: ${response.status}`);
  const data = await response.json() as { results?: DomainSearchResult[] };
  const result = data.results?.find(item => item.domain.toLowerCase() === domain.toLowerCase());
  if (!result || typeof result.available !== "boolean") {
    throw new Error("Vercel returned an unexpected domain search response");
  }
  if (!result.available) {
    return { available: false, purchasePrice: null, renewalPrice: null, years: result.years ?? 1 };
  }
  if (result.price === undefined || result.renewalPrice === undefined) {
    throw new Error("Vercel did not return domain pricing");
  }
  return {
    available: true,
    purchasePrice: result.price,
    renewalPrice: result.renewalPrice,
    years: result.years ?? 1,
  };
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

export async function gatewayDomainStatus(domain: string) {
  const [projectDomain, config] = await Promise.all([
    vercel.projects.getProjectDomain({
      idOrName: env.VERCEL_GATEWAY_PROJECT_ID,
      domain,
      teamId: env.VERCEL_TEAM_ID,
    }),
    vercel.domains.getDomainConfig({ domain, teamId: env.VERCEL_TEAM_ID }),
  ]);
  const projectHost = `${projectDomain.name}.${env.GATEWAY_BASE_DOMAIN}`;
  const isApex = projectDomain.name.toLowerCase() === projectDomain.apexName.toLowerCase();
  const record = isApex
    ? { type: "A", name: "@", value: "76.76.21.21" }
    : { type: "CNAME", name: projectDomain.name.slice(0, -(projectDomain.apexName.length + 1)), value: projectHost };
  return {
    active: projectDomain.verified && !config.misconfigured,
    dnsConfigured: !config.misconfigured,
    record,
  };
}
