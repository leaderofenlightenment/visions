alter table public.course_enrollments
  add column tier text not null default 'course'
  check (tier in ('course', 'ai', 'concierge'));

create table public.course_responses (
  owner_id uuid not null references auth.users(id) on delete cascade,
  material_id text not null references public.course_documents(id) on delete cascade,
  prompt_id text not null check (prompt_id ~ '^[0-9a-f]{24}$'),
  answer text not null check (char_length(btrim(answer)) between 1 and 1200),
  updated_at timestamptz not null default now(),
  primary key (owner_id, material_id, prompt_id)
);
create index course_responses_material_id_idx on public.course_responses(material_id);
alter table public.course_responses enable row level security;
revoke all on public.course_responses from anon, authenticated;
grant select, insert, update, delete on public.course_responses to authenticated;
grant select, insert, update, delete on public.course_responses to service_role;
create policy "Enrolled learners manage their own course answers"
  on public.course_responses for all to authenticated
  using (
    owner_id = (select auth.uid()) and exists (
      select 1 from public.course_enrollments where user_id = (select auth.uid())
    )
  )
  with check (
    owner_id = (select auth.uid()) and exists (
      select 1 from public.course_enrollments where user_id = (select auth.uid())
    )
  );
