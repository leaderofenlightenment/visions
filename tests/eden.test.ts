import test from 'node:test'
import assert from 'node:assert/strict'
import { createEdenDraft, parseEdenDraft } from '../lib/eden.ts'
import { POST } from '../app/api/eden/drafts/route.ts'

const consented = { title: 'A business draft', content: 'Only this business draft', apiKey: 'example-key-for-tests', consent: true }

test('rejects Eden transfers without consent or with malformed data', () => {
  assert.equal(parseEdenDraft({ ...consented, consent: false }), null)
  assert.equal(parseEdenDraft({ ...consented, apiKey: 'line one\nline two' }), null)
  assert.equal(parseEdenDraft({ ...consented, content: 'a'.repeat(12001) }), null)
})

test('sends only the approved title and draft to the authenticated Eden Library endpoint', async () => {
  const input = parseEdenDraft({ ...consented, unrelated: 'ignored' })
  assert.ok(input)
  const send: typeof fetch = async (url, init) => {
    assert.equal(url, 'https://mcp.eden.so/v1/tools/eden_create_note')
    assert.equal(init?.redirect, 'error')
    assert.equal(new Headers(init?.headers).get('Authorization'), 'Bearer ' + consented.apiKey)
    assert.deepEqual(JSON.parse(String(init?.body)), {
      title: consented.title, content: consented.content, destination: { kind: 'library' }, presentation: 'document',
    })
    return Response.json({ ok: true, itemId: 'note-id' })
  }
  assert.equal(await createEdenDraft(input, new AbortController().signal, send), 'saved')
  await assert.rejects(createEdenDraft(input, new AbortController().signal, async () => Response.json({ ok: false })))
})

test('rejects cross-origin draft requests before checking course access', async () => {
  const request = new Request('https://visions.test/api/eden/drafts', {
    method: 'POST', headers: { origin: 'https://other.test', 'Content-Type': 'application/json' },
    body: JSON.stringify(consented),
  })
  assert.equal((await POST(request)).status, 400)
})
