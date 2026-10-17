alter table public.orgs
  add column if not exists stripe_customer_id text unique,
  add column if not exists stripe_subscription_id text unique;

create table if not exists public.domain_orders (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects on delete cascade,
  domain text not null,
  contact_information jsonb not null,
  purchase_amount_cents integer not null check (purchase_amount_cents > 0),
  renewal_amount_cents integer not null check (renewal_amount_cents > 0),
  expected_purchase_price numeric not null check (expected_purchase_price > 0),
  expected_renewal_price numeric not null check (expected_renewal_price > 0),
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  stripe_subscription_id text unique,
  vercel_order_id text,
  status text not null default 'pending_payment'
    check (status in ('pending_payment','processing','registered','renewal_failed','renewal_cancelled','fulfillment_failed','checkout_expired')),
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.domain_orders drop constraint if exists domain_orders_domain_key;
create unique index if not exists domain_orders_domain_key on public.domain_orders(domain) where status <> 'checkout_expired';
alter table public.domain_orders enable row level security;

create table if not exists public.domain_renewals (
  id uuid primary key default gen_random_uuid(),
  domain_order_id uuid not null references public.domain_orders on delete cascade,
  stripe_invoice_id text not null unique,
  status text not null default 'processing' check (status in ('processing','renewed','failed')),
  vercel_order_id text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.domain_renewals enable row level security;
