import { isDay, isKind, isUuid, parseRecord } from '@/lib/personal'
import { jsonBody, supabaseServer } from '@/lib/supabase-server'

const fields = 'id,kind,title,note,category,condition,archived,created_at'
const fail = (error: string, status: number) => Response.json({ error }, { status })
const ok = (data: unknown) => Response.json(data, { headers: { 'Cache-Control': 'private, no-store' } })

export async function GET(request: Request) {
  const db = await supabaseServer()
  if (!db) return fail('Supabase is unconfigured.', 503)
  const { data: auth } = await db.auth.getUser()
  if (!auth.user) return fail('Sign in to view your records.', 401)
  const query = new URL(request.url).searchParams
  const kind = query.get('kind')
  const start = query.get('start')
  const end = query.get('end')
  if (!isKind(kind)) return fail('Invalid workspace.', 400)
  const { data, error } = await db.from('personal_records').select(fields)
    .eq('owner_id', auth.user.id).eq('kind', kind).order('created_at', { ascending: false })
  if (error) return fail('Could not load records. Check the database migration.', 502)
  if (kind !== 'habit') return ok({ records: data, completions: [] })
  if (!isDay(start) || !isDay(end) || start > end || +new Date(end) - +new Date(start) > 31 * 86400000) {
    return fail('Invalid calendar interval.', 400)
  }
  const completion = await db.from('habit_completions').select('habit_id,day')
    .eq('owner_id', auth.user.id).gte('day', start).lte('day', end)
  if (completion.error) return fail('Could not load completions.', 502)
  return ok({ records: data, completions: completion.data })
}

export async function POST(request: Request) {
  const body = await jsonBody(request)
  if (!body) return fail('Invalid request.', 400)
  const db = await supabaseServer()
  if (!db) return fail('Supabase is unconfigured.', 503)
  const { data: auth } = await db.auth.getUser()
  if (!auth.user) return fail('Sign in to save records.', 401)
  const owner = auth.user.id

  if (body.action === 'complete' && isUuid(body.id) && isDay(body.day) && typeof body.done === 'boolean') {
    const result = body.done
      ? await db.from('habit_completions').insert({ habit_id: body.id, day: body.day })
      : await db.from('habit_completions').delete().eq('owner_id', owner).eq('habit_id', body.id).eq('day', body.day)
    if (result.error && !(body.done && result.error.code === '23505')) return fail('Could not change completion.', 400)
    return ok({ saved: true })
  }
  if (body.action === 'delete' && isUuid(body.id) && isKind(body.kind)) {
    const { data, error } = await db.from('personal_records').delete().eq('owner_id', owner).eq('id', body.id)
      .eq('kind', body.kind).select('id').maybeSingle()
    if (error) return fail('Could not delete record.', 502)
    return data ? ok({ saved: true }) : fail('Record not found.', 404)
  }
  const record = parseRecord(body)
  if (body.action !== 'save' || !record || (body.id !== null && !isUuid(body.id))) return fail('Invalid record.', 400)
  const { kind, ...values } = record
  const result = body.id === null
    ? await db.from('personal_records').insert(record).select('id').single()
    : await db.from('personal_records').update(values).eq('owner_id', owner).eq('id', body.id).eq('kind', kind).select('id').maybeSingle()
  if (result.error) return fail('Could not save record.', 502)
  return result.data ? ok({ saved: true }) : fail('Record not found.', 404)
}
