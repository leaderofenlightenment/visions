import { modules, type AgentId, type ModuleId } from './codex'
import type { Framework } from './framework'
import { guideAnswerLimit, movements, saveMovement } from './guided'

export const chatGPTInstructions = '/visions-chatgpt-instructions.txt'
export const codexMapLimit = 160000
const format = 'visions-codex-v1'
const slots = {
  vision: 'vision', interest: 'integration', story: 'story', insight: 'insight',
  outcome: 'outcome', negation: 'negation', systemization: 'system',
} as const satisfies Record<string, AgentId>

type Answers = Partial<Record<AgentId, Partial<Record<ModuleId, string>>>>
export type MapChange = { movement: AgentId; realm: ModuleId; previous: string; answer: string }

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function parseChatGPTMap(input: string): Answers {
  if (input.length > codexMapLimit) throw new Error('The map is too large. Copy just the Codex JSON from ChatGPT.')
  const text = input.trim()
  const fenced = /^\x60{3}(?:json)?\s*\n([\s\S]*?)\n\x60{3}$/i.exec(text)
  let data: unknown
  try {
    data = JSON.parse(fenced?.[1] ?? text)
  } catch {
    throw new Error('Paste the full JSON export from ChatGPT, starting with the opening brace.')
  }
  if (!record(data) || data.format !== format || !record(data.answers) || Object.keys(data).length !== 2) {
    throw new Error('This export must use the visions-codex-v1 format. Ask ChatGPT to export your Codex map for VISIONS.')
  }

  const answers: Answers = {}
  for (const [step, points] of Object.entries(data.answers)) {
    if (!Object.hasOwn(slots, step) || !record(points)) throw new Error('The map contains an unknown movement or invalid movement answers.')
    const entries: Partial<Record<ModuleId, string>> = {}
    for (const [key, answer] of Object.entries(points)) {
      const realm = modules.find(module => module.id === key)
      if (!realm) throw new Error('Each movement can include Lifestyle, Business, and Relationships.')
      if (typeof answer !== 'string' || answer.trim().length > guideAnswerLimit) {
        throw new Error(`Each answer must be text of up to ${guideAnswerLimit} characters. Ask ChatGPT for a corrected export.`)
      }
      if (answer.trim()) entries[realm.id] = answer.trim()
    }
    answers[slots[step as keyof typeof slots]] = entries
  }
  if (!Object.values(answers).some(entries => Object.keys(entries).length)) throw new Error('This map has no answers to import.')
  return answers
}

function currentAnswer(graph: Framework, movement: AgentId, realm: ModuleId) {
  return graph.ideas.find(idea => idea.guideDomain === realm && idea.lens === movement)?.detail ?? ''
}

export function previewMap(graph: Framework, answers: Answers): MapChange[] {
  const changes: MapChange[] = []
  for (const movement of movements) {
    for (const { id: realm } of modules) {
      const answer = answers[movement.id]?.[realm]
      if (!answer) continue
      const previous = currentAnswer(graph, movement.id, realm)
      if (answer !== previous) changes.push({ movement: movement.id, realm, previous, answer })
    }
  }
  return changes
}

export function applyMap(graph: Framework, changes: MapChange[], makeId: () => string) {
  const answers: Answers = {}
  for (const change of changes) {
    if (currentAnswer(graph, change.movement, change.realm) !== change.previous) {
      throw new Error('A workbook answer changed after your review. Review the map again before saving.')
    }
    const entries = answers[change.movement] ??= {}
    entries[change.realm] = change.answer
  }
  return movements.reduce((next, { id }) => answers[id] ? saveMovement(next, id, answers[id], makeId) : next, graph)
}
