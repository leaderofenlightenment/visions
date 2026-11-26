create table public.knowledge_passages (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 200),
  author text not null check (char_length(btrim(author)) between 1 and 160),
  edition text not null check (char_length(edition) <= 200),
  locator text not null check (char_length(btrim(locator)) between 1 and 160),
  kind text not null check (kind in ('scripture', 'patristic', 'interpretation', 'scholarship', 'personal')),
  provenance text not null check (char_length(btrim(provenance)) between 1 and 240),
  rights text not null check (char_length(btrim(rights)) between 1 and 240),
  passage text not null check (char_length(btrim(passage)) between 1 and 3000),
  created_at timestamptz not null default now()
);
create index knowledge_passages_owner_created on public.knowledge_passages (owner_id, created_at desc, id);
alter table public.knowledge_passages enable row level security;
revoke all on public.knowledge_passages from anon, authenticated;
grant select, delete on public.knowledge_passages to authenticated;
grant insert (title, author, edition, locator, kind, provenance, rights, passage)
  on public.knowledge_passages to authenticated;
create policy own_passages on public.knowledge_passages for all to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
