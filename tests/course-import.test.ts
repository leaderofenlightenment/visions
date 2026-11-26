import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
import { normalizeCourse, templateMarkdown } from '../scripts/course-format.ts'

const lessonId = '189776d8f6278108ac1cfffcbc4605e8'

test('converts Notion content to native titles, lesson links, and hosted media', () => {
  const filename = 'a'.repeat(64) + '.pdf'
  const input = [
    '<h1 color="blue">Heading</h1>',
    '<callout><b>Exercise</b></callout>',
    '<page url="https://app.notion.com/p/' + lessonId + '">Read</page>',
    '<file source="notion-file-block://asset" />',
    '<embed source="" />',
  ].join('\n')
  const result = normalizeCourse(input, { 'notion-file-block://asset': filename })
  assert.match(result.markdown, /# Heading/)
  assert.match(result.markdown, /\*\*Exercise\*\*/)
  assert.ok(result.markdown.includes('#course-material=' + lessonId))
  assert.ok(result.markdown.includes('/api/course/media/' + filename))
  assert.ok(!result.markdown.includes('notion.com'))
  assert.deepEqual(result.missing, ['(empty media source)'])
  assert.match(templateMarkdown('Habits', [{ name: 'Practice', type: 'rich_text' }]), /\| Practice \| rich text \|/)
})

test('course documents and assets require enrollment and learners cannot grant access', async () => {
  const db = new PGlite()
  const learner = '12345678-1234-1234-1234-123456789001'
  const stranger = '12345678-1234-1234-1234-123456789002'
  try {
    await db.exec(`
      create role anon;
      create role authenticated;
      create role service_role bypassrls;
      create schema auth;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid stable language sql as $$
        select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
      $$;
      create schema storage;
      create table storage.buckets(id text primary key, name text, public boolean);
      create table storage.objects(bucket_id text, name text);
      alter table storage.objects enable row level security;
      grant usage on schema auth, storage to authenticated;
      grant select on storage.objects to authenticated;
      insert into auth.users values ('${learner}'), ('${stranger}');
    `)
    await db.exec(await readFile(new URL('../supabase/migrations/202611260005_course_library.sql', import.meta.url), 'utf8'))
    await db.exec(`
      insert into course_enrollments(user_id) values ('${learner}');
      insert into course_documents (id, markdown) values ('${lessonId}', 'Example lesson');
      insert into storage.objects values ('course-materials', 'example.pdf');
      set role authenticated;
      set request.jwt.claim.sub = '${stranger}';
    `)
    assert.equal((await db.query('select id from course_documents')).rows.length, 0)
    assert.equal((await db.query('select name from storage.objects')).rows.length, 0)
    await assert.rejects(db.query('insert into course_enrollments(user_id) values ($1)', [stranger]), /permission denied/i)
    await db.exec(`set request.jwt.claim.sub = '${learner}';`)
    assert.equal((await db.query('select id from course_documents')).rows.length, 1)
    assert.equal((await db.query('select name from storage.objects')).rows.length, 1)
    await assert.rejects(db.exec('update course_documents set markdown = \'changed\''), /permission denied/i)
    await db.exec('reset role; set role anon')
    await assert.rejects(db.exec('select id from course_documents'), /permission denied/i)
  } finally {
    await db.close()
  }
})
