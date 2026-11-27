'use client'

import { useState, type FormEvent } from 'react'
import { agents, modules, type AgentId, type ModuleId } from '@/lib/codex'
import { guideAnswerLimit, guideAnswers, guidedDomains, saveGuideAnswers } from '@/lib/guided'
import type { FrameworkStore } from './use-framework'

export const guidePdf = '/visions-user-guide.pdf'

export function GuidedWorkspace({ store, onSignIn, initial = 'lifestyle' }: { store: FrameworkStore; onSignIn: () => void; initial?: ModuleId }) {
  const [selected, setSelected] = useState<ModuleId>(initial)
  if (store.mode === 'signed-out') return <section className="panel workspace-surface">
    <h2>Complete your VISIONS framework</h2>
    <p>Sign in to save answers to your account, or start with non-sensitive notes saved to this browser.</p>
    <div className="personal-actions"><button className="primary-button" onClick={onSignIn}>Sign in</button><button className="secondary-button" onClick={store.openDevice}>Continue on this device</button><a className="secondary-button" href={guidePdf} download>Download PDF manual</a></div>
  </section>
  if (store.mode === 'loading') return <p role="status">Opening your framework…</p>
  if (store.mode === 'failed') return <><p role="alert">{store.error}</p><button className="secondary-button" onClick={store.reload}>Retry</button></>
  return <GuideForm store={store} selected={selected} setSelected={setSelected}/>
}

function GuideForm({ store, selected, setSelected }: {
  store: FrameworkStore; selected: ModuleId; setSelected: (id: ModuleId) => void
}) {
  const [edits, setEdits] = useState<Partial<Record<ModuleId, Partial<Record<AgentId, string>>>>>({})
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null)
  const frame = guidedDomains.find(domain => domain.id === selected)!
  const saved = guideAnswers(store.graph, selected)
  const total = store.graph.ideas.filter(idea => idea.guideDomain).length
  const unsaved = edits[selected] ?? {}
  const changed = Object.keys(unsaved).length > 0

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy || !changed) return
    setBusy(true)
    try {
      await store.save(saveGuideAnswers(store.graph, selected, unsaved, () => crypto.randomUUID()))
      setEdits(current => ({ ...current, [selected]: {} }))
      setMessage({ text: 'Saved to the network and your domain document.' })
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'Could not save your answers.', error: true })
    } finally { setBusy(false) }
  }

  return <section className="panel workspace-surface guided-workspace">
    <div className="section-row">
      <h2>Complete your VISIONS framework</h2>
      <a className="secondary-button" href={guidePdf} download>Download PDF manual</a>
    </div>
    <p>Complete any section, save it, and continue at your own pace. Your saved answers appear in the Nexus and in the corresponding domain document.</p>
    <details><summary>How the three frameworks connect</summary>
      <p>Theosis attends to mind, body, and soul. Creativity develops restraint, skill, and community. Psychology brings self-mastery, household dynamics, and ministry into view.</p>
      <p className="muted">Across the three frameworks, trace health through mind, asceticism, and self-mastery. Trace wealth through body, skillset, and household dynamics. Trace relationships through soul, community, and ministry.</p>
    </details>
    <label className="guide-progress"><span>{total} of 21 prompts saved</span><progress max={21} value={total}/></label>
    <div className="personal-actions guide-tabs" aria-label="Framework domains">
      {modules.map(module => <button key={module.id} className="secondary-button" type="button" aria-pressed={selected === module.id}
        disabled={busy} onClick={() => { setSelected(module.id); setMessage(null) }}>
        {module.name} · {guideAnswers(store.graph, module.id).length}/7
      </button>)}
    </div>
    <h3>{frame.title}</h3><p className="muted">{frame.pillars.join(' · ')}</p>
    {store.mode === 'device' && <p className="muted">This workspace saves to this browser. Use it for non-sensitive notes.</p>}
    <form className="guide-prompts" onSubmit={save}>
      {frame.prompts.map(([lens, title, pillar, question]) => {
        const agent = agents.find(agent => agent.id === lens)!
        const id = 'guide-' + selected + '-' + lens
        const value = unsaved[lens] ?? saved.find(idea => idea.lens === lens)?.detail ?? ''
        return <div className="guide-prompt" key={id}>
          <label htmlFor={id}><span style={{ color: agent.color }}>{agent.letter}</span> {title}</label>
          <p id={id + '-question'} className="muted">{pillar} · {question}</p>
          <textarea id={id} aria-describedby={id + '-question'} maxLength={guideAnswerLimit} rows={3} value={value} disabled={busy}
            onChange={event => {
              const text = event.target.value
              setEdits(current => ({ ...current, [selected]: { ...current[selected], [lens]: text } }))
            }}/>
        </div>
      })}
      <div className="personal-actions">
        <button className="primary-button" disabled={busy || !changed}>{busy ? 'Saving…' : 'Save ' + modules.find(module => module.id === selected)?.name + ' to VISIONS'}</button>
        <a className="secondary-button" href={'#' + selected}>Open domain document</a>
      </div>
      {message && <p role={message.error ? 'alert' : 'status'}>{message.text}</p>}
      {changed && !busy && !message?.error && <p className="muted">Save to keep your changes before leaving this page.</p>}
    </form>
  </section>
}

export function DomainDocument({ store, domain, onStart }: { store: FrameworkStore; domain: ModuleId; onStart: () => void }) {
  const frame = guidedDomains.find(item => item.id === domain)!
  const answers = guideAnswers(store.graph, domain)
  const applications = store.graph.ideas.filter(idea => idea.domains.includes(domain) && idea.courseId)
  function download() {
    const sections = frame.prompts.map(([lens, title]) => '## ' + title + '\n\n' + (answers.find(idea => idea.lens === lens)?.detail ?? 'Awaiting your answer.'))
    if (applications.length) sections.push('## Course applications\n\n' + applications.map(idea => '### ' + idea.title + '\n\n' + idea.detail).join('\n\n'))
    const url = URL.createObjectURL(new Blob(['# ' + frame.title + '\n\n' + sections.join('\n\n') + '\n'], { type: 'text/markdown;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'visions-' + domain + '.md'
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return <section className="panel workspace-surface domain-document">
    <div className="section-row"><h2>{frame.title} document</h2><div className="personal-actions">
      <button className="secondary-button" type="button" onClick={onStart}>{answers.length ? 'Edit framework answers' : 'Start the framework'}</button>
      {(answers.length > 0 || applications.length > 0) && <button className="secondary-button" onClick={download}>Download document</button>}
    </div></div>
    <p className="muted">{answers.length} of 7 answers saved · Updates from your VISIONS framework.</p>
    {answers.length > 0 ? <ol>{frame.prompts.map(([lens, title]) => {
      const answer = answers.find(idea => idea.lens === lens)
      return <li key={lens}><h3>{title}</h3><p className={answer ? undefined : 'muted'}>{answer?.detail ?? 'Awaiting your answer.'}</p></li>
    })}</ol> : <p>Save your first answer in the guided framework to start this document.</p>}
    {applications.length > 0 && <details><summary>Course applications ({applications.length})</summary>
      {applications.map(idea => <article className="personal-record" key={idea.id}><strong>{idea.title}</strong><p>{idea.detail}</p></article>)}
    </details>}
  </section>
}
