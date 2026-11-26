'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { agents, type AgentId } from '@/lib/codex'
import type { AgentResult } from '@/lib/agent-runtime'

export function AgentRun({ agent }: { agent?: AgentId }) {
  const [access, setAccess] = useState<{ configured: boolean; signedIn: boolean } | null>(null)
  const [results, setResults] = useState<AgentResult[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const active = useRef<AbortController | null>(null)

  useEffect(() => {
    const check = new AbortController()
    fetch('/api/agents', { signal: check.signal }).then(response => response.json()).then(setAccess)
      .catch(() => { if (!check.signal.aborted) setError('Could not check agent access.') })
    return () => { check.abort(); active.current?.abort() }
  }, [])

  async function run(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (active.current) return
    const form = new FormData(event.currentTarget)
    const control = new AbortController()
    active.current = control
    setBusy(true)
    setError('')
    setResults([])
    try {
      const response = await fetch('/api/agents', {
        method: 'POST', signal: control.signal, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent: agent ?? null, intention: form.get('intention'), consent: form.get('consent') === 'on' }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)
      setResults(result.results)
    } catch (error) {
      setError(control.signal.aborted ? 'Stopped waiting for this run.' : error instanceof Error ? error.message : 'The run failed.')
    } finally {
      active.current = null
      setBusy(false)
    }
  }

  return <section className="dialog-section">
    <h3>Live execution</h3>
    {error && <p role="alert">{error}</p>}
    {!access && !error && <p role="status">Checking agent access…</p>}
    {access && !access.configured && <p className="muted">AI provider unconfigured. See the README for setup.</p>}
    {access?.configured && !access.signedIn && <p className="muted">Sign in from Lifestyle, Relationships, or Projects to run an agent.</p>}
    {access?.signedIn && <form className="personal-form" onSubmit={run}>
      <label>Intention <textarea name="intention" required maxLength={1000}/></label>
      <label><span><input type="checkbox" name="consent" required style={{ width: 'auto' }}/> Send this intention to OpenAI</span></label>
      <div className="personal-actions"><button className="primary-button" disabled={busy}>Run {agent ? 'agent' : 'workflow'}</button>
        {busy && <button type="button" className="secondary-button" onClick={() => active.current?.abort()}>Stop waiting</button>}
      </div>
    </form>}
    {busy && <p role="status">Run in progress…</p>}
    {results.map(result => <article className="personal-record" key={result.agent}>
      <strong>{agents.find(agent => agent.id === result.agent)?.name}</strong><p>{result.text}</p>
    </article>)}
  </section>
}
