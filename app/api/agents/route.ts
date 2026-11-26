import { citedSources, sourceColumns, type Source } from '@/lib/sources'
import { isUuid } from '@/lib/personal'
import { isStudioFormat, studioBriefs } from '@/lib/studio'
import { agents } from '@/lib/codex'
import { executionPlan, openAIProvider, runAgents } from '@/lib/agent-runtime'
import { jsonBody, supabaseServer } from '@/lib/supabase-server'

export const maxDuration = 60
const headers = { 'Cache-Control': 'private, no-store' }
const json = (data: unknown, status = 200) => Response.json(data, { status, headers })

export async function GET() {
  const configured = Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_MODEL)
  const db = configured ? await supabaseServer() : null
  if (!db) return json({ configured: false, signedIn: false })
  const { data } = await db.auth.getUser()
  return json({ configured: true, signedIn: Boolean(data.user) })
}

export async function POST(request: Request) {
  const body = await jsonBody(request)
  const prompt = typeof body?.intention === 'string' ? body.intention.trim() : ''
  const preferred = agents.find(agent => agent.id === body?.agent)?.id
  if (!prompt || prompt.length > 1000 || body?.consent !== true || (body.agent !== null && !preferred)) {
    return json({ error: 'Enter an intention and authorize sending it to OpenAI.' }, 400)
  }
  const format = body.format ?? null
  if (format !== null && !isStudioFormat(format)) return json({ error: 'Invalid studio format.' }, 400)
  const ids: unknown = body.sourceIds ?? []
  if (!Array.isArray(ids) || ids.length > 3 || !ids.every(isUuid) || new Set(ids).size !== ids.length) {
    return json({ error: 'Select up to three distinct sources.' }, 400)
  }
  const key = process.env.OPENAI_API_KEY
  const model = process.env.OPENAI_MODEL
  const db = key && model ? await supabaseServer() : null
  if (!key || !model || !db) return json({ error: 'Agent execution is unconfigured.' }, 503)
  const { data } = await db.auth.getUser()
  if (!data.user) return json({ error: 'Sign in before running an agent.' }, 401)

  let sources: Source[] = []
  if (ids.length) {
    const lookup = await db.from('knowledge_passages').select(sourceColumns).eq('owner_id', data.user.id).in('id', ids)
    if (lookup.error || lookup.data.length !== ids.length) return json({ error: 'A selected source is unavailable.' }, 400)
    sources = ids.map(id => lookup.data.find(source => source.id === id)!) as Source[]
  }
  const { error } = await db.from('agent_run_claims').insert({ owner_id: data.user.id })
  if (error) {
    if (error.code === '23505') return json({ error: 'One run per calendar minute is allowed. Try again shortly.' }, 429)
    return json({ error: 'Could not reserve a run. Check the Supabase migrations.' }, 503)
  }
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(45000)])
  try {
    const context = citedSources(sources)
    const brief = format ? studioBriefs[format] + '\n\nUser brief: ' + prompt : prompt
    const roles = format ? ['story', 'negation'] as const : executionPlan(prompt, preferred)
    const results = await runAgents(brief, roles, openAIProvider(key, model), signal, context)
    return json({ results, sources: context })
  } catch {
    return json({ error: signal.aborted ? 'The run ended before completion.' : 'The model provider could not complete the run.' }, signal.aborted ? 504 : 502)
  }
}
