export const plans = [
  { title: 'VISIONS Framework', price: 'Free', detail: 'Complete all 21 prompts, save them to your network, and build your three domain documents.', availability: 'Available in the guided framework' },
  { title: 'The Master Creator', price: '$33', detail: 'Read the course and systems, save worksheet answers, and bring chosen answers into your VISIONS Core.', availability: 'Access through course enrollment' },
  { title: 'VISIONS AI', price: '$333', detail: 'Course access plus AI help to draft content, plan sustainable routines, and reflect on relationship patterns.', availability: 'Requires AI enrollment and a configured provider' },
  { title: 'Work with Eric', price: '$3,333', detail: 'Course and AI access plus personal support for music, content, and thumbnails, lifestyle coaching, and relationship discernment. Marital advice is outside the offer.', availability: 'Arranged directly with Eric' },
] as const

export const coreModes = [
  ['reflection', 'Core reflection'],
  ['content', 'Content drafting'],
  ['lifestyle', 'Lifestyle planning'],
  ['relationships', 'Relationship reflection'],
] as const
export type CoreMode = typeof coreModes[number][0]
export function isCoreMode(value: unknown): value is CoreMode {
  return coreModes.some(([mode]) => mode === value)
}
export function hasAiPlan(value: unknown) {
  return value === 'ai' || value === 'concierge'
}
