export const agents = [
  { id: 'vision', name: 'Vision', letter: 'V', color: '#EAB308', archetype: 'The Architect', role: 'Purpose & direction', description: 'Establish direction, values, and intentions for a life, project, or creative practice.', x: 50, y: 13.5 },
  { id: 'integration', name: 'Integration', letter: 'I', color: '#E58B35', archetype: 'The Synthesizer', role: 'Connections & coherence', description: 'See which ideas, practices, and responsibilities belong together.', x: 75.8, y: 26.4 },
  { id: 'story', name: 'Story', letter: 'S', color: '#B85BC9', archetype: 'The Storyteller', role: 'Meaning & narrative', description: 'Notice the stories you are living and the meaning they reveal across life domains.', x: 83, y: 55.4 },
  { id: 'insight', name: 'Insight', letter: 'I', color: '#399BE4', archetype: 'The Philosopher', role: 'Meaning & patterns', description: 'Identify patterns, develop understanding, and formulate original arguments.', x: 66.8, y: 81.1 },
  { id: 'outcome', name: 'Outcome', letter: 'O', color: '#2DBB74', archetype: 'The Strategist', role: 'Change & action', description: 'Consider what tangible change would reflect your intentions and values.', x: 33.3, y: 81.1 },
  { id: 'negation', name: 'Negation', letter: 'N', color: '#E45454', archetype: 'The Discernment Engine', role: 'Limits & discernment', description: 'Question assumptions and notice what to simplify, refuse, or let go of.', x: 17, y: 55.4 },
  { id: 'system', name: 'System', letter: 'S', color: '#4678E8', archetype: 'The Orchestrator', role: 'Rhythms & structures', description: 'Give good intentions a sustainable place in daily life, work, and relationships.', x: 24.2, y: 26.4 },
] as const

export type AgentId = (typeof agents)[number]['id']

export const domains = [
  { name: 'Theology & Spirituality', full: 'Theology, Spirituality and the Sublime', color: '#48dbe2' },
  { name: 'Philosophy & Psychology', full: 'Philosophy and Psychology', color: '#b281f7' },
  { name: 'Self-Mastery', full: 'Self-Mastery', color: '#ec67d2' },
  { name: 'Creativity & Art', full: 'Creativity and Art', color: '#f477a9' },
  { name: 'Technology & AI', full: 'Technology and Artificial Intelligence', color: '#648af0' },
  { name: 'Relationships & Systems', full: 'Relationships and Systems Thinking', color: '#6689fc' },
  { name: 'Health & Vitality', full: 'Health and Vitality', color: '#3bdd9e' },
  { name: 'Lifestyle & Values', full: 'Lifestyle Design and Values', color: '#ebc767' },
  { name: 'Business & Anthropology', full: 'Business, Creative Income and Anthropology', color: '#e88959' },
] as const

export const outputs = [
  { id: 'music', name: 'Ambient Music', detail: 'Soundscapes & scores', color: '#b989ff' },
  { id: 'articles', name: 'Articles', detail: 'Research & long-form', color: '#5cdbef' },
  { id: 'posts', name: 'Short Posts', detail: 'Ideas & social copy', color: '#fa9c75' },
  { id: 'threads', name: 'Monthly Threads', detail: 'Series & narratives', color: '#c98eff' },
  { id: 'visuals', name: 'Neural Visuals', detail: 'Covers & thumbnails', color: '#66e5ac' },
] as const

export const modules = [
  { id: 'lifestyle', name: 'Lifestyle', domain: 'Being', title: 'The Rule of Life', detail: 'Rhythms, habits, and intentional living.', color: '#49e6b2' },
  { id: 'business', name: 'Business', domain: 'Creating', title: 'The Creation Engine', detail: 'Ethical business and creative practice.', color: '#ffc07b' },
  { id: 'relationships', name: 'Relationships', domain: 'Relating', title: 'The Communion Network', detail: 'Meaningful connections and care.', color: '#eaa2ef' },
] as const

export type ModuleId = (typeof modules)[number]['id']

export const stages = [
  { name: 'Create', color: '#e875f2', description: 'Set direction, synthesize sources, develop ideas, and create an initial draft.' },
  { name: 'Review', color: '#63baff', description: 'Revisit claims, actions, and assumptions with care. Human approval is required before publishing.' },
  { name: 'Publish', color: '#59e5a1', description: 'Prepare approved work to share with others. External publishing is planned for a later phase.' },
  { name: 'Learn', color: '#fbb765', description: 'Collect authorized feedback and performance observations while respecting the limits of engagement metrics.' },
  { name: 'Refine', color: '#b58cff', description: 'Apply what you learn to future work while preserving the ethical and theological foundations.' },
] as const

export const destinations = [
  ['dashboard', 'Dashboard'], ['agents', 'Agents'], ['lifestyle', 'Lifestyle'], ['business', 'Business'],
  ['relationships', 'Relationships'], ['codex', 'Reality Codex'], ['projects', 'Projects'],
  ['knowledge', 'Knowledge'], ['content', 'Content Library'], ['analytics', 'Analytics'], ['settings', 'Settings'],
] as const

export type Destination = (typeof destinations)[number][0]
export type Draft = { id: string; intention: string; agents: AgentId[]; createdAt: string }

export function matches(query: string, ...fields: string[]) {
  const text = fields.join(' ').toLowerCase()
  return query.trim().toLowerCase().split(/\s+/).every(word => text.includes(word))
}
