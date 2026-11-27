export const agents = [
  { id: 'vision', name: 'Vision', letter: 'V', color: '#EAB308', archetype: 'The Architect', role: 'Purpose & direction', description: 'Establish direction, values, and intentions for a life, project, or creative practice.' },
  { id: 'integration', name: 'Integration', letter: 'I', color: '#E58B35', archetype: 'The Synthesizer', role: 'Connections & coherence', description: 'See which ideas, practices, and responsibilities belong together.' },
  { id: 'story', name: 'Story', letter: 'S', color: '#B85BC9', archetype: 'The Storyteller', role: 'Meaning & narrative', description: 'Notice the stories you are living and the meaning they reveal across life domains.' },
  { id: 'insight', name: 'Insight', letter: 'I', color: '#399BE4', archetype: 'The Philosopher', role: 'Meaning & patterns', description: 'Identify patterns, develop understanding, and formulate original arguments.' },
  { id: 'outcome', name: 'Outcome', letter: 'O', color: '#2DBB74', archetype: 'The Strategist', role: 'Change & action', description: 'Consider what tangible change would reflect your intentions and values.' },
  { id: 'negation', name: 'Negation', letter: 'N', color: '#E45454', archetype: 'The Discernment Engine', role: 'Limits & discernment', description: 'Question assumptions and notice what to simplify, refuse, or let go of.' },
  { id: 'system', name: 'System', letter: 'S', color: '#4678E8', archetype: 'The Orchestrator', role: 'Rhythms & structures', description: 'Give good intentions a sustainable place in daily life, work, and relationships.' },
] as const

export type AgentId = (typeof agents)[number]['id']

export const modules = [
  { id: 'lifestyle', name: 'Lifestyle', domain: 'Being', title: 'The Rule of Life', detail: 'Rhythms, habits, and intentional living.', color: '#49e6b2' },
  { id: 'business', name: 'Business', domain: 'Creating', title: 'The Creation Engine', detail: 'Ethical business and creative practice.', color: '#ffc07b' },
  { id: 'relationships', name: 'Relationships', domain: 'Relating', title: 'The Communion Network', detail: 'Meaningful connections and care.', color: '#eaa2ef' },
] as const

export type ModuleId = (typeof modules)[number]['id']

export type Draft = { id: string; intention: string; agents: AgentId[]; createdAt: string }

export function matches(query: string, ...fields: string[]) {
  const text = fields.join(' ').toLowerCase()
  return query.trim().toLowerCase().split(/\s+/).every(word => text.includes(word))
}
