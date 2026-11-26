import test from 'node:test'
import assert from 'node:assert/strict'
import { citedSources, parseSource, type Source } from '../lib/sources.ts'
import { reflectWithCore } from '../lib/agent-runtime.ts'

const source: Source = {
  id: '0', title: 'My notes', author: 'Me', edition: '', locator: 'Page 1', kind: 'personal',
  provenance: 'Private notebook', rights: 'Own work', passage: 'A test excerpt',
}

test('requires source attribution, provenance, and rights', () => {
  assert.ok(parseSource(source))
  assert.equal(parseSource({ ...source, rights: ' ' }), null)
  assert.equal(parseSource({ ...source, kind: '__proto__' }), null)
})

test('passes only selected passages with reference identifiers', async () => {
  const context = citedSources([source, { ...source, id: '1', locator: 'Page 2' }])
  await reflectWithCore('Consider this across life domains', async input => {
    const request = JSON.parse(input.prompt)
    assert.deepEqual(request.sources, context)
    assert.equal(request.intention, 'Consider this across life domains')
    return 'Reflection [S2]'
  }, new AbortController().signal, context)
  assert.deepEqual(context.map(passage => passage.citation), ['S1', 'S2'])
})
