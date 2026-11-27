export const edenReferral = 'https://eden.so/?via=eric44'
export const edenApp = 'https://app.eden.so/'
export const edenKeyHelp = 'https://eden.so/help/api/use-the-eden-api/'
export const edenDraftLimit = 12000
const edenNoteEndpoint = 'https://mcp.eden.so/v1/tools/eden_create_note'

export function parseEdenDraft(body: Record<string, unknown> | null) {
  if (body?.consent !== true || typeof body.apiKey !== 'string' || typeof body.title !== 'string' || typeof body.content !== 'string') return null
  const apiKey = body.apiKey.trim()
  const title = body.title.trim()
  const content = body.content.trim()
  if (!/^[!-~]{12,512}$/.test(apiKey) || !title || title.length > 120 || !content || content.length > edenDraftLimit) return null
  return { apiKey, title, content }
}

export async function createEdenDraft(input: NonNullable<ReturnType<typeof parseEdenDraft>>, signal: AbortSignal, send = fetch) {
  const response = await send(edenNoteEndpoint, {
    method: 'POST', redirect: 'error', cache: 'no-store', signal,
    headers: { Authorization: 'Bearer ' + input.apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: input.title, content: input.content, destination: { kind: 'library' }, presentation: 'document' }),
  })
  if (response.status === 401 || response.status === 403) return 'access-denied'
  if (response.status === 429) return 'rate-limited'
  if (!response.ok || (await response.json()).ok !== true) throw new Error('Eden did not confirm the draft.')
  return 'saved'
}
