import test from 'node:test'
import assert from 'node:assert/strict'
import { applyMap, parseChatGPTMap, previewMap } from '../lib/chatgpt-map.ts'
import { emptyFramework, parseFramework } from '../lib/framework.ts'
import { guideAnswerLimit, saveMovement } from '../lib/guided.ts'

const firstId = '00000000-0000-0000-0000-000000000001'
const secondId = '00000000-0000-0000-0000-000000000002'
const map = (answers: unknown) => JSON.stringify({ format: 'visions-codex-v1', answers })

test('imports Interest and Systemization into stable slots and leaves skipped answers alone', () => {
  const existing = saveMovement(emptyFramework, 'integration', { lifestyle: 'Protect rest.' }, () => firstId)
  const input = map({ interest: { lifestyle: ' ', business: 'Practice writing.' }, systemization: { relationships: 'Share meals.' } })
  const answers = parseChatGPTMap('```json\r\n' + input + '\r\n```')
  const changes = previewMap(existing, answers)
  assert.deepEqual(changes.map(({ movement, realm }) => [movement, realm]), [['integration', 'business'], ['system', 'relationships']])
  const written = parseFramework(applyMap(existing, changes, () => crypto.randomUUID()))
  assert.ok(written)
  assert.deepEqual(written.ideas.map(idea => idea.detail), ['Protect rest.', 'Practice writing.', 'Share meals.'])
  assert.equal(written.ideas[0].id, firstId)
})

test('preserves links on replacement and rejects stale previews', () => {
  const existing = saveMovement(saveMovement(emptyFramework, 'vision', { lifestyle: 'Rest each evening.' }, () => firstId),
    'system', { business: 'Review orders.' }, () => secondId)
  existing.connections = [[firstId, secondId]]
  const changes = previewMap(existing, parseChatGPTMap(map({ vision: { lifestyle: 'Walk each evening.' } })))
  const updated = applyMap(existing, changes, () => assert.fail('An edit must retain its existing ID'))
  assert.deepEqual(updated.connections, [[firstId, secondId]])
  assert.equal(updated.ideas[0].detail, 'Walk each evening.')
  assert.throws(() => applyMap(updated, changes, () => firstId), /changed after your review/)
})

test('rejects unexpected, empty, and oversize export data', () => {
  assert.throws(() => parseChatGPTMap(map({ vision: { lifestyle: '' } })), /no answers/)
  assert.throws(() => parseChatGPTMap(map({ unknown: { lifestyle: 'a' } })), /unknown movement/)
  assert.throws(() => parseChatGPTMap(map({ vision: { people: 'a' } })), /Lifestyle, Business, and Relationships/)
  assert.throws(() => parseChatGPTMap(map({ vision: { lifestyle: 'a'.repeat(guideAnswerLimit + 1) } })), /up to 1200 characters/)
  assert.throws(() => parseChatGPTMap(map({ vision: { lifestyle: { title: 'a' } } })), /must be text/)
  assert.throws(() => parseChatGPTMap('{"format":"visions-codex-v1","answers":{"__proto__":{}}}'), /unknown movement/)
})
