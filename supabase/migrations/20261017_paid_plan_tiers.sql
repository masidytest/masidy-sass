alter table public.orgs
  drop constraint if exists orgs_plan_check;

alter table public.orgs
  add constraint orgs_plan_check
  check (plan in ('free', 'starter', 'balance', 'pro', 'team'));
