import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
import { isDay, parseRecord } from '../lib/personal.ts'

test('validates calendar dates and relationship conditions', () => {
  assert.ok(isDay('2024-02-29'))
  assert.ok(!isDay('2025-02-29'))
  const input = { kind: 'relationship', title: ' Sam ', category: '', condition: 7, note: '', archived: false }
  assert.equal(parseRecord(input)?.title, 'Sam')
  assert.equal(parseRecord({ ...input, condition: 10.5 }), null)
  assert.equal(parseRecord({ ...input, kind: 'habit' }), null)
})

test('PostgreSQL migration isolates records and rejects cross-owner completions', async () => {
  const db = new PGlite()
  const first = '12345678-1234-1234-1234-123456789001'
  const second = '12345678-1234-1234-1234-123456789002'
  try {
    await db.exec(`
      create role authenticated;
      create role anon;
      create schema auth;
      create table auth.users (id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$
        select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
      $$;
      grant usage on schema auth to authenticated;
      insert into auth.users values ('${first}'), ('${second}');
    `)
    await db.exec(await readFile(new URL('../supabase/migrations/202611260001_personal_os.sql', import.meta.url), 'utf8'))
    await db.exec(`set role authenticated; set request.jwt.claim.sub = '${first}';`)
    const habit = await db.query<{ id: string }>("insert into personal_records (kind, title) values ('habit', 'Reading') returning id")
    const habitId = habit.rows[0].id
    await db.query("insert into habit_completions (habit_id, day) values ($1, '2026-11-26')", [habitId])
    await db.exec(`set request.jwt.claim.sub = '${second}';`)
    assert.deepEqual((await db.query('select id from personal_records')).rows, [])
    assert.deepEqual((await db.query('delete from personal_records returning id')).rows, [])
    assert.deepEqual((await db.query('select habit_id from habit_completions')).rows, [])
    await assert.rejects(db.query("insert into habit_completions (habit_id, day) values ($1, '2026-11-26')", [habitId]), /foreign key/i)
    await db.exec('reset role; set role anon;')
    await assert.rejects(db.query('select id from personal_records'), /permission denied/i)
  } finally {
    await db.close()
  }
})
