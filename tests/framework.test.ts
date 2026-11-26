import test from 'node:test'
import assert from 'node:assert/strict'
import { frameworkNetwork } from '../lib/framework-network.ts'
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

test('sprouts only occupied branches, links same domains, and connects ideas explicitly', () => {
  const graph = parseFramework({ ideas: [first, second], connections: [[first.id, second.id]] })
  assert.ok(graph)
  const network = frameworkNetwork(graph, { x: 50, y: 48 })
  assert.deepEqual(network.junctions.map(junction => junction.id), [
    'vision:lifestyle', 'vision:business', 'system:lifestyle', 'system:relationships',
  ])
  assert.equal(network.dots.length, 2)
  assert.equal(network.edges.filter(edge => edge.kind === 'domain').length, 1)
  assert.equal(network.edges.filter(edge => edge.kind === 'connection').length, 1)
})

test('preserves material provenance in a persisted framework idea', () => {
  const courseId = '189776d8f6278108ac1cfffcbc4605e8'
  const graph = parseFramework({ ideas: [{ ...first, courseId }], connections: [] })
  assert.equal(graph?.ideas[0].courseId, courseId)
  assert.equal(parseFramework({ ideas: [{ ...first, courseId: 'https://example.org' }], connections: [] }), null)
})
