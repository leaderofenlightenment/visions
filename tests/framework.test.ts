import test from 'node:test'
import assert from 'node:assert/strict'
import { parseFramework, removeIdea, type Idea } from '../lib/framework.ts'

const first: Idea = { id: '00000000-0000-0000-0000-000000000001', lens: 'vision', domains: ['lifestyle', 'business'], title: 'Protected rest', detail: '' }
const second: Idea = { id: '00000000-0000-0000-0000-000000000002', lens: 'system', domains: ['lifestyle', 'relationships'], title: 'Shared rhythm', detail: '' }

test('validates cross-lens links, rejects stale and duplicate edges, and removes links with deleted ideas', () => {
  const ideas = [first, second]
  const connection = [first.id, second.id]
  const graph = parseFramework({ ideas, connections: [connection] })
  assert.ok(graph)
  assert.equal(parseFramework({ ideas, connections: [connection, [...connection].reverse()] }), null)
  assert.equal(parseFramework({ ideas: [first], connections: [connection] }), null)
  assert.equal(parseFramework({ ideas, connections: [[first.id, first.id]] }), null)
  assert.deepEqual(removeIdea(graph, first.id), { ideas: [second], connections: [] })
})

test('preserves material provenance in a persisted framework idea', () => {
  const courseId = '189776d8f6278108ac1cfffcbc4605e8'
  const graph = parseFramework({ ideas: [{ ...first, courseId }], connections: [] })
  assert.equal(graph?.ideas[0].courseId, courseId)
  assert.equal(parseFramework({ ideas: [{ ...first, courseId: 'https://example.org' }], connections: [] }), null)
})

test('preserves legacy answer identities and derives scoped documents from the Codex movements', async () => {
  const { documentSections, frameworkConnections, guideAnswers, movements, saveMovement } = await import('../lib/guided.ts')
  assert.deepEqual(movements.map(movement => movement.id), ['vision', 'integration', 'story', 'insight', 'outcome', 'negation', 'system'])
  assert.deepEqual(movements.map(movement => movement.title), [
    'The Horizon of Dominion', 'The Stewardship of the Vessel', 'The Crucible of Authority', 'The Internal Compass',
    'The Living Fruit', 'The Apologetic Edge', 'The Wall Audit',
  ])
  for (const movement of movements) assert.equal(Object.keys(movement.prompts).length, 3)

  const legacy = { ...first, title: 'Vision of Theosis', domains: ['lifestyle'], guideDomain: 'lifestyle', detail: 'Protect a quiet evening.' }
  const graph = parseFramework({ ideas: [legacy], connections: [] })
  assert.ok(graph)
  const edited = saveMovement(graph, 'vision', { lifestyle: 'Rest before work.', business: 'Leave space for study.' }, () => second.id)
  assert.deepEqual(frameworkConnections(edited), [[first.id, second.id]])
  assert.equal(guideAnswers(edited, 'lifestyle')[0].id, first.id)
  assert.equal(parseFramework(edited)?.ideas[0].title, 'Vision · Theosis — Mind')
  assert.deepEqual(documentSections(edited, 'business'), [{ id: 'vision', heading: 'Creative direction', detail: 'Leave space for study.' }])
  assert.deepEqual(documentSections(edited, 'relationships'), [])
  assert.equal(parseFramework({ ideas: [...edited.ideas, { ...edited.ideas[0], id: '00000000-0000-0000-0000-000000000003' }], connections: [] }), null)
})
