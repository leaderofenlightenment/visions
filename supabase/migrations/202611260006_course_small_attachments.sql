-- Enable import of small PDFs over a database-only administrative connection.
create table public.course_small_attachments (
  name text primary key check (name ~ '^[a-f0-9]{64}\.pdf$'),
  bytes bytea not null check (octet_length(bytes) between 1 and 262144)
);
alter table public.course_small_attachments enable row level security;
revoke all on public.course_small_attachments from anon, authenticated;
grant select on public.course_small_attachments to authenticated;
grant select, insert, update, delete on public.course_small_attachments to service_role;
create policy "Enrolled learners can read small course attachments"
  on public.course_small_attachments for select to authenticated
  using (exists (
    select 1 from public.course_enrollments where user_id = (select auth.uid())
  ));
