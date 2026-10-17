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
- Billing: Stripe Checkout for monthly plans and domain registration; domain renewals are billed annually at Vercel's renewal price plus 20%.
- Edge Functions: single-file TypeScript functions can be deployed through the Supabase Management API; multi-file functions and dependency bundles use the Supabase CLI.
- Compute: the dashboard reads Supabase compute add-on choices/prices and can request a change; the selected provider tier may add charges.
- Backups: daily backup metadata is provider-reported. PITR restore is available only when Supabase reports it enabled and is restricted to the project owner with explicit confirmation.
- Database: read-only SQL is bounded; direct SQL changes are owner-only and are not versioned as migrations.
- Realtime: the console can subscribe to Postgres changes for a public table when it is enabled in the `supabase_realtime` publication and visible under its RLS policies.
- Integrations: status cards perform read-only API checks. A successful check validates only that endpoint, not every write permission used by the product.

## Setup
1. On a new control-plane database, run supabase/schema.sql. On an existing database, apply supabase/migrations/20261017_stripe_billing.sql and then supabase/migrations/20261017_paid_plan_tiers.sql. Enable the Auth providers you want.
2. Set the values from .env.example in .env.local and in your deployment environment. Keep Stripe secret and webhook keys server-side; `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is safe to expose.
3. In Stripe, register `https://masidy.com/api/webhooks/stripe` as a webhook endpoint and enable `checkout.session.completed`, `checkout.session.expired`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, and `invoice.payment_failed`. Set its signing secret as `STRIPE_WEBHOOK_SECRET`. `STRIPE_WEBHOOK_URL` documents the endpoint URL; it is not the signing secret.
4. Configure the Stripe Billing Portal in the Stripe Dashboard. The plans page opens Checkout and the Billing Portal.
5. In Vercel: add `*.masidy.app` to the gateway project (needs Vercel nameservers), create a Blob store, and set the env vars.
   The Vercel token must be authorized for the gateway project/team and for the registrar operations you use. Supabase Management token permissions must cover each enabled project operation; provider `401/403` responses are shown as permission failures.
6. Run `npm install && npm run dev`, then deploy.

## Billing notes
- Monthly organization plans are Starter ($5, 1 project), Balance ($10, 5 projects), and Pro ($25, 25 projects). Project limits are enforced server-side. Organizations must subscribe before provisioning projects; the `free` plan remains only as an unprovisioned account state and for legacy data.
- Domain prices are quoted in USD with a 20% Masidy markup. A successful Stripe payment triggers the Vercel registration and a Stripe annual subscription, with the first renewal one year later. Vercel registration is not attempted before Stripe confirms payment.
- The annual Stripe subscription renews the customer first; `invoice.paid` then calls Vercel's registrar renewal endpoint. A registrar failure is recorded for manual follow-up; check the domain orders panel. Confirm your Vercel registrar account supports renewal for each purchased TLD.
- Stripe is optional for building locally, but billing routes return an error until `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are configured. Restricted Stripe keys must grant the API permissions used for Checkout, customers, products, subscriptions, payment intents, and billing portal sessions.
- Set `NEXT_PUBLIC_APP_URL` to the site origin (for example `https://masidy.com`), not to the webhook path. `STRIPE_WEBHOOK_URL` is the full webhook endpoint.

## Before launch (not done yet)
- Verify live Vercel registrar support and contact requirements for each domain TLD you offer.
- Usage metering (database size, egress, storage) for the Overview tiles.
- Wildcard SSL and the proxy path need a real load test; rate limits apply on both vendors' APIs.
- Poll or webhook project status from provisioning to active.
- Audit log, abuse limits, and backups for the control-plane database.
