import { NextResponse, type NextRequest } from "next/server";

// The gateway. https://<slug>.masidy.app (or a customer's own domain) -> that customer's backend.
// This is what makes MASIDY_URL real: customers never see the underlying provider.
//
// NOTE: middleware runs on the Edge runtime. It cannot import lib/env.ts (Node.js crypto).
// The env vars below are accessed directly; they are validated at build time via next.config.ts
// if you add a custom env check, or caught at runtime by the null-guard below.
const BASE = process.env.GATEWAY_BASE_DOMAIN;
if (!BASE) throw new Error("GATEWAY_BASE_DOMAIN is not set");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// In-memory 1-minute TTL cache. One cache entry per unique hostname seen.
const cache = new Map<string, { ref: string | null; at: number }>();

async function resolveRef(host: string): Promise<string | null> {
  const hit = cache.get(host);
  if (hit && Date.now() - hit.at < 60_000) return hit.ref;

  const sub = host.endsWith(`.${BASE}`) ? host.slice(0, -(BASE!.length + 1)) : null;
  const rest = `${SUPABASE_URL}/rest/v1`;
  const hdr = {
    apikey: SERVICE_KEY!,
    Authorization: `Bearer ${SERVICE_KEY}`,
  };

  let ref: string | null = null;
  if (sub) {
    const r = await (
      await fetch(
        `${rest}/projects?select=supabase_ref&status=eq.active&slug=eq.${encodeURIComponent(sub)}`,
        { headers: hdr }
      )
    ).json();
    ref = r?.[0]?.supabase_ref ?? null;
  } else {
    const d = await (
      await fetch(
        `${rest}/project_domains?select=projects(supabase_ref,status)&domain=eq.${encodeURIComponent(host)}`,
        { headers: hdr }
      )
    ).json();
    ref =
      d?.[0]?.projects?.status === "active"
        ? (d[0].projects.supabase_ref ?? null)
        : null;
  }

  cache.set(host, { ref, at: Date.now() });
  return ref;
}

export async function middleware(req: NextRequest) {
  const host = req.headers.get("host")?.split(":")[0] ?? "";

  // Pass through: the control-plane UI itself, local dev, and Vercel preview URLs.
  if (
    host === BASE ||
    host === `app.${BASE}` ||
    host.endsWith(".vercel.app") ||
    host === "localhost"
  ) {
    return NextResponse.next();
  }

  const ref = await resolveRef(host);
  if (!ref) return NextResponse.json({ error: "Unknown project" }, { status: 404 });

  return NextResponse.rewrite(
    new URL(req.nextUrl.pathname + req.nextUrl.search, `https://${ref}.supabase.co`)
  );
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
