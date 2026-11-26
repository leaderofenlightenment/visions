'use client'

import { useEffect, useState, useSyncExternalStore, type CSSProperties, type FormEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import {
  Activity, Bell, ChevronDown, ChevronRight, CircleHelp, Command, Crosshair, FolderOpen, Layers3,
  LockKeyhole, Menu, Network, Plus, Search, Settings2, Sparkles, Workflow, X,
} from 'lucide-react'
import { agents, destinations, domains, matches, modules, outputs, planAgents, stages, type AgentId, type Destination, type Draft, type ModuleId } from '@/lib/codex'
import { BrandMark } from './brand'
import { Dialog } from './dialog'
import { agentIcons, domainIcons, moduleIcons, navIcons, outputIcons } from './icons'
import { NeuralNetwork } from './neural-network'
import { Wave } from './wave'
import { AgentRun } from './agent-run'
import { PersonalWorkspace } from './personal-workspace'

type Overlay =
  | { kind: 'palette' | 'notifications' | 'profile' | 'plan' }
  | { kind: 'agent'; id: AgentId | 'core' }
  | { kind: 'domain' | 'stage'; index: number }
  | { kind: 'output'; id: (typeof outputs)[number]['id'] }

type LocalPreferences = { reduced?: boolean; lite?: boolean; modules?: Partial<Record<ModuleId, boolean>> }
type LocalState = { preferences: LocalPreferences; drafts: Draft[] }
const fallback = '{"preferences":{},"drafts":[]}'
const storageKey = 'visions.nexus.v1'
const accent = (color: string) => ({ '--accent': color } as CSSProperties)

function listenStorage(callback: () => void) {
  window.addEventListener('visions-storage', callback)
  window.addEventListener('storage', callback)
  return () => {
    window.removeEventListener('visions-storage', callback)
    window.removeEventListener('storage', callback)
  }
}

function getSaved() {
  try { return localStorage.getItem(storageKey) ?? fallback }
  catch { return fallback }
}

function readSaved(): LocalState {
  try { return JSON.parse(getSaved()) as LocalState }
  catch { return JSON.parse(fallback) as LocalState }
}

function saveLocal(data: LocalState) {
  localStorage.setItem(storageKey, JSON.stringify(data))
  window.dispatchEvent(new Event('visions-storage'))
}

function subscribeDestination(callback: () => void) {
  window.addEventListener('hashchange', callback)
  return () => window.removeEventListener('hashchange', callback)
}

function getDestination(): Destination {
  const hash = window.location.hash.slice(1)
  return destinations.find(([id]) => id === hash)?.[0] ?? 'dashboard'
}

function media(query: string) {
  return {
    listen: (callback: () => void) => {
      const condition = window.matchMedia(query)
      condition.addEventListener('change', callback)
      return () => condition.removeEventListener('change', callback)
    },
    read: () => window.matchMedia(query).matches,
  }
}
const systemMotion = media('(prefers-reduced-motion: reduce)')
const smallScreen = media('(max-width: 700px)')
const off = () => false

const domainPoints = domains.map((domain, i) => {
  const theta = (i / domains.length) * Math.PI * 2 - Math.PI / 2
  return { ...domain, x: 90 + Math.cos(theta) * 59, y: 75 + Math.sin(theta) * 56 }
})

function KnowledgeMap() {
  return <svg viewBox="0 0 180 150" className="knowledge-map" aria-hidden="true">
    <circle cx="90" cy="75" r="69" fill="none" stroke="#8c64ed" strokeOpacity=".17" strokeDasharray="2 4"/>
    <circle cx="90" cy="75" r="46" fill="none" stroke="#ad73d8" strokeOpacity=".17"/>
    {domainPoints.flatMap((point, index) => domainPoints.slice(index + 1).map((end, link) =>
      <path key={index + ':' + link} d={`M${point.x} ${point.y} Q90 75 ${end.x} ${end.y}`} stroke={point.color} strokeWidth=".65" strokeOpacity=".37" fill="none"/>
    ))}
    {domainPoints.map((point, index) => <g key={point.name} style={{ color: point.color }}>
      <line x1={point.x} y1={point.y} x2={domainPoints[(index + 1) % domains.length].x} y2={domainPoints[(index + 1) % domains.length].y} stroke={point.color} opacity=".32"/>
      <circle cx={point.x} cy={point.y} r="8" fill="currentColor" opacity=".13"/><circle cx={point.x} cy={point.y} r="3.4" fill="currentColor" className="map-star"/>
    </g>)}
    <circle cx="90" cy="75" r="10" fill="#a874ff" opacity=".2"/><circle cx="90" cy="75" r="4" fill="#eedfff" className="map-star" style={{ color: '#d393ff' }}/>
  </svg>
}

export function Nexus() {
  const [lifestyleSection, setLifestyleSection] = useState<'habit' | 'journal'>('habit')
  const [overlay, setOverlay] = useState<Overlay | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [domainQuery, setDomainQuery] = useState('')
  const [intention, setIntention] = useState('')
  const [planError, setPlanError] = useState('')
  const [notice, setNotice] = useState('')
  const saved = useSyncExternalStore(listenStorage, getSaved, () => fallback)
  const destination = useSyncExternalStore(subscribeDestination, getDestination, () => 'dashboard' as Destination)
  const reduceByDefault = useSyncExternalStore(systemMotion.listen, systemMotion.read, off)
  const liteByDefault = useSyncExternalStore(smallScreen.listen, smallScreen.read, off)
  let local: LocalState
  try { local = JSON.parse(saved) as LocalState }
  catch { local = JSON.parse(fallback) as LocalState }
  const { preferences, drafts } = local
  const reduced = reduceByDefault || (preferences.reduced ?? false)
  const lite = preferences.lite ?? liteByDefault
  const activeModules = modules.filter(module => preferences.modules?.[module.id] !== false)
  const selectedAgent = overlay?.kind === 'agent' ? agents.find(agent => agent.id === overlay.id) : undefined

  useEffect(() => {
    function shortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setQuery('')
        setOverlay({ kind: 'palette' })
      }
    }
    window.addEventListener('keydown', shortcut)
    return () => window.removeEventListener('keydown', shortcut)
  }, [])

  function paletteKeys(event: ReactKeyboardEvent<HTMLDivElement>) {
    const input = event.currentTarget.querySelector('input')
    const results = Array.from(event.currentTarget.querySelectorAll('button'))
    if (!results.length) return
    const index = results.findIndex(button => button === event.target)
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      results[Math.min(index + 1, results.length - 1)].focus()
    }
    if (event.key === 'ArrowUp' && index >= 0) {
      event.preventDefault()
      if (index === 0) input?.focus()
      else results[index - 1].focus()
    }
    if (event.key === 'Enter' && event.target === input) {
      event.preventDefault()
      results[0].click()
    }
  }

  function navigate(id: Destination) {
    if (getDestination() !== id) {
      window.history.pushState(null, '', '#' + id)
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    }
    setMenuOpen(false)
    setOverlay(null)
    window.scrollTo({ top: 0 })
  }

  function openPlan() {
    setIntention('')
    setPlanError('')
    setOverlay({ kind: 'plan' })
  }

  function persist(change: (data: LocalState) => LocalState, success: string) {
    try {
      saveLocal(change(readSaved()))
      setNotice(success)
      return true
    } catch {
      setNotice('Browser storage is unavailable. Your changes were not saved.')
      return false
    }
  }

  function changePreferences(update: Partial<LocalPreferences>) {
    persist(data => ({ ...data, preferences: { ...data.preferences, ...update } }), 'Display preferences saved.')
  }

  function toggleModule(id: ModuleId) {
    persist(data => ({
      ...data,
      preferences: { ...data.preferences, modules: { ...data.preferences.modules, [id]: data.preferences.modules?.[id] === false } },
    }), 'Module visibility saved.')
  }

  function savePlan(event: FormEvent<HTMLFormElement>, preferred?: AgentId) {
    event.preventDefault()
    const text = intention.trim()
    if (!text || text.length > 1000) {
      setPlanError('Enter an intention between 1 and 1,000 characters.')
      return
    }
    const draft: Draft = { id: crypto.randomUUID(), intention: text, agents: planAgents(text, preferred), createdAt: new Date().toISOString() }
    if (persist(data => ({ ...data, drafts: [draft, ...data.drafts] }), 'Workflow draft saved on this device.')) navigate('projects')
    else setPlanError('Browser storage is unavailable. Your draft could not be saved.')
  }

  function selectAgent(id: AgentId | 'core') {
    setIntention('')
    setPlanError('')
    setOverlay({ kind: 'agent', id })
  }

  const selectedModule = modules.find(module => module.id === destination)
  const destinationName = destinations.find(([id]) => id === destination)?.[1]
  const planForm = (preferred?: AgentId) => <form onSubmit={event => savePlan(event, preferred)} className="plan-form">
    <label htmlFor="intention">Task intention</label>
    <textarea id="intention" maxLength={1000} required rows={3} value={intention}
      aria-invalid={Boolean(planError)} aria-describedby={planError ? 'plan-error' : undefined}
      onChange={event => { setIntention(event.target.value); setPlanError('') }} placeholder="Outline a philosophical article on the sublime…"/>
    {planError && <p id="plan-error" className="status-note" role="alert">{planError}</p>}
    <button className="primary-button" type="submit"><Plus size={16}/> Save local draft</button>
  </form>

  return <div className={`app-shell ${reduced ? 'reduced-motion' : ''} ${lite ? 'lite-mode' : ''}`}>
    <a href="#main-content" className="skip-link" onClick={event => { event.preventDefault(); document.getElementById('main-content')?.focus() }}>Skip to content</a>
    <header className="topbar">
      <button className="icon-button mobile-menu" onClick={() => setMenuOpen(value => !value)} aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} aria-controls="app-navigation">{menuOpen ? <X size={21}/> : <Menu size={21}/>}</button>
      <a className="brand" href="#dashboard" onClick={() => setMenuOpen(false)} aria-label="VISIONS Reality Codex dashboard">
        <BrandMark size={39}/><span><strong>VISIONS</strong><small>REALITY CODEX</small></span>
      </a>
      <div className="topbar-context"><span>THE NEXUS</span><i/><span>Ancient wisdom. Modern intelligence.</span></div>
      <button className="global-search" aria-label="Open command palette" onClick={() => { setQuery(''); setOverlay({ kind: 'palette' }) }}>
        <Search size={17}/><span>Search, ask, or create…</span><kbd><Command size={11}/> K</kbd>
      </button>
      <button className="icon-button notification-button" aria-label="Notifications" onClick={() => setOverlay({ kind: 'notifications' })}><Bell size={19}/></button>
      <button className="profile-button" aria-label="Local profile" onClick={() => setOverlay({ kind: 'profile' })}><span><BrandMark size={19}/></span><ChevronDown size={13}/></button>
    </header>

    <aside className={`sidebar ${menuOpen ? 'is-open' : ''}`} id="app-navigation">
      <nav aria-label="Main navigation">
        <span className="nav-group">WORKSPACE</span>
        {destinations.map(([id, label], index) => {
          const Icon = navIcons[id]
          return <div key={id}>
            {index === 5 && <span className="nav-group nav-group-secondary">CODEX</span>}
            {index === 10 && <div className="nav-divider"/>}
            <a href={`#${id}`} className={destination === id ? 'nav-link active' : 'nav-link'} aria-current={destination === id ? 'page' : undefined}
              onClick={event => { event.preventDefault(); navigate(id) }}><Icon size={17}/>{label}</a>
          </div>
        })}
      </nav>
      <div className="sidebar-identity">
        <Wave offset={.7}/>
        <button onClick={() => selectAgent('core')}><span className="sidebar-mark"><BrandMark size={26}/></span><span><strong>Codex Core</strong><small><i/> Local preview</small></span><Activity size={16}/></button>
      </div>
    </aside>
    <main id="main-content" className="page" tabIndex={-1}>
      {destination === 'dashboard' ? <>
        <div className="intro">
          <div><div className="eyebrow intro-eyebrow"><span/> THE NEXUS</div>
            <h1>The Digital Liturgy <em>Masterplan</em></h1>
            <p>Ancient wisdom. Modern intelligence.</p>
          </div>
          <span className="preview-badge"><i/> PHASE 01 · PREVIEW</span>
        </div>
        <div className="dashboard-grid">
          <section className="panel knowledge-panel" aria-labelledby="domains-heading">
            <h2 className="panel-heading" id="domains-heading"><Network size={16}/> Knowledge Domains</h2>
            <KnowledgeMap/>
            <div className="domain-list">{domains.map((domain, index) => <button key={domain.name} style={accent(domain.color)}
              title={domain.full} onClick={() => setOverlay({ kind: 'domain', index })}><i/>{domain.name}</button>)}</div>
            <button className="panel-link" onClick={() => navigate('knowledge')}>Explore knowledge <ChevronRight size={13}/></button>
            <Wave offset={1.7}/>
          </section>
          <NeuralNetwork onSelect={selectAgent} reduced={reduced} lite={lite}/>
          <section className="panel outputs-panel" aria-labelledby="outputs-heading">
            <h2 className="panel-heading" id="outputs-heading"><Layers3 size={16}/> Content Outputs</h2>
            <div className="output-list">{outputs.map(output => {
              const Icon = outputIcons[output.id]
              return <button key={output.id} className="output-button" style={accent(output.color)} onClick={() => setOverlay({ kind: 'output', id: output.id })}>
                <span className="output-icon"><Icon size={18}/></span><span><strong>{output.name}</strong><small>{output.detail}</small></span>
              </button>
            })}</div>
            <button className="panel-link" onClick={() => navigate('content')}>Open library <ChevronRight size={13}/></button>
            <Wave offset={2.7} colors={['#2edfc3', '#674dfe', '#f452d4', '#ffad5e']}/>
          </section>

          <aside className="status-rail" aria-label="Nexus activity and controls">
            <section className="panel focus-panel">
              <h2 className="panel-heading"><Crosshair size={16}/> Current Focus</h2>
              <strong>{drafts.length ? 'Workflow planning' : 'Reality Design'}</strong>
              <p>{drafts.length ? 'Review your saved intentions in Projects.' : 'Align vision, knowledge, and action with purpose.'}</p>
              <div className="focus-rule"/>
              <span className="eyebrow">{drafts.length ? `${drafts.length} LOCAL ${drafts.length === 1 ? 'DRAFT' : 'DRAFTS'}` : 'EXAMPLE OBJECTIVE'}</span>
            </section>
            <section className="panel activity-panel">
              <h2 className="panel-heading"><Activity size={15}/> Agent Activity <span>NO LIVE FEED</span></h2>
              <div className="activity-list">{agents.map(agent => <button key={agent.id} style={accent(agent.color)} onClick={() => selectAgent(agent.id)}>
                <i/>{agent.name}<small>No live feed</small>
              </button>)}</div>
            </section>
            <section className="panel modules-panel">
              <h2 className="panel-heading"><Settings2 size={15}/> Module Controls</h2>
              {modules.map(module => {
                const Icon = moduleIcons[module.id]
                const checked = preferences.modules?.[module.id] !== false
                return <label className="module-switch" key={module.id} style={accent(module.color)}><Icon size={15}/>{module.name}
                  <input type="checkbox" role="switch" checked={checked} onChange={() => toggleModule(module.id)}/><span aria-hidden="true"/>
                </label>
              })}
            </section>
            <button className="primary-button rail-action" onClick={openPlan}><Workflow size={17}/> Plan multi-agent workflow</button>
            <div className="rail-summary"><span>{drafts.length} {drafts.length === 1 ? 'draft task' : 'draft tasks'}</span><span>0 pending approvals</span></div>
          </aside>
        </div>

        <div className="workflow-panel panel">
          <h2><Workflow size={16}/> Digital Liturgy</h2>
          <div className="workflow-stages">{stages.map((stage, index) => <div key={stage.name}>
            <button style={accent(stage.color)} onClick={() => setOverlay({ kind: 'stage', index })}>{stage.name}</button>
            {index < stages.length - 1 && <ChevronRight size={15} aria-hidden="true"/>}
          </div>)}</div>
        </div>
        <button className="command-bar" onClick={() => { setQuery(''); setOverlay({ kind: 'palette' }) }}>
          <Sparkles size={18}/><span>Ask VISIONS or start a workflow…</span><kbd><Command size={11}/> K</kbd>
        </button>
        <section className="reality-section" aria-labelledby="reality-heading">
          <h2 id="reality-heading" className="eyebrow reality-label"><span/> REALITY MODULES</h2>
          <div className="reality-cards">
            {activeModules.map(module => {
              const Icon = moduleIcons[module.id]
              return <button key={module.id} className="reality-card" style={accent(module.color)} onClick={() => navigate(module.id)}>
                <Wave offset={module.id === 'business' ? 2.3 : .6} colors={[module.color, module.id === 'lifestyle' ? '#31c8ee' : '#ec5bc7', module.color]}/>
                <span className="module-card-icon"><Icon size={22}/></span><span><small>{module.domain}</small><strong>{module.name}</strong><span>{module.detail}</span></span>
              </button>
            })}
            {activeModules.length === 0 && <p className="muted">Use Module Controls to show a workspace here.</p>}
          </div>
        </section>
      </> : <>
        <div className="intro inner-intro">
          <div><div className="eyebrow intro-eyebrow"><span/> {selectedModule?.domain ?? 'THE NEXUS'}</div>
            <h1>{selectedModule?.title ?? destinationName}</h1>
            {selectedModule && <p>{selectedModule.detail}</p>}
          </div>
          <span className="preview-badge"><i/> PHASE 01 · PREVIEW</span>
        </div>
        {destination === 'agents' && <div className="workspace-grid">
          {agents.map(agent => {
            const Icon = agentIcons[agent.id]
            return <button className="workspace-card panel" key={agent.id} style={accent(agent.color)} onClick={() => selectAgent(agent.id)}>
              <Icon size={22}/><strong>{agent.name}</strong><span>{agent.archetype}</span><p>{agent.description}</p>
            </button>
          })}
        </div>}
        {destination === 'knowledge' && <section className="panel workspace-surface">
          <label className="search-field"><Search size={18}/><input placeholder="Filter knowledge domains…" aria-label="Filter knowledge domains" value={domainQuery} onChange={event => setDomainQuery(event.target.value)}/></label>
          <div className="workspace-grid">{domains.map((domain, index) => {
            if (!matches(domainQuery, domain.name, domain.full)) return null
            const Icon = domainIcons[index]
            return <button className="workspace-card" key={domain.name} style={accent(domain.color)} onClick={() => setOverlay({ kind: 'domain', index })}>
              <Icon size={21}/><strong>{domain.full}</strong>
            </button>
          })}</div>
          {!domains.some(domain => matches(domainQuery, domain.name, domain.full)) && <p className="muted">No matching domains.</p>}
        </section>}
        {destination === 'content' && <div className="workspace-grid">{outputs.map(output => {
          const Icon = outputIcons[output.id]
          return <button key={output.id} className="workspace-card panel" style={accent(output.color)} onClick={() => setOverlay({ kind: 'output', id: output.id })}>
            <Icon size={22}/><strong>{output.name}</strong><span>{output.detail}</span>
          </button>
        })}</div>}
        {destination === 'projects' && <section className="panel workspace-surface">
          <div className="section-row"><h2>Local workflow drafts</h2><button className="primary-button" onClick={openPlan}><Plus size={16}/> New draft</button></div>
          {drafts.length === 0 && <p className="muted">Your saved workflow intentions will appear here.</p>}
          {drafts.map(draft => <article className="draft-item" key={draft.id}>
            <div><small>{new Date(draft.createdAt).toLocaleDateString()}</small><h3>{draft.intention}</h3>
              <div className="role-tags">{draft.agents.map(id => {
                const agent = agents.find(item => item.id === id)
                return agent && <span key={id} style={accent(agent.color)}>{agent.name}</span>
              })}</div>
            </div>
            <button className="secondary-button" onClick={() => persist(data => ({ ...data, drafts: data.drafts.filter(item => item.id !== draft.id) }), 'Draft deleted.')}>Delete draft</button>
          </article>)}
        </section>}
        {destination === 'settings' && <section className="panel workspace-surface settings-surface">
          <h2>Network display</h2>
          <label className="settings-option"><span><strong>Reduce motion</strong><small>{reduceByDefault ? 'Your operating system requests reduced motion.' : 'Pause ambient movement and transitions.'}</small></span><input type="checkbox" checked={reduced} disabled={reduceByDefault} onChange={event => changePreferences({ reduced: event.target.checked })}/></label>
          <label className="settings-option"><span><strong>Lightweight network</strong><small>Use a static scene with fewer particles. On by default on small screens.</small></span><input type="checkbox" checked={lite} onChange={event => changePreferences({ lite: event.target.checked })}/></label>
          <h2>Privacy and services</h2>
          <p className="muted">Display preferences and workflow drafts are stored in this browser. Use this preview with non-sensitive task descriptions. Supabase and OpenAI can be configured using the project README.</p>
        </section>}
        {destination === 'lifestyle' && <>
          <div className="personal-actions" aria-label="Lifestyle workspace">
            <button className="secondary-button" aria-pressed={lifestyleSection === 'habit'} onClick={() => setLifestyleSection('habit')}>Daily habits</button>
            <button className="secondary-button" aria-pressed={lifestyleSection === 'journal'} onClick={() => setLifestyleSection('journal')}>Lifestyle journal</button>
          </div>
          <PersonalWorkspace key={lifestyleSection} kind={lifestyleSection}/>
        </>}
        {destination === 'relationships' && <PersonalWorkspace key="relationships" kind="relationship"/>}
        {destination === 'projects' && <PersonalWorkspace key="projects" kind="project"/>}
        {(destination === 'business' || destination === 'codex' || destination === 'analytics') && <section className="panel workspace-surface empty-workspace">
          <FolderOpen size={28}/>
          <h2>{destination === 'analytics' ? 'No execution data' : 'Workspace preview'}</h2>
          <p className="muted">{destination === 'business' ? 'Article, audio, and visual production arrive with the Creation Engine.'
            : destination === 'codex' ? 'Personal memory and authenticated storage are planned for a later phase.'
            : 'Usage and performance reporting will appear when workflow execution is configured.'}</p>
          <button className="secondary-button" onClick={openPlan}>Draft a workflow</button>
        </section>}
      </>}
      <footer className="footer"><span>VISIONS REALITY CODEX</span><span>Technology in service of the human person.</span></footer>
      <p className="sr-only" role="status">{notice}</p>
    </main>

    {overlay?.kind === 'palette' && <Dialog title="Command palette" label="THE NEXUS" onClose={() => setOverlay(null)}>
      <div onKeyDown={paletteKeys}>
      <label className="search-field"><Search size={18}/><input data-dialog-focus aria-label="Search workspaces, agents, and domains" value={query} placeholder="Search workspaces, agents, and domains…" onChange={event => setQuery(event.target.value)}/></label>
      <div className="palette-results">
        {matches(query, 'Plan a workflow ask command task') && <button onClick={openPlan}><Sparkles size={17}/> Plan a workflow <small>Command</small></button>}
        {destinations.filter(([, label]) => matches(query, label)).map(([id, label]) => {
          const Icon = navIcons[id]
          return <button key={id} onClick={() => navigate(id)}><Icon size={17}/>{label}<small>Workspace</small></button>
        })}
        {agents.filter(agent => matches(query, agent.name, agent.archetype, agent.role)).map(agent => {
          const Icon = agentIcons[agent.id]
          return <button key={agent.id} onClick={() => selectAgent(agent.id)}><Icon size={17}/>{agent.name}<small>Agent</small></button>
        })}
        {domains.map((domain, index) => matches(query, domain.name, domain.full) && <button key={domain.name} onClick={() => setOverlay({ kind: 'domain', index })}>
          <Network size={17}/>{domain.full}<small>Domain</small>
        </button>)}
        {outputs.filter(output => matches(query, output.name, output.detail)).map(output => {
          const Icon = outputIcons[output.id]
          return <button key={output.id} onClick={() => setOverlay({ kind: 'output', id: output.id })}><Icon size={17}/>{output.name}<small>Output</small></button>
        })}
        {!matches(query, 'Plan a workflow ask command task') && !destinations.some(([, label]) => matches(query, label))
          && !agents.some(agent => matches(query, agent.name, agent.archetype, agent.role))
          && !domains.some(domain => matches(query, domain.name, domain.full))
          && !outputs.some(output => matches(query, output.name, output.detail)) && <p className="muted">No matching commands or destinations.</p>}
      </div>
      </div>
    </Dialog>}
    {overlay?.kind === 'agent' && <Dialog key="agent" title={selectedAgent?.name ?? 'VISIONS Core'} label={selectedAgent?.archetype ?? 'NETWORK COORDINATION'} onClose={() => setOverlay(null)}>
      <p>{selectedAgent?.description ?? 'Coordinate specialized agents and give the human decision-maker oversight of the network.'}</p>
      <div className="status-note"><CircleHelp size={16}/> Save an intention locally or run it with a configured provider.</div>
      {selectedAgent && <section className="dialog-section"><h3>Capabilities</h3><ul>{selectedAgent.capabilities.map(capability => <li key={capability}>{capability}</li>)}</ul></section>}
      <section className="dialog-section"><h3>Conversation & tasks</h3>{planForm(selectedAgent?.id)}
        <p className="muted">{drafts.filter(draft => !selectedAgent || draft.agents.includes(selectedAgent.id)).length} matching local drafts</p>
      </section>
      <AgentRun key={overlay.id} agent={selectedAgent?.id}/>
      <details><summary>Knowledge, outputs & collaboration</summary><p className="muted">No authorized source index, generated outputs, or collaboration events are available.</p><button className="secondary-button" onClick={() => navigate('knowledge')}>Browse domain catalog</button></details>
      <details><summary>Configuration</summary><p className="muted">Live execution requires Supabase sign-in and an OpenAI configuration. Display options are available under Settings.</p><button className="secondary-button" onClick={() => navigate('settings')}>Open settings</button></details>
    </Dialog>}
    {overlay?.kind === 'domain' && <Dialog title={domains[overlay.index].full} label="KNOWLEDGE DOMAIN" onClose={() => setOverlay(null)}>
      <p className="muted">This domain is ready to browse. Source ingestion, citations, and graph editing will be available with the knowledge engine.</p>
      <button className="secondary-button" onClick={() => navigate('knowledge')}>View all domains</button>
    </Dialog>}
    {overlay?.kind === 'output' && <Dialog title={outputs.find(output => output.id === overlay.id)?.name ?? 'Content'} label="CONTENT OUTPUT" onClose={() => setOverlay(null)}>
      <p className="muted">{overlay.id === 'music' ? 'Audio generation requires a compatible music provider. You can save an intention for a soundtrack as a workflow draft.' : 'This output type is part of the Creation Engine. You can save a workflow draft for it now.'}</p>
      <button className="primary-button" onClick={openPlan}><Plus size={16}/> Draft a workflow</button>
    </Dialog>}
    {overlay?.kind === 'stage' && <Dialog title={stages[overlay.index].name} label="DIGITAL LITURGY" onClose={() => setOverlay(null)}>
      <p>{stages[overlay.index].description}</p>
      <button className="secondary-button" onClick={openPlan}>Plan a workflow</button>
    </Dialog>}
    {overlay?.kind === 'plan' && <Dialog key="plan" title="Plan a workflow" label="VISIONS CORE" onClose={() => setOverlay(null)}>
      <p className="muted">Save an intention to Projects. Suggested agents are selected by local rules. Live execution is unavailable in this preview.</p>
      {planForm()}
    </Dialog>}
    {overlay?.kind === 'notifications' && <Dialog title="Notifications" onClose={() => setOverlay(null)}><p className="muted">No notifications or pending approvals.</p></Dialog>}
    {overlay?.kind === 'profile' && <Dialog title="Local profile" label="PHASE 01" onClose={() => setOverlay(null)}>
      <p className="status-note"><LockKeyhole size={16}/> Local browser workspace</p>
      <p className="muted">Sign in from Lifestyle, Relationships, or Projects to access private records.</p>
      <button className="secondary-button" onClick={() => navigate('settings')}>Open settings</button>
    </Dialog>}
    {notice && <div className="toast"><span>{notice}</span><button className="icon-button" aria-label="Dismiss message" onClick={() => setNotice('')}><X size={14}/></button></div>}
  </div>
}
