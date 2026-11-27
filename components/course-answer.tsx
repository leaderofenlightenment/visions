'use client'

import { useState } from 'react'
import type { WorksheetPrompt, CourseResponse } from '@/lib/course-worksheet'
import { guideAnswerLimit } from '@/lib/guided'

export type CourseApplication = CourseResponse & { title: string }

export function CourseAnswer({ materialId, prompt, initial, writable, onApply }: {
  materialId: string; prompt: WorksheetPrompt; initial: string; writable: boolean; onApply: (answer: CourseApplication) => void
}) {
  const [answer, setAnswer] = useState(initial)
  const [saved, setSaved] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null)
  const id = 'course-answer-' + prompt.id
  const changed = answer.trim() !== saved

  async function save(apply: boolean) {
    if (busy || !writable) return
    setBusy(true)
    setMessage(null)
    try {
      let value = saved
      if (changed) {
        const response = await fetch('/api/course/' + materialId, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ promptId: prompt.id, answer }),
        })
        const result = await response.json()
        if (!response.ok) throw new Error(result.error ?? 'Could not save your answer.')
        value = result.answer
        setSaved(value)
        setMessage({ text: value ? 'Answer saved in the course.' : 'Saved answer cleared.' })
      }
      if (apply && value) onApply({ promptId: prompt.id, title: 'Response ' + prompt.number, answer: value })
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'Could not save your answer.', error: true })
    } finally { setBusy(false) }
  }

  return <fieldset className="guide-prompt course-answer">
    <legend>Response {prompt.number}</legend>
    <label htmlFor={id}>Your answer {prompt.number}</label>
    <textarea id={id} rows={3} maxLength={guideAnswerLimit} value={answer} disabled={busy || !writable}
      onChange={event => setAnswer(event.target.value)}/>
    <div className="personal-actions">
      <button type="button" className="secondary-button" disabled={busy || !changed || !writable} onClick={() => void save(false)}>
        {busy ? 'Saving…' : 'Save answer'}
      </button>
      <button type="button" className="primary-button" disabled={busy || !answer.trim() || !writable} onClick={() => void save(true)}>Add answer to VISIONS Core</button>
    </div>
    {message && <p role={message.error ? 'alert' : 'status'}>{message.text}</p>}
  </fieldset>
}
