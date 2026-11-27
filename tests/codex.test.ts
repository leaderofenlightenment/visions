import test from 'node:test'
import assert from 'node:assert/strict'
import { agents, matches } from '../lib/codex.ts'
import { contentDomains } from '../lib/guided.ts'

test('preserves the canonical sequence and colors', () => {
  assert.equal(agents.map(agent => agent.letter).join(''), 'VISIONS')
  assert.deepEqual(agents.map(agent => agent.color), ['#EAB308', '#E58B35', '#B85BC9', '#399BE4', '#2DBB74', '#E45454', '#4678E8'])
  assert.equal(new Set(agents.map(agent => agent.id)).size, 7)
})

test('workspace search handles multiple terms, case, and whitespace', () => {
  assert.ok(matches('  VISIONS  codex ', 'VISIONS Core', 'Codex method guided framework'))
  assert.ok(matches('', 'any entry'))
  assert.ok(!matches('theology physics', 'Theosis'))
})

test('shows the three Codex topics and their nine sub-pillars', () => {
  assert.deepEqual(contentDomains.map(({ topic, pillars }) => [topic, ...pillars]), [
    ['Theosis', 'Mind', 'Body', 'Soul'],
    ['Creativity', 'Asceticism', 'Skillset', 'Community'],
    ['Psychology', 'Self-Mastery', 'Household Dynamics', 'Ministry'],
  ])
})
