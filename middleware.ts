import { NextResponse, type NextRequest } from "next/server";

// The gateway. https://<slug>.masidy.app (or a customer's own domain) -> that customer's backend.
// NOTE: middleware runs on the Edge runtime — cannot import lib/env.ts (Node.js crypto).

const BASE = process.env.GATEWAY_BASE_DOMAIN || "masidy.app";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// In-memory 1-minute TTL cache per hostname.
const cache = new Map<string, { ref: string | null; at: number }>();

async function resolveRef(host: string): Promise<string | null> {
  // If credentials aren't configured yet, skip gateway lookup.
  if (!SUPABASE_URL || !SERVICE_KEY || SERVICE_KEY === "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder") {
    return null;
  }

  const hit = cache.get(host);
  if (hit && Date.now() - hit.at < 60_000) return hit.ref;

  const sub = host.endsWith(`.${BASE}`) ? host.slice(0, -(BASE.length + 1)) : null;
  const rest = `${SUPABASE_URL}/rest/v1`;
  const hdr = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` };

  let ref: string | null = null;
  try {
    if (sub) {
      const r = await (
        await fetch(`${rest}/projects?select=supabase_ref&status=eq.active&slug=eq.${encodeURIComponent(sub)}`, { headers: hdr })
      ).json();
      ref = r?.[0]?.supabase_ref ?? null;
    } else {
      const d = await (
        await fetch(`${rest}/project_domains?select=projects(supabase_ref,status)&domain=eq.${encodeURIComponent(host)}`, { headers: hdr })
      ).json();
      ref = d?.[0]?.projects?.status === "active" ? (d[0].projects.supabase_ref ?? null) : null;
    }
  } catch {
    // Network error — treat as unknown project.
    ref = null;
  }

  cache.set(host, { ref, at: Date.now() });
  return ref;
}

export async function middleware(req: NextRequest) {
  const host = req.headers.get("host")?.split(":")[0] ?? "";

  // Always pass through: control-plane domain, local dev, Vercel preview URLs.
  if (
    host === BASE ||
    host === `app.${BASE}` ||
    host.endsWith(".vercel.app") ||
    host === "localhost" ||
    host.startsWith("127.") ||
    host === ""
  ) {
    return NextResponse.next();
  }

  const ref = await resolveRef(host);
  if (!ref) return NextResponse.next(); // Unknown host — let Next.js handle it (shows 404 page)

  return NextResponse.rewrite(
    new URL(req.nextUrl.pathname + req.nextUrl.search, `https://${ref}.supabase.co`)
  );
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
