-- Control-plane schema. Run in YOUR Supabase project (SQL editor or migration).
create table orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  plan text not null default 'free' check (plan in ('free','starter','balance','pro','team')),
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  created_at timestamptz not null default now()
);
alter table orgs add column if not exists stripe_customer_id text unique;
alter table orgs add column if not exists stripe_subscription_id text unique;
create table org_members (
  org_id uuid not null references orgs on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  role text not null check (role in ('owner','admin','developer','read_only')),
  primary key (org_id, user_id)
);
create table projects (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs on delete cascade,
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,38}$'),
  region text not null,
  supabase_ref text unique,
  status text not null default 'provisioning' check (status in ('provisioning','active','failed','paused')),
  created_at timestamptz not null default now()
);
create table project_domains (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects on delete cascade,
  domain text not null,
  kind text not null check (kind in ('bought','connected')),
  status text not null default 'pending',
  order_id text,
  created_at timestamptz not null default now()
);
create table email_domains (
  project_id uuid primary key references projects on delete cascade,
  domain text not null,
  resend_domain_id text not null,
  status text not null default 'not_started'
);

-- Checkout and renewal data is only accessed by trusted server routes/webhooks.
create table if not exists domain_orders (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects on delete cascade,
  domain text not null unique,
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
create unique index if not exists domain_orders_domain_key on domain_orders(domain) where status <> 'checkout_expired';
alter table domain_orders enable row level security;
create table if not exists domain_renewals (
  id uuid primary key default gen_random_uuid(),
  domain_order_id uuid not null references domain_orders on delete cascade,
  stripe_invoice_id text not null unique,
  status text not null default 'processing' check (status in ('processing','renewed','failed')),
  vercel_order_id text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table domain_renewals enable row level security;

create function is_member(p_org uuid, p_roles text[]) returns boolean
language sql security definer set search_path = public stable as $$
  select exists (select 1 from org_members where org_id = p_org and user_id = auth.uid() and role = any(p_roles));
$$;

-- Creating an org also makes the caller its owner, atomically.
create function create_org(p_name text) returns uuid
language plpgsql security definer set search_path = public as $$
declare v uuid;
begin
  insert into orgs(name) values (p_name) returning id into v;
  insert into org_members(org_id, user_id, role) values (v, auth.uid(), 'owner');
  return v;
end $$;

alter table orgs enable row level security;
alter table org_members enable row level security;
alter table projects enable row level security;
alter table project_domains enable row level security;
alter table email_domains enable row level security;

-- Reads: members only. Writes: none from the browser; server routes use the service role after their own role checks.
create policy orgs_read on orgs for select using (is_member(id, array['owner','admin','developer','read_only']));
create policy members_read on org_members for select using (is_member(org_id, array['owner','admin','developer','read_only']));
create policy projects_read on projects for select using (is_member(org_id, array['owner','admin','developer','read_only']));
create policy domains_read on project_domains for select using (
  exists (select 1 from projects p where p.id = project_id and is_member(p.org_id, array['owner','admin','developer','read_only'])));
create policy email_read on email_domains for select using (
  exists (select 1 from projects p where p.id = project_id and is_member(p.org_id, array['owner','admin','developer','read_only'])));

-- User preferences (dashboard layout, etc.)
create table if not exists user_preferences (
  user_id uuid not null references auth.users on delete cascade,
  key text not null,
  value jsonb not null default '{}',
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);
alter table user_preferences enable row level security;
create policy prefs_own on user_preferences
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
