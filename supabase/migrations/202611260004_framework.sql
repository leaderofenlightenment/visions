create table public.visions_frameworks (
  owner_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  revision integer not null default 1 check (revision >= 1),
  graph jsonb not null check (
    pg_column_size(graph) <= 262144
    and jsonb_typeof(graph) = 'object'
    and graph ? 'ideas' and graph ? 'connections'
    and jsonb_typeof(graph->'ideas') = 'array'
    and jsonb_typeof(graph->'connections') = 'array'
    and jsonb_array_length(graph->'ideas') <= 80
    and jsonb_array_length(graph->'connections') <= 160
  )
);
alter table public.visions_frameworks enable row level security;
revoke all on public.visions_frameworks from anon, authenticated;
grant select on public.visions_frameworks to authenticated;
grant insert (graph), update (graph, revision) on public.visions_frameworks to authenticated;
create policy own_framework on public.visions_frameworks for all to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
