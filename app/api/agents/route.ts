import { citedSources, sourceColumns, type Source } from '@/lib/sources'
import { isUuid } from '@/lib/personal'
import { openAIProvider, reflectWithCore } from '@/lib/agent-runtime'
import { hasAiPlan, isCoreMode } from '@/lib/plans'
import { jsonBody, supabaseServer } from '@/lib/supabase-server'

export const maxDuration = 60
const headers = { 'Cache-Control': 'private, no-store' }
const json = (data: unknown, status = 200) => Response.json(data, { status, headers })

export async function GET() {
  const configured = Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_MODEL)
  const db = configured ? await supabaseServer() : null
  if (!db) return json({ configured: false, signedIn: false })
  const { data } = await db.auth.getUser()
  if (!data.user) return json({ configured: true, signedIn: false })
  const enrollment = await db.from('course_enrollments').select('tier').eq('user_id', data.user.id).maybeSingle()
  if (enrollment.error) return json({ error: 'Could not check AI access.' }, 503)
  return json({ configured: true, signedIn: true, entitled: hasAiPlan(enrollment.data?.tier) })
}

export async function POST(request: Request) {
  const body = await jsonBody(request)
  const prompt = typeof body?.intention === 'string' ? body.intention.trim() : ''
  if (!prompt || prompt.length > 1000 || body?.consent !== true) {
    return json({ error: 'Enter an intention and authorize sending it to OpenAI.' }, 400)
  }
  if (body.agent != null || body.format != null) return json({ error: 'This workspace supports holistic Core reflection.' }, 400)
  const mode = body.mode ?? 'reflection'
  if (!isCoreMode(mode)) return json({ error: 'Choose a valid Core workflow.' }, 400)
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

  const enrollment = await db.from('course_enrollments').select('tier').eq('user_id', data.user.id).maybeSingle()
  if (enrollment.error) return json({ error: 'Could not check AI access.' }, 503)
  if (!hasAiPlan(enrollment.data?.tier)) return json({ error: 'Core AI requires the VISIONS AI or Work with Eric tier.' }, 403)
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
    const reflection = await reflectWithCore(prompt, openAIProvider(key, model), signal, context, mode)
    return json({ reflection, sources: context })
  } catch {
    return json({ error: signal.aborted ? 'The run ended before completion.' : 'The model provider could not complete the run.' }, signal.aborted ? 504 : 502)
  }
}
