import { agents, type AgentId, type ModuleId } from './codex'
import catalog from './guided-catalog.json'
import type { Framework, Idea } from './framework'

export const guideAnswerLimit = 1200
type GuideDomain = { id: ModuleId; title: string; pillars: string[]; prompts: [AgentId, string, string, string][] }
export const guidedDomains = catalog as GuideDomain[]

export function guidedPrompt(domain: ModuleId, lens: AgentId) {
  return guidedDomains.find(item => item.id === domain)?.prompts.find(([id]) => id === lens)
}

export function guideAnswers(graph: Framework, domain: ModuleId) {
  return graph.ideas.filter(idea => idea.guideDomain === domain)
}

export function saveGuideAnswers(graph: Framework, domain: ModuleId, answers: Partial<Record<AgentId, string>>, makeId: () => string): Framework {
  const ideas = [...graph.ideas]
  const removed = new Set<string>()
  for (const lens of agents) {
    const prompt = guidedPrompt(domain, lens.id)
    if (!prompt || answers[lens.id] === undefined) continue
    const detail = answers[lens.id]!.trim()
    const index = ideas.findIndex(idea => idea.guideDomain === domain && idea.lens === lens.id)
    if (!detail && index >= 0) {
      removed.add(ideas[index].id)
      ideas.splice(index, 1)
    }
    if (!detail) continue
    const idea: Idea = { id: index < 0 ? makeId() : ideas[index].id, lens: lens.id, domains: [domain],
      guideDomain: domain, title: prompt[1], detail }
    if (index < 0) ideas.push(idea)
    else ideas[index] = idea
  }
  return { ideas, connections: graph.connections.filter(edge => !edge.some(id => removed.has(id))) }
}

export function frameworkConnections(graph: Framework) {
  const unique = new Map(graph.connections.map(edge => [[...edge].sort().join(':'), edge]))
  function connect(items: Idea[]) {
    for (let index = 1; index < items.length; index++) {
      const edge = [items[index - 1].id, items[index].id].sort() as [string, string]
      unique.set(edge.join(':'), edge)
    }
  }
  for (const domain of guidedDomains) {
    const items = guideAnswers(graph, domain.id)
    connect(agents.flatMap(lens => items.find(item => item.lens === lens.id) ?? []))
  }
  for (const lens of agents) {
    connect(guidedDomains.flatMap(domain => graph.ideas.find(item => item.guideDomain === domain.id && item.lens === lens.id) ?? []))
  }
  return [...unique.values()]
}
