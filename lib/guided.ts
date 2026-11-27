import { agents, type AgentId, type ModuleId } from './codex'
import catalog from './guided-catalog.json'
import type { Framework, Idea } from './framework'

export const guideAnswerLimit = 1200
type Movement = { id: AgentId; name: string; title: string; reading: string; prompts: Record<ModuleId, { pillar: string; prompt: string }> }
export const movements = catalog.movements as Movement[]
export const codexIntroduction = catalog.introduction.join('\n\n')
export const codexClosing = catalog.closing

export const contentDomains = [
  { id: 'lifestyle', topic: 'Theosis', document: 'Rule of Life', pillars: ['Mind', 'Body', 'Soul'],
    headings: ['Daily rhythm', 'Physical discipline', 'Lessons from past habits', 'Guiding principles', 'Forty- and ninety-day priorities', 'Limits and temptations', 'Weekly review'] },
  { id: 'business', topic: 'Creativity', document: 'Business Plan', pillars: ['Asceticism', 'Skillset', 'Community'],
    headings: ['Creative direction', 'Craft and practice', 'Turning points and collaborators', 'Lessons from work', 'Measures of fruitfulness', 'Shortcuts to avoid', 'Signs the work has drifted'] },
  { id: 'relationships', topic: 'Psychology', document: 'Relationship Management', pillars: ['Self-Mastery', 'Household Dynamics', 'Ministry'],
    headings: ['Relational priorities', 'Household responsibilities', 'Service and blind spots', 'Tensions to work through', 'Long-term commitments', 'Boundaries and responses', 'Patterns to review'] },
] as const

export function guidedPrompt(domain: ModuleId, lens: AgentId) {
  const movement = movements.find(item => item.id === lens)
  const topic = contentDomains.find(item => item.id === domain)
  if (!movement || !topic) return
  const prompt = movement.prompts[domain]
  return { ...prompt, title: `${movement.name} · ${topic.topic} — ${prompt.pillar}` }
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
      guideDomain: domain, title: prompt.title, detail }
    if (index < 0) ideas.push(idea)
    else ideas[index] = idea
  }
  return { ideas, connections: graph.connections.filter(edge => !edge.some(id => removed.has(id))) }
}

export function saveMovement(graph: Framework, lens: AgentId, answers: Partial<Record<ModuleId, string>>, makeId: () => string) {
  return contentDomains.reduce((next, { id }) => saveGuideAnswers(next, id, { [lens]: answers[id] }, makeId), graph)
}

export function documentSections(graph: Framework, domain: ModuleId) {
  const content = contentDomains.find(item => item.id === domain)!
  const answers = guideAnswers(graph, domain)
  return movements.flatMap((movement, index) => {
    const answer = answers.find(idea => idea.lens === movement.id)
    return answer ? [{ id: movement.id, heading: content.headings[index], detail: answer.detail }] : []
  })
}

export function frameworkConnections(graph: Framework) {
  const unique = new Map(graph.connections.map(edge => [[...edge].sort().join(':'), edge]))
  function connect(items: Idea[]) {
    for (let index = 1; index < items.length; index++) {
      const edge = [items[index - 1].id, items[index].id].sort() as [string, string]
      unique.set(edge.join(':'), edge)
    }
  }
  for (const domain of contentDomains) {
    const items = guideAnswers(graph, domain.id)
    connect(agents.flatMap(lens => items.find(item => item.lens === lens.id) ?? []))
  }
  for (const lens of agents) {
    connect(contentDomains.flatMap(domain => graph.ideas.find(item => item.guideDomain === domain.id && item.lens === lens.id) ?? []))
  }
  return [...unique.values()]
}
