import { emptyFramework, parseFramework } from '@/lib/framework'
import { jsonBody, supabaseServer } from '@/lib/supabase-server'

const reply = (body: unknown, status = 200) => Response.json(body, {
  status, headers: { 'Cache-Control': 'private, no-store' },
})

export async function GET() {
  const db = await supabaseServer()
  if (!db) return reply({ mode: 'device' })
  const { data } = await db.auth.getUser()
  if (!data.user) return reply({ mode: 'signed-out' })
  const result = await db.from('visions_frameworks').select('revision,graph').eq('owner_id', data.user.id).maybeSingle()
  if (result.error) return reply({ error: 'Could not open the framework. Check the Supabase migrations.' }, 503)
  const graph = result.data ? parseFramework(result.data.graph) : emptyFramework
  if (!graph) return reply({ error: 'The saved framework could not be read.' }, 502)
  return reply({ mode: 'account', graph, revision: result.data?.revision ?? 0 })
}

export async function POST(request: Request) {
  const body = await jsonBody(request, 220000)
  const graph = parseFramework(body?.graph)
  const revision = body?.revision
  if (!graph || typeof revision !== 'number' || !Number.isInteger(revision) || revision < 0 || revision >= 2147483647) {
    return reply({ error: 'Invalid framework or revision.' }, 400)
  }
  const db = await supabaseServer()
  if (!db) return reply({ error: 'The account store is unconfigured.' }, 503)
  const { data } = await db.auth.getUser()
  if (!data.user) return reply({ error: 'Sign in to save your framework.' }, 401)
  const query = revision === 0
    ? db.from('visions_frameworks').insert({ graph }).select('revision').single()
    : db.from('visions_frameworks').update({ graph, revision: revision + 1 })
      .eq('owner_id', data.user.id).eq('revision', revision).select('revision').maybeSingle()
  const result = await query
  if (result.error && result.error.code !== '23505') return reply({ error: 'Could not save the framework.' }, 502)
  if (!result.data) return reply({ error: 'This framework changed in another window. Reload it before saving.' }, 409)
  return reply({ revision: result.data.revision })
}
