export const studioBriefs = {
  articles: 'Draft a philosophical article with a clear thesis, supporting arguments and counterarguments. Mark claims that need sources.',
  posts: 'Draft short posts from the supplied brief. Preserve context and avoid engagement bait.',
  threads: 'Draft an ordered thread and identify the parent idea that ties it together.',
  visuals: 'Write a VISIONS-style visual production brief. Specify composition, color and format.',
  music: 'Write an original ambient soundtrack brief. Describe instrumentation, structure and mood.',
} as const

export type StudioFormat = keyof typeof studioBriefs

export function isStudioFormat(value: unknown): value is StudioFormat {
  return typeof value === 'string' && Object.hasOwn(studioBriefs, value)
}
