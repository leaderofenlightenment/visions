export const recordKinds = ['habit', 'journal', 'relationship', 'project'] as const
export type RecordKind = typeof recordKinds[number]
export type PersonalRecord = {
  id: string
  kind: RecordKind
  title: string
  note: string
  category: string
  condition: number | null
  archived: boolean
  created_at: string
}
export type Completion = { habit_id: string; day: string }

export function isKind(value: unknown): value is RecordKind {
  return recordKinds.some(kind => kind === value)
}

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(value)
}

export function isDay(value: unknown): value is string {
  if (typeof value !== 'string' || !/^[1-9]\d{3}-\d{2}-\d{2}$/.test(value)) return false
  const day = new Date(value + 'T00:00:00Z')
  return Number.isFinite(+day) && day.toISOString().slice(0, 10) === value
}

export function localDay(date = new Date()) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')
}

export function parseRecord(input: Record<string, unknown>) {
  if (!isKind(input.kind) || typeof input.title !== 'string' || typeof input.note !== 'string'
    || typeof input.category !== 'string' || typeof input.archived !== 'boolean') return null
  const title = input.title.trim()
  const category = input.category.trim()
  if (!title || title.length > 160 || input.note.length > 12000 || category.length > 80) return null
  const condition = input.condition
  if (condition !== null && (input.kind !== 'relationship' || typeof condition !== 'number'
    || !Number.isInteger(condition) || condition < 1 || condition > 10)) return null
  return { kind: input.kind, title, note: input.note, category, condition, archived: input.archived }
}
