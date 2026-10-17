create table if not exists public.project_domains (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects on delete cascade,
  domain text not null,
  kind text not null check (kind in ('bought', 'connected')),
  status text not null default 'pending',
  order_id text,
  created_at timestamptz not null default now()
);

create index if not exists project_domains_project_created_idx
  on public.project_domains (project_id, created_at desc);

alter table public.project_domains enable row level security;

drop policy if exists domains_read on public.project_domains;
create policy domains_read on public.project_domains for select using (
  exists (
    select 1 from public.projects p
    where p.id = project_id
      and public.is_member(p.org_id, array['owner','admin','developer','read_only'])
  )
);
