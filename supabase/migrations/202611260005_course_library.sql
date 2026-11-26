create table public.course_enrollments (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.course_enrollments enable row level security;
revoke all on public.course_enrollments from anon, authenticated;
grant select on public.course_enrollments to authenticated;
grant select, insert, update, delete on public.course_enrollments to service_role;
create policy "Learners can see their own enrollment"
  on public.course_enrollments for select to authenticated
  using (user_id = (select auth.uid()));

create table public.course_documents (
  id text primary key check (id ~ '^[0-9a-f]{32}$'),
  markdown text not null check (char_length(btrim(markdown)) between 1 and 500000),
  updated_at timestamptz not null default now()
);
alter table public.course_documents enable row level security;
revoke all on public.course_documents from anon, authenticated;
grant select on public.course_documents to authenticated;
grant select, insert, update, delete on public.course_documents to service_role;
create policy "Enrolled learners can read course documents"
  on public.course_documents for select to authenticated
  using (exists (
    select 1 from public.course_enrollments where user_id = (select auth.uid())
  ));

insert into storage.buckets (id, name, public) values ('course-materials', 'course-materials', false)
on conflict (id) do nothing;
create policy "Enrolled learners can read private course assets"
  on storage.objects for select to authenticated
  using (bucket_id = 'course-materials' and exists (
    select 1 from public.course_enrollments where user_id = (select auth.uid())
  ));
