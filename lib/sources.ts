export const sourceKinds = {
  scripture: 'Scripture', patristic: 'Patristic text', interpretation: 'Theological interpretation',
  scholarship: 'Scholarship', personal: 'Personal reflection',
}

export const sourceFields = [
  ['title', 'Source title', 200, true],
  ['author', 'Author or attribution', 160, true],
  ['edition', 'Edition and translation', 200, false],
  ['locator', 'Passage or page reference', 160, true],
  ['provenance', 'Origin or source URL', 240, true],
  ['rights', 'License or permission', 240, true],
  ['passage', 'Passage text', 3000, true],
] as const

type SourceFields = Record<(typeof sourceFields)[number][0], string>
export type Source = SourceFields & { id: string; kind: keyof typeof sourceKinds }
export const sourceColumns = 'id,title,author,edition,locator,kind,provenance,rights,passage'

export function parseSource(body: Record<string, unknown>) {
  if (typeof body.kind !== 'string' || !Object.hasOwn(sourceKinds, body.kind)) return null
  const entries = sourceFields.map(([name, , max, required]) => {
    const value = body[name]
    const trimmed = typeof value === 'string' ? value.trim() : null
    return trimmed !== null && trimmed.length <= max && (!required || trimmed) ? [name, trimmed] : null
  })
  if (entries.some(entry => entry === null)) return null
  return { ...Object.fromEntries(entries as [string, string][]) as SourceFields, kind: body.kind as Source['kind'] }
}

export function citedSources(sources: Source[]) {
  return sources.map((source, index) => ({ ...source, citation: 'S' + (index + 1) }))
}
