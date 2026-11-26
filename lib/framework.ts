import { agents, modules, type AgentId, type ModuleId } from './codex'
import { isUuid } from './personal'

export type Idea = { id: string; lens: AgentId; domains: ModuleId[]; title: string; detail: string }
export type Connection = [string, string]
export type Framework = { ideas: Idea[]; connections: Connection[] }
export const emptyFramework: Framework = { ideas: [], connections: [] }
export const ideaLimit = 80
export const connectionLimit = 160

export const lensQuestions: Record<AgentId, string> = {
  vision: 'What direction or value should guide you here?',
  integration: 'Which responsibilities, practices, or ideas belong together?',
  story: 'What meaning or narrative is emerging from your experience?',
  insight: 'What pattern, question, or tension are you noticing?',
  outcome: 'What concrete change would reflect what matters to you?',
  negation: 'What might you need to question, simplify, or let go of?',
  system: 'What recurring structure could support this over time?',
}

function object(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export function parseFramework(value: unknown): Framework | null {
  if (!object(value) || !Array.isArray(value.ideas) || !Array.isArray(value.connections)
    || value.ideas.length > ideaLimit || value.connections.length > connectionLimit) return null
  const ideas: Idea[] = []
  const ids = new Set<string>()
  for (const item of value.ideas as unknown[]) {
    if (!object(item) || !isUuid(item.id) || ids.has(item.id)
      || typeof item.title !== 'string' || typeof item.detail !== 'string'
      || !item.title.trim() || item.title.length > 100 || item.detail.length > 400
      || !Array.isArray(item.domains)) return null
    const lens = agents.find(agent => agent.id === item.lens)?.id
    const inputDomains = item.domains
    const domains = modules.filter(module => inputDomains.includes(module.id)).map(module => module.id)
    if (!lens || !domains.length || domains.length !== inputDomains.length) return null
    ids.add(item.id)
    ideas.push({ id: item.id, lens, domains, title: item.title.trim(), detail: item.detail.trim() })
  }
  const connections: Connection[] = []
  const seen = new Set<string>()
  for (const entry of value.connections as unknown[]) {
    if (!Array.isArray(entry) || entry.length !== 2 || !entry.every(id => typeof id === 'string' && ids.has(id)) || entry[0] === entry[1]) return null
    const [first, second] = [...entry].sort()
    const key = first + ':' + second
    if (seen.has(key)) return null
    connections.push([first, second])
    seen.add(key)
  }
  return { ideas, connections }
}

export function removeIdea(graph: Framework, id: string): Framework {
  return { ideas: graph.ideas.filter(idea => idea.id !== id), connections: graph.connections.filter(edge => !edge.includes(id)) }
}

export function frameworkSummary(graph: Framework) {
  return agents.map(lens => ({
    lens,
    ideas: graph.ideas.filter(idea => idea.lens === lens.id),
    domains: modules.map(domain => ({ ...domain, count: graph.ideas.filter(idea => idea.lens === lens.id && idea.domains.includes(domain.id)).length })),
  }))
}
