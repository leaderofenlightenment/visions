import test from 'node:test'
import assert from 'node:assert/strict'
import { reflectWithCore } from '../lib/agent-runtime.ts'

test('Core requests one holistic reflection across all seven lenses and three domains', async () => {
  let calls = 0
  const result = await reflectWithCore('Balance work and rest', async input => {
    calls++
    assert.match(input.instructions, /Vision[\s\S]*Integration[\s\S]*Story[\s\S]*Insight[\s\S]*Outcome[\s\S]*Negation[\s\S]*System/)
    assert.match(input.instructions, /Lifestyle.*Business.*Relationships/)
    assert.deepEqual(JSON.parse(input.prompt), { intention: 'Balance work and rest' })
    return 'Reflection'
  }, new AbortController().signal)
  assert.equal(result, 'Reflection')
  assert.equal(calls, 1)
})

test('skips the provider after cancellation', async () => {
  const controller = new AbortController()
  controller.abort()
  await assert.rejects(reflectWithCore('Reflect', async () => assert.fail('Provider called'), controller.signal), { name: 'AbortError' })
})
