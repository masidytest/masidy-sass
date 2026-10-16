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
export const env = schema.parse(process.env);
