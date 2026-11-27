import { createHash } from 'node:crypto'

export type WorksheetPrompt = { id: string; number: number }
export type WorksheetPart = { markdown: string; prompt?: WorksheetPrompt }
export type CourseResponse = { promptId: string; answer: string }

const blank = /^\s*(?:(?:[-*+]|\d+\.)\s+)?_{3,}\s*$/

export function extractWorksheet(markdown: string): WorksheetPart[] {
  let chunk: string[] = []
  let fence = ''
  let cue = ''
  let number = 0
  const occurrences = new Map<string, number>()
  const parts: WorksheetPart[] = []
  for (const line of markdown.split('\n')) {
    const marker = line.match(/^\s*(`{3,}|~{3,})/)?.[1]
    if (marker) {
      if (!fence) fence = marker
      else if (marker[0] === fence[0] && marker.length >= fence.length) fence = ''
      chunk.push(line)
      continue
    }
    if (!fence && blank.test(line)) {
      number++
      const repeat = (occurrences.get(cue) ?? 0) + 1
      occurrences.set(cue, repeat)
      const id = createHash('sha256').update(JSON.stringify([cue, repeat])).digest('hex').slice(0, 24)
      parts.push({ markdown: chunk.join('\n').trim(), prompt: { id, number } })
      chunk = []
    } else {
      chunk.push(line)
      const text = line.trim().replace(/^[-*+#>\d.\s]+/, '').replace(/[*_`]+/g, '').trim()
      if (!fence && text && !/^\|/.test(text)) cue = text
    }
  }
  if (chunk.some(line => line.trim())) parts.push({ markdown: chunk.join('\n').trim() })
  return parts
}
