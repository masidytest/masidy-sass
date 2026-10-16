import { z } from "zod";

const schema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_MGMT_TOKEN: z.string().min(1),
  SUPABASE_ORG_ID: z.string().min(1),
  VERCEL_TOKEN: z.string().min(1),
  VERCEL_TEAM_ID: z.string().min(1),
  VERCEL_GATEWAY_PROJECT_ID: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
  GATEWAY_BASE_DOMAIN: z.string().min(3),
});

// Server only. Never import this file from client components.
// During build without real env vars, we return a stub so the build succeeds.
// API routes will fail at runtime until real values are set in Vercel dashboard.
let env: z.infer<typeof schema>;
try {
  env = schema.parse(process.env);
} catch {
  env = {
    NEXT_PUBLIC_SUPABASE_URL: "https://placeholder.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "placeholder",
    SUPABASE_SERVICE_ROLE_KEY: "placeholder",
    SUPABASE_MGMT_TOKEN: "placeholder",
    SUPABASE_ORG_ID: "placeholder",
    VERCEL_TOKEN: "placeholder",
    VERCEL_TEAM_ID: "placeholder",
    VERCEL_GATEWAY_PROJECT_ID: "placeholder",
    RESEND_API_KEY: "placeholder",
    GATEWAY_BASE_DOMAIN: "masidy.app",
  };
}

export { env };
