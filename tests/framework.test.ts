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

test('keeps the seven guided prompts in order in each domain and derives cross-domain links', async () => {
  const { guideAnswers, guidedDomains, frameworkConnections, saveGuideAnswers } = await import('../lib/guided.ts')
  assert.deepEqual(guidedDomains.map(domain => domain.prompts.map(prompt => prompt[0]).join(',')),
    Array(3).fill('vision,integration,story,insight,outcome,negation,system'))
  let graph = saveGuideAnswers({ ideas: [], connections: [] }, 'lifestyle', { vision: 'Protect a quiet evening.' }, () => first.id)
  graph = saveGuideAnswers(graph, 'business', { vision: 'Leave space for study.' }, () => second.id)
  assert.deepEqual(frameworkConnections(graph), [[first.id, second.id]])
  graph = saveGuideAnswers(graph, 'lifestyle', { vision: 'Rest before work.' }, () => assert.fail('Edited answer got a new identity'))
  assert.equal(guideAnswers(graph, 'lifestyle')[0].title, 'Vision of Theosis')
  assert.equal(parseFramework(graph)?.ideas[0].detail, 'Rest before work.')
  assert.equal(parseFramework({ ideas: [...graph.ideas, { ...graph.ideas[0], id: '00000000-0000-0000-0000-000000000003' }], connections: [] }), null)
})
