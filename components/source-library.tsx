'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { sourceFields, sourceKinds, type Source } from '@/lib/sources'

export function SourceLibrary() {
  const [sources, setSources] = useState<Source[]>([])
  const [query, setQuery] = useState('')
  const [offset, setOffset] = useState(0)
  const [revision, setRevision] = useState(0)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [remove, setRemove] = useState<string | null>(null)

  useEffect(() => {
    const pending = new AbortController()
    fetch('/api/sources?' + new URLSearchParams({ q: query, offset: String(offset) }), { signal: pending.signal })
      .then(async response => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error)
        setSources(data.sources)
        setReady(true)
      }).catch(error => {
        if (!pending.signal.aborted) setError(error instanceof Error ? error.message : 'Could not load sources.')
      })
    return () => pending.abort()
  }, [query, offset, revision])

  async function change(payload: Record<string, unknown>) {
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/sources', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      })
      if (!response.ok) throw new Error((await response.json()).error)
      setRemove(null)
      setQuery('')
      setOffset(0)
      setRevision(value => value + 1)
      return true
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not update sources.')
      return false
    } finally {
      setBusy(false)
    }
  }

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const fields = Object.fromEntries(new FormData(form))
    if (await change({ ...fields, action: 'add', permitted: fields.permitted === 'on' })) form.reset()
  }

  return <section className="panel workspace-surface personal-workspace">
    <h2>Private source library</h2>
    {error && <p role="alert">{error}</p>}
    {!ready && !error && <p role="status">Loading source library…</p>}
    {ready && <>
      <form className="personal-form" onSubmit={event => {
        event.preventDefault()
        setError('')
        setOffset(0)
        setQuery(String(new FormData(event.currentTarget).get('title') ?? ''))
        setRevision(value => value + 1)
      }}>
        <label>Find by source title <input name="title" maxLength={100}/></label>
        <button className="secondary-button">Search sources</button>
      </form>
      {sources.map(source => <article className="personal-record" key={source.id}>
        <strong>{source.title}</strong>
        <small>{source.author} · {source.locator} · {sourceKinds[source.kind]}</small>
        <details><summary>Passage and provenance</summary>
          <p>{source.passage}</p>
          {source.edition && <p>{source.edition}</p>}
          <p>Origin — {source.provenance}</p><p>Rights — {source.rights}</p>
        </details>
        {remove === source.id ? <div className="personal-actions">
          <button className="secondary-button" disabled={busy} onClick={() => void change({ action: 'delete', id: source.id })}>Permanently remove source</button>
          <button className="secondary-button" onClick={() => setRemove(null)}>Cancel</button>
        </div> : <button className="secondary-button" onClick={() => setRemove(source.id)}>Remove source</button>}
      </article>)}
      {!sources.length && <p className="muted">No matching sources.</p>}
      <div className="personal-actions">
        {offset > 0 && <button className="secondary-button" onClick={() => setOffset(value => value - 20)}>Previous sources</button>}
        {sources.length === 20 && offset < 10000 && <button className="secondary-button" onClick={() => setOffset(value => value + 20)}>More sources</button>}
      </div>
      <details className="personal-workspace"><summary>Add a licensed passage</summary>
        <form className="personal-form personal-workspace" onSubmit={add}>
          <label>Source type <select name="kind">{Object.entries(sourceKinds).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
          {sourceFields.map(([id, label, maxLength, required]) => <label key={id}>{label}
            {id === 'passage' ? <textarea name={id} required={required} maxLength={maxLength} rows={6}/>
              : <input name={id} required={required} maxLength={maxLength}/>}
          </label>)}
          <label><span><input name="permitted" type="checkbox" required style={{ width: 'auto' }}/> I have permission to store this passage.</span></label>
          <button className="primary-button" disabled={busy}>Save source</button>
        </form>
      </details>
    </>}
  </section>
}
