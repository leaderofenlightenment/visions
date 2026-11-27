'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { Source } from '@/lib/sources'

type Citation = Source & { citation: string }

export function AgentRun() {
  const [access, setAccess] = useState<{ configured: boolean; signedIn: boolean; entitled?: boolean } | null>(null)
  const [reflection, setReflection] = useState('')
  const [available, setAvailable] = useState<Source[]>([])
  const [sourceError, setSourceError] = useState('')
  const [sourceQuery, setSourceQuery] = useState('')
  const [selected, setSelected] = useState<Source[]>([])
  const [citations, setCitations] = useState<Citation[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const active = useRef<AbortController | null>(null)

  useEffect(() => {
    const check = new AbortController()
    fetch('/api/agents', { signal: check.signal }).then(async response => {
      if (!response.ok) throw new Error('Could not check AI access.')
      return response.json()
    }).then(setAccess)
      .catch(() => { if (!check.signal.aborted) setError('Could not check AI access.') })
    return () => { check.abort(); active.current?.abort() }
  }, [])

  useEffect(() => {
    if (!access?.entitled) return
    const check = new AbortController()
    fetch('/api/sources?' + new URLSearchParams({ q: sourceQuery }), { signal: check.signal })
      .then(async response => {
        if (!response.ok) throw new Error('Could not look up sources.')
        const data = await response.json()
        if (!Array.isArray(data.sources)) throw new Error('Could not look up sources.')
        if (check.signal.aborted) return
        setAvailable(data.sources)
        setSourceError('')
      }).catch(() => { if (!check.signal.aborted) setSourceError('Could not look up sources.') })
    return () => check.abort()
  }, [access?.entitled, sourceQuery])

  function exportDraft() {
    const heading = '## VISIONS Core reflection\n\n' + reflection
    const references = citations.map(source => '[' + source.citation + '] ' + [source.title, source.author, source.edition, source.locator, source.provenance].filter(Boolean).join(' · ')).join('\n')
    const objectUrl = URL.createObjectURL(new Blob([heading + (references ? '\n\n## Selected sources\n\n' + references : '')], { type: 'text/markdown' }))
    const link = document.createElement('a')
    link.href = objectUrl
    link.download = 'visions-reflection.md'
    link.click()
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
  }

  async function run(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (active.current) return
    const form = new FormData(event.currentTarget)
    const control = new AbortController()
    active.current = control
    setBusy(true)
    setError('')
    setReflection('')
    setCitations([])
    try {
      const response = await fetch('/api/agents', {
        method: 'POST', signal: control.signal, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intention: form.get('intention'), consent: form.get('consent') === 'on', sourceIds: selected.map(source => source.id) }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)
      setReflection(result.reflection)
      setCitations(result.sources ?? [])
    } catch (error) {
      setError(control.signal.aborted ? 'Stopped waiting for this run.' : error instanceof Error ? error.message : 'The run failed.')
    } finally {
      active.current = null
      setBusy(false)
    }
  }

  return <section className="dialog-section">
    <h3>Core reflection</h3>
    {error && <p role="alert">{error}</p>}
    {!access && !error && <p role="status">Checking AI access…</p>}
    {access && !access.configured && <p className="muted">AI provider unconfigured. See the README for setup.</p>}
    {access?.configured && !access.signedIn && <p className="muted">Sign in from Account and settings to use Core reflection.</p>}
    {access?.signedIn && !access.entitled && <p className="muted">Core AI is available on the VISIONS AI and Work with Eric plans.</p>}
    {access?.entitled && <form className="personal-form" onSubmit={run}>
      <label>Intention <textarea name="intention" required maxLength={1000} rows={4} placeholder="Share a non-sensitive question spanning your life domains"/></label>
      <details>
        <summary>Choose sources ({selected.length}/3)</summary>
        <label>Find by title <input maxLength={100} value={sourceQuery} onChange={event => setSourceQuery(event.target.value)}/></label>
        {sourceError && <p role="status">{sourceError}</p>}
        {selected.map(source => <div className="personal-actions" key={source.id}><span>{source.title} · {source.locator}</span>
          <button type="button" className="secondary-button" onClick={() => setSelected(items => items.filter(item => item.id !== source.id))} disabled={busy}>Remove</button>
        </div>)}
        {available.filter(source => !selected.some(item => item.id === source.id)).map(source => <button
          className="secondary-button" key={source.id} type="button" disabled={busy || selected.length >= 3}
          onClick={() => setSelected(items => items.length < 3 ? [...items, source] : items)}>{source.title} · {source.locator}</button>)}
      </details>
      <label><span><input type="checkbox" name="consent" required style={{ width: 'auto' }}/> Send this intention and selected passages to OpenAI</span></label>
      <div className="personal-actions"><button className="primary-button" disabled={busy}>Run with VISIONS Core</button>
        {busy && <button type="button" className="secondary-button" onClick={() => active.current?.abort()}>Stop waiting</button>}
      </div>
    </form>}
    {busy && <p role="status">Run in progress…</p>}
    {reflection && <article className="personal-record"><strong>VISIONS Core</strong><p>{reflection}</p>
      <button className="secondary-button" onClick={exportDraft}>Download reflection</button>
    </article>}
    {citations.length > 0 && <details><summary>Selected source references</summary>
      {citations.map(source => <article key={source.id} className="personal-record">
        <strong>[{source.citation}] {source.title}</strong><small>{source.author} · {source.locator}</small><p>{source.passage}</p><p>{source.provenance}</p>
      </article>)}
    </details>}
  </section>
}
