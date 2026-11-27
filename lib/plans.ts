export const plans = [
  { title: 'VISIONS Core', price: 'Free', detail: 'Work through the 21 Codex prompts to build a Rule of Life, Business Plan, and Relationship Management document.', availability: 'Available in the Core' },
  { title: 'The Master Creator', price: '$33', detail: 'Read course materials and bonuses in Lifestyle, Business, and Relationships. Save worksheets and bring chosen answers into the Core.', availability: 'Access through course enrollment' },
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
