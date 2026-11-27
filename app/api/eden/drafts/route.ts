import { courseAccess, courseHeaders } from '@/lib/course-access'
import { createEdenDraft, parseEdenDraft } from '@/lib/eden'
import { jsonBody } from '@/lib/supabase-server'

const reply = (body: unknown, status = 200) => Response.json(body, { status, headers: courseHeaders })

export async function POST(request: Request) {
  const input = parseEdenDraft(await jsonBody(request))
  if (!input) return reply({ error: 'Enter an Eden API key, a title and draft text, then confirm the transfer.' }, 400)

  const access = await courseAccess()
  if (!access.db) return reply({ error: access.status === 401 ? 'Sign in to VISIONS before sending a draft.' : access.error }, access.status)

  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(10000)])
  try {
    const result = await createEdenDraft(input, signal)
    if (result === 'access-denied') return reply({ error: 'Eden rejected the key. Check that it can edit your Library.' }, 403)
    if (result === 'rate-limited') return reply({ error: 'Eden is limiting requests. Try again shortly.' }, 429)
    return reply({ saved: true })
  } catch {
    return reply({ error: 'Eden did not confirm the save. Check your Eden Library before trying again.' }, 502)
  }
}
