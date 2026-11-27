'use client'

import { useState, type FormEvent } from 'react'
import { modules } from '@/lib/codex'
import type { Framework } from '@/lib/framework'
import { movements } from '@/lib/guided'
import { applyMap, chatGPTInstructions, codexMapLimit, parseChatGPTMap, previewMap, type MapChange } from '@/lib/chatgpt-map'

export function ChatGPTGuide({ graph, busy, dirty, workbook, onSave }: {
  graph: Framework; busy: boolean; dirty: boolean; workbook: string; onSave: (next: Framework) => Promise<void>
}) {
  const [input, setInput] = useState('')
  const [review, setReview] = useState<MapChange[] | null>(null)
  const [replace, setReplace] = useState(false)
  const [status, setStatus] = useState<{ text: string; error?: boolean } | null>(null)
  const replacing = review?.filter(change => change.previous).length ?? 0

  function reviewMap(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setReview(null)
    setReplace(false)
    setStatus(null)
    try {
      const changes = previewMap(graph, parseChatGPTMap(input))
      if (changes.length) setReview(changes)
      else setStatus({ text: 'These answers are already saved in your Core.' })
    } catch (error) {
      setStatus({ text: error instanceof Error ? error.message : 'Could not read the Codex map.', error: true })
    }
  }

  async function save() {
    if (!review?.length || busy || dirty || (replacing > 0 && !replace)) return
    setStatus(null)
    try {
      await onSave(applyMap(graph, review, () => crypto.randomUUID()))
      setInput('')
      setReview(null)
      setReplace(false)
      setStatus({ text: 'Map saved. Your workspace documents have been updated.' })
    } catch (error) {
      setStatus({ text: error instanceof Error ? error.message : 'Could not save the Codex map.', error: true })
    }
  }

  return <details className="codex-reading chatgpt-guide">
    <summary>Use ChatGPT</summary>
    <ol>
      <li>Create a private project in <a className="text-link" href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer">ChatGPT</a>.</li>
      <li>Paste the <a className="text-link" href={chatGPTInstructions} download>guide instructions</a> into Project settings and add the <a className="text-link" href={workbook} download>workbook PDF</a> as a source.</li>
      <li>Start a new chat and type <strong>Open the Codex</strong>. After the seven movements, ask ChatGPT to export your map for VISIONS.</li>
    </ol>
    <p className="muted">ChatGPT sees what you type there. Use the workbook below for answers you want to keep in VISIONS.</p>
    <form className="personal-form" onSubmit={reviewMap}>
      <label>Codex map from ChatGPT <textarea required rows={4} maxLength={codexMapLimit} value={input} disabled={busy} onChange={event => {
        setInput(event.target.value)
        setReview(null)
        setReplace(false)
        setStatus(null)
      }}/></label>
      <button className="secondary-button" disabled={busy || !input.trim()}>Review map</button>
    </form>
    {review && <section className="map-review" aria-labelledby="review-map-heading">
      <h3 id="review-map-heading">Review {review.length} {review.length === 1 ? 'answer' : 'answers'}</h3>
      <ul>
        {review.map(change => <li key={change.movement + '-' + change.realm}>
          <strong>{movements.find(movement => movement.id === change.movement)?.name} · {modules.find(module => module.id === change.realm)?.name}</strong>
          {change.previous && <p><b>Saved answer</b> {change.previous}</p>}
          <p><b>Imported answer</b> {change.answer}</p>
        </li>)}
      </ul>
      {replacing > 0 && <label className="map-replace"><input type="checkbox" checked={replace} disabled={busy} onChange={event => setReplace(event.target.checked)}/>
        Replace {replacing} saved {replacing === 1 ? 'answer' : 'answers'} shown above.
      </label>}
      {dirty && <p className="muted">Save your workbook edits below before importing the map.</p>}
      <button className="primary-button" type="button" onClick={() => void save()} disabled={busy || dirty || (replacing > 0 && !replace)}>{busy ? 'Saving…' : 'Save map to Core'}</button>
    </section>}
    {status && <p role={status.error ? 'alert' : 'status'}>{status.text}</p>}
  </details>
}
