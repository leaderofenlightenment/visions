import test from 'node:test'
import assert from 'node:assert/strict'
import { citedSources, parseSource, type Source } from '../lib/sources.ts'
import { runAgents } from '../lib/agent-runtime.ts'
import { isStudioFormat, studioBriefs } from '../lib/studio.ts'

const source: Source = {
  id: '0', title: 'My notes', author: 'Me', edition: '', locator: 'Page 1', kind: 'personal',
  provenance: 'Private notebook', rights: 'Own work', passage: 'A test excerpt',
}

test('requires source attribution, provenance, and rights', () => {
  assert.ok(parseSource(source))
  assert.equal(parseSource({ ...source, rights: ' ' }), null)
  assert.equal(parseSource({ ...source, kind: '__proto__' }), null)
})

test('passes only selected passages with stable references during a studio review', async () => {
  const context = citedSources([source, { ...source, id: '1', locator: 'Page 2' }])
  let calls = 0
  await runAgents(studioBriefs.articles, ['story', 'negation'], async input => {
    const request = JSON.parse(input.prompt)
    assert.deepEqual(request.sources, context)
    assert.equal(request.earlier.length, calls)
    return ++calls === 1 ? 'Draft [S2]' : 'Review [S2]'
  }, new AbortController().signal, context)
  assert.equal(calls, 2)
  assert.deepEqual(context.map(passage => passage.citation), ['S1', 'S2'])
  assert.ok(isStudioFormat('music'))
  assert.ok(!isStudioFormat('toString'))
})
