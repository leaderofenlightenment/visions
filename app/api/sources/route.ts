import { isUuid } from '@/lib/personal'
import { parseSource, sourceColumns } from '@/lib/sources'
import { jsonBody, supabaseServer } from '@/lib/supabase-server'

const reply = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } })

export async function GET(request: Request) {
  const db = await supabaseServer()
  if (!db) return reply({ error: 'Set up Supabase to use the source library.' }, 503)
  const { data: auth } = await db.auth.getUser()
  if (!auth.user) return reply({ error: 'Sign in from Account and settings to view sources.' }, 401)
  const query = new URL(request.url).searchParams
  const term = (query.get('q') ?? '').trim().slice(0, 100)
  const offset = Number(query.get('offset') ?? '0')
  if (!Number.isSafeInteger(offset) || offset < 0 || offset > 10000) return reply({ error: 'Invalid page.' }, 400)
  let list = db.from('knowledge_passages').select(sourceColumns).eq('owner_id', auth.user.id)
  if (term) list = list.ilike('title', '%' + term.replace(/[\\%_]/g, '\\$&') + '%')
  const { data, error } = await list.order('created_at', { ascending: false }).order('id').range(offset, offset + 19)
  return error ? reply({ error: 'Could not load sources. Check the database migrations.' }, 502) : reply({ sources: data })
}

export async function POST(request: Request) {
  const body = await jsonBody(request)
  if (!body) return reply({ error: 'Invalid request.' }, 400)
  const db = await supabaseServer()
  if (!db) return reply({ error: 'Supabase is unconfigured.' }, 503)
  const { data: auth } = await db.auth.getUser()
  if (!auth.user) return reply({ error: 'Sign in to manage sources.' }, 401)
  if (body.action === 'delete' && isUuid(body.id)) {
    const { data, error } = await db.from('knowledge_passages').delete().eq('owner_id', auth.user.id).eq('id', body.id).select('id').maybeSingle()
    return error ? reply({ error: 'Could not remove the source.' }, 502)
      : data ? reply({ saved: true }) : reply({ error: 'Source not found.' }, 404)
  }
  const source = parseSource(body)
  if (body.action !== 'add' || !source || body.permitted !== true) return reply({ error: 'Enter provenance and confirm you have permission to store the passage.' }, 400)
  const { error } = await db.from('knowledge_passages').insert(source)
  return error ? reply({ error: 'Could not save the source.' }, 502) : reply({ saved: true }, 201)
}
