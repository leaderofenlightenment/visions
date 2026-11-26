create table public.agent_run_claims (
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  minute_bucket timestamptz not null default date_trunc('minute', now()),
  primary key (owner_id, minute_bucket)
);
alter table public.agent_run_claims enable row level security;
revoke all on public.agent_run_claims from anon, authenticated;
grant insert (owner_id) on public.agent_run_claims to authenticated;
create policy own_claim on public.agent_run_claims for insert to authenticated
  with check (owner_id = (select auth.uid()));
