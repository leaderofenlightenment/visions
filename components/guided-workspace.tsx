'use client'

import { useRef, useState, type FormEvent } from 'react'
import Markdown from 'react-markdown'
import { agents, type AgentId, type ModuleId } from '@/lib/codex'
import type { Framework } from '@/lib/framework'
import { codexClosing, codexIntroduction, contentDomains, documentSections, guideAnswerLimit, movements, saveMovement } from '@/lib/guided'
import { ChatGPTGuide } from './chatgpt-guide'
import type { FrameworkStore } from './use-framework'

export const guidePdf = '/visions-user-guide.pdf'

type Edits = Partial<Record<AgentId, Partial<Record<ModuleId, string>>>>

export function GuidedWorkspace({ store }: { store: FrameworkStore }) {
  const [step, setStep] = useState(0)
  const [edits, setEdits] = useState<Edits>({})
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const movement = movements[step]
  const letter = agents[step].letter
  const saved = store.graph.ideas.filter(idea => idea.guideDomain)
  const unsaved = edits[movement.id] ?? {}

  function answer(lens: AgentId, domain: ModuleId) {
    return saved.find(idea => idea.guideDomain === domain && idea.lens === lens)?.detail ?? ''
  }

  function hasChanges(lens: AgentId) {
    const pending = edits[lens]
    return Boolean(pending && contentDomains.some(({ id }) => pending[id] !== undefined && pending[id]?.trim() !== answer(lens, id)))
  }

  const changed = hasChanges(movement.id)
  const dirty = movements.some(item => hasChanges(item.id))

  function openStep(index: number) {
    setStep(index)
    setMessage(null)
  }

  async function persist(graph: Framework) {
    setBusy(true)
    try { await store.save(graph) }
    finally { setBusy(false) }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy || !changed) return
    setMessage(null)
    try {
      await persist(saveMovement(store.graph, movement.id, unsaved, () => crypto.randomUUID()))
      setEdits(current => ({ ...current, [movement.id]: undefined }))
      setMessage({ text: 'Movement saved. Your workspace documents are up to date.' })
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'Could not save your answers.', error: true })
    }
  }

  if (store.mode === 'loading') return <p role="status">Opening your VISIONS Core…</p>
  if (store.mode === 'failed') return <div><p role="alert">{store.error}</p><button className="secondary-button" onClick={store.reload}>Retry</button></div>
  if (store.mode === 'signed-out') return <section className="panel workspace-surface">
    <p>Sign in to open your private Codex, or use this browser for non-sensitive reflections.</p>
    <div className="personal-actions"><a className="primary-button" href="#settings">Sign in</a>
      <button className="secondary-button" onClick={store.openDevice}>Use this browser</button>
      <a className="secondary-button" href={guidePdf} download>Download workbook</a></div>
  </section>

  return <section className="panel workspace-surface guided-workspace" aria-label="VISIONS method">
    <div className="section-row">
      <label className="guide-progress"><span>{saved.length} of 21 prompts saved</span><progress max={21} value={saved.length}/></label>
      <a className="secondary-button" href={guidePdf} download>Download PDF manual</a>
    </div>
    <ChatGPTGuide graph={store.graph} busy={busy} dirty={dirty} workbook={guidePdf} onSave={persist}/>
    <details className="codex-reading"><summary>About the VISIONS method</summary><Markdown>{codexIntroduction}</Markdown><p>{codexClosing}</p></details>
    {saved.length > 0 && <p className="muted">If you used an earlier workbook, review your saved answers against the prompts below.</p>}
    <div className="guide-tabs movement-tabs" aria-label="VISIONS movements">
      {movements.map((item, index) => <button key={item.id} className="secondary-button" type="button" aria-pressed={step === index} disabled={busy}
        onClick={() => openStep(index)}>{item.name}<small>{saved.filter(idea => idea.lens === item.id).length}/3</small></button>)}
    </div>
    <div className="movement-title">
      <p className="eyebrow" style={{ color: agents[step].color }}>{letter} — {movement.name}</p>
      <h2 ref={heading} tabIndex={-1}>{movement.title}</h2>
      <details className="codex-reading" key={movement.id}><summary>Read the introduction to {movement.name}</summary><p>{movement.reading}</p></details>
    </div>
    <form className="guide-prompts" onSubmit={save}>
      {contentDomains.map(({ id, topic }) => {
        const fieldId = `guide-${movement.id}-${id}`
        const { pillar, prompt } = movement.prompts[id]
        return <div className="guide-prompt" key={fieldId}>
          <label htmlFor={fieldId}>{topic} — {pillar}</label>
          <p id={fieldId + '-question'}>{prompt}</p>
          <textarea id={fieldId} aria-describedby={fieldId + '-question'} maxLength={guideAnswerLimit} rows={3} value={unsaved[id] ?? answer(movement.id, id)} disabled={busy}
            onChange={event => {
              const value = event.target.value
              setEdits(current => ({ ...current, [movement.id]: { ...current[movement.id], [id]: value } }))
            }}/>
        </div>
      })}
      <div className="personal-actions">
        <button className="primary-button" disabled={busy || !changed}>{busy ? 'Saving…' : 'Save ' + movement.name}</button>
        {step < movements.length - 1 && <button className="secondary-button" type="button" disabled={busy} onClick={() => {
          openStep(step + 1)
          heading.current?.focus()
        }}>Next movement</button>}
      </div>
      {message && <p role={message.error ? 'alert' : 'status'}>{message.text}</p>}
      {dirty && !busy && !message?.error && <p className="muted">Save any edited movement before leaving the Core.</p>}
    </form>
  </section>
}

export function DomainDocument({ store, domain }: { store: FrameworkStore; domain: ModuleId }) {
  const content = contentDomains.find(item => item.id === domain)!
  const sections = documentSections(store.graph, domain)
  const applications = store.graph.ideas.filter(idea => idea.courseId && idea.domains.includes(domain))
  function download() {
    const text = sections.map(({ heading, detail }) => '## ' + heading + '\n\n' + detail)
    if (applications.length) text.push('## Course applications\n\n' + applications.map(idea => '### ' + idea.title + '\n\n' + idea.detail).join('\n\n'))
    const url = URL.createObjectURL(new Blob(['# ' + content.document + '\n\n' + text.join('\n\n') + '\n'], { type: 'text/markdown;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'visions-' + domain + '.md'
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return <section className="panel workspace-surface domain-document" aria-labelledby={domain + '-document'}>
    <div className="section-row"><h2 id={domain + '-document'}>{content.document}</h2><div className="personal-actions">
      <a className="secondary-button" href="#core">{sections.length ? 'Edit in VISIONS Core' : 'Open VISIONS Core'}</a>
      {(sections.length > 0 || applications.length > 0) && <button className="secondary-button" onClick={download}>Download document</button>}
    </div></div>
    {sections.length > 0 ? <ul className="document-sections">{sections.map(({ id, heading, detail }) =>
      <li key={id}><h3>{heading}</h3><p>{detail}</p></li>
    )}</ul> : <p>Save a {content.topic} answer in the Core to start this document.</p>}
    {applications.length > 0 && <details className="codex-reading"><summary>Course applications ({applications.length})</summary>
      {applications.map(idea => <article className="personal-record" key={idea.id}><h3>{idea.title}</h3><p>{idea.detail}</p></article>)}
    </details>}
  </section>
}
