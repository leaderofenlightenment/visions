import test from 'node:test'
import assert from 'node:assert/strict'
import { agents, domains, matches, planAgents, stages } from '../lib/codex.ts'

test('preserves the canonical sequence and colors', () => {
  assert.equal(agents.map(agent => agent.letter).join(''), 'VISIONS')
  assert.deepEqual(agents.map(agent => agent.color), ['#EAB308', '#E58B35', '#B85BC9', '#399BE4', '#2DBB74', '#E45454', '#4678E8'])
  assert.equal(new Set(agents.map(agent => agent.id)).size, 7)
})

test('plans a targeted workflow in canonical order with review for researched content', () => {
  assert.deepEqual(planAgents('Research an article and thumbnail on philosophical ideas'), ['integration', 'story', 'insight', 'outcome', 'negation'])
  assert.deepEqual(planAgents('Create a habit routine'), ['system'])
  assert.deepEqual(planAgents('Something new'), ['vision'])
})

test('a draft started inside an agent workspace stays scoped to that agent', () => {
  assert.deepEqual(planAgents('Draft a research article', 'vision'), ['vision'])
})

test('catalog search handles multiple terms, case, and whitespace', () => {
  assert.ok(matches('  SUBLIME  theology ', domains[0].name, domains[0].full))
  assert.ok(matches('', 'any entry'))
  assert.ok(!matches('theology physics', domains[0].full))
})

test('provides all nine knowledge domains and the five lifecycle stages', () => {
  assert.equal(domains.length, 9)
  assert.deepEqual(stages.map(stage => stage.name), ['Create', 'Review', 'Publish', 'Learn', 'Refine'])
  assert.match(stages[1].description, /Human approval is required/)
})
