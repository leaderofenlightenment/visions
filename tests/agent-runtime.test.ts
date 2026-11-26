import test from 'node:test'
import assert from 'node:assert/strict'
import { executionPlan, runAgents } from '../lib/agent-runtime.ts'

test('limits a Core workflow to three roles and places discernment last', () => {
  assert.deepEqual(executionPlan('Research and draft an article with an ethical review'), ['integration', 'story', 'negation'])
  assert.deepEqual(executionPlan('Research an article', 'vision'), ['vision'])
})

test('passes only the supplied intention and prior output between agents', async () => {
  const inputs: string[] = []
  const results = await runAgents('Draft a piece', ['story', 'negation'], async input => {
    inputs.push(input.prompt)
    return input.instructions.includes('Negation') ? 'Review' : 'Draft'
  }, new AbortController().signal)
  assert.deepEqual(JSON.parse(inputs[0]), { intention: 'Draft a piece', earlier: [] })
  assert.deepEqual(JSON.parse(inputs[1]).earlier, [{ agent: 'story', text: 'Draft' }])
  assert.deepEqual(results, [{ agent: 'story', text: 'Draft' }, { agent: 'negation', text: 'Review' }])
})

test('stops routing after cancellation', async () => {
  const controller = new AbortController()
  let calls = 0
  await assert.rejects(runAgents('Draft', ['story', 'negation'], async () => {
    calls++
    controller.abort()
    return 'Draft'
  }, controller.signal), { name: 'AbortError' })
  assert.equal(calls, 1)
})
