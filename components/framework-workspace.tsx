'use client'

import { useState, type CSSProperties, type FormEvent } from 'react'
import { Crosshair, Link2, Plus } from 'lucide-react'
import { agents, modules, type AgentId, type ModuleId } from '@/lib/codex'
import { frameworkSummary, ideaLimit, lensQuestions, removeIdea, type Framework, type Idea } from '@/lib/framework'
import { courseMaterial, type CourseMaterial } from '@/lib/course'
import { frameworkConnections, guideAnswerLimit } from '@/lib/guided'
import type { CourseApplication } from './course-answer'
import { LensNetwork } from './lens-network'
import type { FrameworkStore } from './use-framework'

type Props = { store: FrameworkStore; lens?: AgentId; domain?: ModuleId; course?: CourseMaterial; application?: CourseApplication; onReadCourse: (id: string) => void; onOpenGuide?: (domain?: ModuleId) => void }
type Draft = { lens: AgentId; domains: ModuleId[]; idea?: Idea; course?: CourseMaterial; application?: CourseApplication }

export function FrameworkWorkspace({ store, lens, domain, course, application, onReadCourse, onOpenGuide }: Props) {
  const { graph } = store
  const [filterLens, setFilterLens] = useState<AgentId | ''>(lens ?? '')
  const [filterDomain, setFilterDomain] = useState<ModuleId | ''>(domain ?? '')
  const [draft, setDraft] = useState<Draft | null>(() => {
    if (!course) return null
    const existing = application ? graph.ideas.find(idea => idea.courseId === course.id && idea.coursePromptId === application.promptId) : undefined
    return { lens: existing?.lens ?? course.lens, domains: existing?.domains ?? course.domains, course, idea: existing, application }
  })
  const [selected, setSelected] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')
  const summary = frameworkSummary(graph)
  const current = graph.ideas.find(idea => idea.id === selected)
  const visible = graph.ideas.filter(idea => (!filterLens || idea.lens === filterLens)
    && (!filterDomain || idea.domains.includes(filterDomain)) && (!course || idea.courseId === course.id))
  const networkEdges = frameworkConnections(graph)
  const linked = (id: string, edges = networkEdges) => graph.ideas.filter(idea => edges.some(edge => edge.includes(id) && edge.includes(idea.id) && idea.id !== id))

  async function commit(next: Framework, success: string) {
    setBusy(true)
    setError('')
    setNote('')
    try { await store.save(next); setNote(success); return true }
    catch (error) { setError(error instanceof Error ? error.message : 'Could not save your idea.'); return false }
    finally { setBusy(false) }
  }

  async function saveIdea(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!draft || busy) return
    const data = new FormData(event.currentTarget)
    const coursePromptId = draft.application?.promptId ?? draft.idea?.coursePromptId
    const existing = draft.idea ?? (draft.application && course
      ? graph.ideas.find(idea => idea.courseId === course.id && idea.coursePromptId === coursePromptId) : undefined)
    const idea: Idea = {
      id: existing?.id ?? crypto.randomUUID(), lens: data.get('lens') as AgentId,
      domains: data.getAll('domain') as ModuleId[], title: String(data.get('title')), detail: String(data.get('detail')),
      ...(coursePromptId ? { coursePromptId } : {}),
      ...(draft.idea?.courseId || draft.course?.id ? { courseId: draft.idea?.courseId ?? draft.course?.id } : {}),
    }
    if (!idea.domains.length || !idea.title.trim()) {
      setError('Give this idea a title and choose at least one life domain.')
      return
    }
    const connections = graph.connections.filter(edge => !edge.includes(idea.id))
    for (const id of data.getAll('link')) connections.push([idea.id, String(id)])
    const ideas = existing ? graph.ideas.map(existing => existing.id === idea.id ? idea : existing) : [...graph.ideas, idea]
    if (await commit({ ideas, connections }, existing ? 'Idea updated.' : 'Idea added to the network.')) {
      setSelected(idea.id)
      setDraft(null)
    }
  }

  function exportFramework() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(graph, null, 2)], { type: 'application/json' }))
    const download = document.createElement('a')
    download.href = url
    download.download = 'visions-framework.json'
    download.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  function startDraft(withLens: AgentId = filterLens || 'vision', domains: ModuleId[] = filterDomain ? [filterDomain] : []) {
    setError('')
    setDraft(course ? { lens: course.lens, domains: course.domains, course } : { lens: withLens, domains })
  }

  if (store.mode === 'loading') return <p role="status">Opening your VISIONS framework…</p>
  if (store.mode === 'failed') return <div><p role="alert">{store.error}</p><button className="secondary-button" onClick={store.reload}>Retry</button></div>
  if (store.mode === 'signed-out') return <p className="muted">Sign in from Lifestyle, Relationships, or Projects to open your private framework.</p>

  return <section className="framework-workspace" aria-label="VISIONS framework">
    <div className="framework-summary">
      <span><Crosshair size={16}/> {graph.ideas.length} {graph.ideas.length === 1 ? 'idea' : 'ideas'} · {networkEdges.length} {networkEdges.length === 1 ? 'connection' : 'connections'}</span>
      <small>{store.mode === 'device' ? 'Stored on this browser' : 'Private Supabase workspace'}</small>
    </div>
    {store.mode === 'device' && <p className="muted">Use non-sensitive ideas in this browser workspace. Account data is stored separately when Supabase is configured.</p>}
    {course && <p><button className="secondary-button" onClick={() => onReadCourse(course.id)}>Read this material</button></p>}
    {!lens && !domain && !course && <>
      <p>Start with a value, question, or practice. Apply any of the seven VISIONS lenses to one or more life domains, then connect related ideas.</p>
      <div className="framework-matrix-wrap">
        <table className="framework-matrix">
          <caption>Framework ideas by lens and life domain</caption>
          <thead><tr><th scope="col">Lens</th>{modules.map(module => <th scope="col" key={module.id} style={{ color: module.color }}>{module.name}</th>)}</tr></thead>
          <tbody>{summary.map(({ lens, domains }) => <tr key={lens.id}>
            <th scope="row" style={{ color: lens.color }}>{lens.name}</th>
            {domains.map(module => <td key={module.id}>
              <button type="button" className="secondary-button"
                aria-label={`${lens.name} in ${module.name}: ${module.count} ${module.count === 1 ? 'idea' : 'ideas'}`}
                aria-pressed={filterLens === lens.id && filterDomain === module.id}
                onClick={() => {
                  setFilterLens(lens.id)
                  setFilterDomain(module.id)
                  setSelected('')
                  if (!module.count && graph.ideas.length < ideaLimit) startDraft(lens.id, [module.id])
                  else setDraft(null)
                }}>{module.count || <Plus size={13}/>}</button>
            </td>)}
          </tr>)}</tbody>
        </table>
      </div>
    </>}
    {lens && <p>{lensQuestions[lens]}</p>}
    <div className="personal-actions framework-filters">
      {!lens && <label>Lens <select value={filterLens} onChange={event => { setFilterLens(event.target.value as AgentId | ''); setSelected('') }}>
        <option value="">All lenses</option>{agents.map(agent => <option value={agent.id} key={agent.id}>{agent.name}</option>)}
      </select></label>}
      {!domain && <label>Life domain <select value={filterDomain} onChange={event => { setFilterDomain(event.target.value as ModuleId | ''); setSelected('') }}>
        <option value="">All domains</option>{modules.map(module => <option value={module.id} key={module.id}>{module.name}</option>)}
      </select></label>}
      <button className="primary-button" disabled={busy || graph.ideas.length >= ideaLimit} onClick={() => startDraft()}><Plus size={14}/> Add idea</button>
      {!lens && !domain && graph.ideas.length > 0 && <button className="secondary-button" onClick={exportFramework}>Export framework</button>}
      {store.mode === 'account' && <button className="secondary-button" disabled={busy} onClick={store.reload}>Reload framework</button>}
    </div>
    {graph.ideas.length >= ideaLimit && <p className="muted">This framework has reached its 80-idea limit.</p>}
    {error && <p role="alert">{error}</p>}
    {note && <p role="status">{note}</p>}
    {draft && <IdeaForm key={draft.idea?.id ?? draft.lens + draft.domains.join(',')} draft={draft} graph={graph} busy={busy}
      connected={draft.idea ? linked(draft.idea.id, graph.connections).map(idea => idea.id) : draft.course
        ? graph.ideas.filter(idea => idea.courseId && (idea.courseId === draft.course?.id || idea.courseId === draft.course?.parent || courseMaterial(idea.courseId)?.parent === draft.course?.id))
          .slice(0, Math.max(0, 160 - graph.connections.length)).map(idea => idea.id) : []} onSave={saveIdea} onCancel={() => { setDraft(null); setError('') }}/>}
    {filterLens && visible.length > 0 && <LensNetwork ideas={visible} connections={networkEdges}
      selected={selected} onSelect={id => { setSelected(id); setConfirm('') }}/>}
    {!visible.length && !draft && <p className="muted">No ideas in this view yet.</p>}
    <ul className="framework-ideas">
      {visible.map(idea => <li key={idea.id}>
        <button className="framework-idea" style={{ '--accent': agents.find(agent => agent.id === idea.lens)?.color } as CSSProperties}
          aria-pressed={selected === idea.id} onClick={() => { setSelected(idea.id); setConfirm('') }}>
          <strong>{idea.title}</strong>
          <span>{idea.domains.map(id => modules.find(module => module.id === id)?.name).join(' · ')}</span>
          <small><Link2 size={12}/> {linked(idea.id).length}</small>
        </button>
      </li>)}
    </ul>
    {current && <article className="personal-record framework-detail">
      <h3>{current.title}</h3>
      <small>{agents.find(agent => agent.id === current.lens)?.name} · {current.domains.map(id => modules.find(module => module.id === id)?.name).join(', ')}</small>
      {current.courseId && courseMaterial(current.courseId) && <p><button className="secondary-button" onClick={() => onReadCourse(current.courseId!)}>{courseMaterial(current.courseId)?.title}</button></p>}
      {current.detail && <p>{current.detail}</p>}
      {linked(current.id).length > 0 && <div className="framework-linked">
        <h4>Connected ideas</h4>
        {linked(current.id).map(idea => <button className="secondary-button" key={idea.id} onClick={() => { setSelected(idea.id); setConfirm('') }}>
          <Link2 size={13}/> {idea.title} · {agents.find(agent => agent.id === idea.lens)?.name}
        </button>)}
      </div>}
      <div className="personal-actions">
        {current.guideDomain ? <a className="secondary-button" href="#guide" onClick={event => {
          event.preventDefault()
          onOpenGuide?.(current.guideDomain)
        }}>Edit in guided framework</a> : <button className="secondary-button" disabled={busy} onClick={() => setDraft({ lens: current.lens, domains: current.domains, idea: current })}>Edit idea</button>}
        {confirm !== current.id ? <button className="secondary-button" disabled={busy} onClick={() => setConfirm(current.id)}>Remove idea</button> : <>
          <button className="secondary-button" disabled={busy} onClick={async () => {
            if (await commit(removeIdea(graph, current.id), 'Idea and its connections removed.')) {
              setDraft(null)
              setSelected('')
              setConfirm('')
            }
          }}>Confirm removal</button>
          <button className="secondary-button" type="button" onClick={() => setConfirm('')}>Cancel</button>
        </>}
      </div>
    </article>}
  </section>
}

function IdeaForm({ draft, graph, busy, connected, onSave, onCancel }: {
  draft: Draft; graph: Framework; busy: boolean; connected: string[];
  onSave: (event: FormEvent<HTMLFormElement>) => void; onCancel: () => void
}) {
  const [lens, setLens] = useState(draft.lens)
  const [links, setLinks] = useState(connected)
  const [query, setQuery] = useState('')
  const candidates = graph.ideas.filter(idea => idea.id !== draft.idea?.id
    && (links.includes(idea.id) || idea.title.toLowerCase().includes(query.trim().toLowerCase())))

  return <form className="personal-form framework-form" onSubmit={onSave}>
    <h3>{draft.idea ? 'Edit framework idea' : 'Add framework idea'}</h3>
    <label>VISIONS lens <select name="lens" value={lens} onChange={event => setLens(event.target.value as AgentId)}>
      {agents.map(agent => <option value={agent.id} key={agent.id}>{agent.name}</option>)}
    </select></label>
    <label>Idea title <input name="title" autoComplete="off" maxLength={100} required defaultValue={draft.idea?.title ?? (draft.application ? (draft.course?.title.replace(/^\d+\. /, '').slice(0, 70) ?? '') + ' · ' + draft.application.title : undefined)}/></label>
    <label>Reflection <textarea name="detail" maxLength={draft.course || draft.idea?.courseId ? guideAnswerLimit : 400} rows={3} placeholder={draft.course ? 'What will you apply, and what is your next step?' : lensQuestions[lens]} defaultValue={draft.application?.answer ?? draft.idea?.detail}/></label>
    <fieldset><legend>Applies across</legend>
      {modules.map(module => <label className="framework-check" key={module.id}><input name="domain" type="checkbox" value={module.id} defaultChecked={draft.domains.includes(module.id)}/>{module.name}</label>)}
    </fieldset>
    {graph.ideas.some(idea => idea.id !== draft.idea?.id) && <details open={links.length > 0 || undefined}>
      <summary>Connect related ideas ({links.length})</summary>
      <label>Find an idea to connect <input value={query} onChange={event => setQuery(event.target.value)}/></label>
      <div className="framework-link-picker">{candidates.map(idea => <label className="framework-check" key={idea.id}>
        <input type="checkbox" name="link" value={idea.id} checked={links.includes(idea.id)} onChange={event => {
          setLinks(prev => event.target.checked ? [...prev, idea.id] : prev.filter(id => id !== idea.id))
        }}/>{idea.title} · {agents.find(agent => agent.id === idea.lens)?.name}
      </label>)}</div>
    </details>}
    <div className="personal-actions">
      <button className="primary-button" disabled={busy}>{busy ? 'Saving…' : 'Save idea'}</button>
      <button className="secondary-button" type="button" disabled={busy} onClick={onCancel}>Cancel</button>
    </div>
  </form>
}
