'use client'

import { useRef, useState, type FormEvent } from 'react'
import { ExternalLink } from 'lucide-react'
import { edenApp, edenDraftLimit, edenKeyHelp, edenReferral } from '@/lib/eden'
import { documentSections } from '@/lib/guided'
import type { Framework } from '@/lib/framework'

export function EdenWorkflow({ graph }: { graph: Framework }) {
  const draft = useRef<HTMLTextAreaElement>(null)
  const apiKey = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<{ text: string; error?: boolean } | null>(null)
  const [busy, setBusy] = useState(false)

  function loadPlan() {
    if (!draft.current) return
    draft.current.value = documentSections(graph, 'business').map(({ heading, detail }) => '## ' + heading + '\n\n' + detail).join('\n\n')
    draft.current.focus()
  }

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const data = new FormData(event.currentTarget)
    if (apiKey.current) apiKey.current.value = ''
    setBusy(true)
    setStatus(null)
    try {
      const response = await fetch('/api/eden/drafts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: data.get('apiKey'), title: data.get('title'), content: data.get('content'), consent: data.get('consent') === 'on' }),
      })
      const result = await response.json()
      if (!response.ok || result.saved !== true) throw new Error(result.error ?? 'Eden did not confirm the draft.')
      setStatus({ text: 'Draft saved to your Eden Library.' })
    } catch (error) {
      setStatus({ text: error instanceof Error ? error.message : 'Could not send draft to Eden.', error: true })
    } finally { setBusy(false) }
  }

  return <div className="eden-workflow">
    <h3>Put it to work in Eden</h3>
    <p>Learn in Eden’s creator course, research what your audience responds to, and schedule finished posts. Availability depends on your Eden plan.</p>
    <div className="personal-actions">
      <a className="primary-button" href={edenReferral} target="_blank" rel="noopener noreferrer sponsored">Explore Eden <ExternalLink size={14}/></a>
      <a className="secondary-button" href={edenApp} target="_blank" rel="noopener noreferrer">Open my Eden workspace</a>
    </div>
    <p className="muted">Affiliate link. Eric may earn a commission on eligible Eden purchases. Eden access is arranged separately.</p>
    <details className="codex-reading">
      <summary>Send a business draft to Eden</summary>
      <p>Sign in to your enrolled VISIONS account. Use a personal Eden API key with Library edit permission. VISIONS uses your key for this request and sends the title and text shown here to your default Eden Library.</p>
      <p><a className="text-link" href={edenKeyHelp} target="_blank" rel="noopener noreferrer">How to create an Eden API key</a></p>
      <form className="personal-form" onSubmit={send}>
        <label>Draft title <input name="title" required maxLength={120} defaultValue="VISIONS Business Plan"/></label>
        <label>Draft text <textarea name="content" ref={draft} required rows={7} maxLength={edenDraftLimit}/></label>
        {documentSections(graph, 'business').length > 0 && <button className="secondary-button" type="button" disabled={busy} onClick={loadPlan}>Load Business Plan</button>}
        <label>Eden API key <input ref={apiKey} name="apiKey" type="password" autoComplete="off" maxLength={512} required/></label>
        <label className="inline-check"><input name="consent" type="checkbox" required/> I approve sending this draft to my Eden Library.</label>
        <button className="primary-button" disabled={busy}>{busy ? 'Sending…' : 'Save draft in Eden'}</button>
        {status && <p role={status.error ? 'alert' : 'status'}>{status.text}</p>}
      </form>
    </details>
  </div>
}
