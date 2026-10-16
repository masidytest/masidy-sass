# Masidy control plane

Multi-tenant reseller backend for the Masidy dashboard: orgs and roles, one backend per customer project,
a gateway URL per project, custom domains, file uploads, and sending-domain setup.

## How it fits together
- Your Supabase project holds orgs, members, projects (supabase/schema.sql). Browser reads obey RLS; all writes go through server routes.
- Creating a project calls the Supabase Management API in a dedicated reseller org, so each customer gets an isolated database.
- middleware.ts is the gateway: `<slug>.masidy.app` and custom domains rewrite to that customer's backend.
- Domains: Vercel Registrar API for price and purchase, Vercel SDK to attach hostnames to the gateway project.
- Storage: Vercel Blob client uploads, one path prefix per project.
- Email: Resend domain creation returns the DNS records to show in the Email page.

## Setup
1. Run supabase/schema.sql. Enable Auth providers you want.
2. Copy .env.example to .env.local and fill it in. All secrets stay server side.
3. In Vercel: add `*.masidy.app` to the gateway project (needs Vercel nameservers), create a Blob store, set the env vars.
4. `npm i && npm run dev`, then deploy.

## Before launch (not done yet)
- Confirm Supabase create-project field names and the Vercel domain-buy contact fields against current API docs.
- Billing: add Stripe, update orgs.plan from its webhooks; MAX_PROJECTS is a placeholder.
- Usage metering (database size, egress, storage) for the Overview tiles.
- Wildcard SSL and the proxy path need a real load test; rate limits apply on both vendors' APIs.
- Poll or webhook project status from provisioning to active.
- Audit log, abuse limits, and backups for the control-plane database.
