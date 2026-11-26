create table public.personal_records (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null check (kind in ('habit', 'journal', 'relationship', 'project')),
  title text not null check (char_length(btrim(title)) between 1 and 160),
  note text not null default '' check (char_length(note) <= 12000),
  category text not null default '' check (char_length(category) <= 80),
  condition smallint check (condition is null or (condition between 1 and 10 and kind = 'relationship')),
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  unique (owner_id, id, kind)
);
create index personal_records_owner_kind on public.personal_records (owner_id, kind, created_at desc);
alter table public.personal_records enable row level security;
revoke all on public.personal_records from anon, authenticated;
grant select, delete on public.personal_records to authenticated;
grant insert (kind, title, note, category, condition, archived), update (title, note, category, condition, archived)
  on public.personal_records to authenticated;
create policy own_records on public.personal_records for all to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);

create table public.habit_completions (
  owner_id uuid not null default auth.uid(),
  habit_id uuid not null,
  kind text generated always as ('habit'::text) stored,
  day date not null,
  primary key (owner_id, habit_id, day),
  foreign key (owner_id, habit_id, kind) references public.personal_records (owner_id, id, kind) on delete cascade
);
alter table public.habit_completions enable row level security;
revoke all on public.habit_completions from anon, authenticated;
grant select, delete on public.habit_completions to authenticated;
grant insert (habit_id, day) on public.habit_completions to authenticated;
create policy own_completions on public.habit_completions for all to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
