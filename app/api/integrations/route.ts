import { requireUser, fail } from "@/lib/auth";

type IntegrationStatus = "connected" | "not_configured" | "permission_error" | "unavailable";

async function probe(configured: boolean, url: string | null, token: string | null, extraHeaders: HeadersInit = {}): Promise<IntegrationStatus> {
  if (!configured || !url || !token) return "not_configured";
  try {
    const headers = new Headers(extraHeaders);
    headers.set("Authorization", `Bearer ${token}`);
    const response = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (response.ok) return "connected";
    if (response.status === 401 || response.status === 403) return "permission_error";
    return "unavailable";
  } catch {
    return "unavailable";
  }
}

export async function GET() {
  try {
    await requireUser();
    const supabaseToken = process.env.SUPABASE_MGMT_TOKEN;
    const supabaseOrg = process.env.SUPABASE_ORG_ID;
    const vercelToken = process.env.VERCEL_TOKEN;
    const vercelTeam = process.env.VERCEL_TEAM_ID;
    const vercelProject = process.env.VERCEL_GATEWAY_PROJECT_ID;
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const resendKey = process.env.RESEND_API_KEY;
    const githubToken = process.env.GITHUB_TOKEN;
    const cloudflareToken = process.env.CLOUDFLARE_API_TOKEN;
    const sentryToken = process.env.SENTRY_AUTH_TOKEN;
    const teamQuery = vercelTeam ? `?teamId=${encodeURIComponent(vercelTeam)}` : "";

    const [supabase, vercel, stripe, resend, github, cloudflare, sentry] = await Promise.all([
      probe(Boolean(supabaseToken && supabaseOrg), "https://api.supabase.com/v1/projects", supabaseToken ?? null),
      probe(Boolean(vercelToken && vercelTeam && vercelProject),
        vercelProject ? `https://api.vercel.com/v9/projects/${encodeURIComponent(vercelProject)}${teamQuery}` : null,
        vercelToken ?? null),
      probe(Boolean(stripeKey), stripeKey ? "https://api.stripe.com/v1/prices?limit=1" : null, stripeKey ?? null),
      probe(Boolean(resendKey), "https://api.resend.com/domains", resendKey ?? null),
      probe(Boolean(githubToken), githubToken ? "https://api.github.com/user" : null, githubToken ?? null, {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      }),
      probe(Boolean(cloudflareToken), cloudflareToken ? "https://api.cloudflare.com/client/v4/user/tokens/verify" : null, cloudflareToken ?? null),
      probe(Boolean(sentryToken), sentryToken ? "https://sentry.io/api/0/organizations/" : null, sentryToken ?? null),
    ]);

    return Response.json({
      supabase,
      vercel,
      stripe,
      resend,
      github,
      cloudflare,
      sentry,
    });
  } catch (e) { return fail(e); }
}
