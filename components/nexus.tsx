'use client'

import { useEffect, useState, useSyncExternalStore, type CSSProperties } from 'react'
import { BriefcaseBusiness, ChevronRight, Crosshair, Heart, LayoutDashboard, Leaf, Menu, Search, Settings2, X } from 'lucide-react'
import { matches, modules, type Draft, type ModuleId } from '@/lib/codex'
import { contentDomains } from '@/lib/guided'
import { courseMaterial, marketingToolkit, workspaceCourse, type CourseMaterial } from '@/lib/course'
import { BrandMark } from './brand'
import { Dialog } from './dialog'
import { NeuralNetwork } from './neural-network'
import { Wave } from './wave'
import { CourseLessons, CourseResource } from './course-library'
import type { CourseApplication } from './course-answer'
import { CourseReader } from './course-reader'
import { VisionsPlans } from './visions-plans'
import { DomainDocument, GuidedWorkspace } from './guided-workspace'
import { FrameworkWorkspace } from './framework-workspace'
import { useFramework } from './use-framework'
import { PersonalWorkspace } from './personal-workspace'
import { AgentRun } from './agent-run'
import { SourceLibrary } from './source-library'
import { AccountAccess } from './account-access'
import { EdenWorkflow } from './eden-workflow'

const pages = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'core', label: 'VISIONS Core', icon: Crosshair },
  { id: 'lifestyle', label: 'Lifestyle', icon: Leaf },
  { id: 'business', label: 'Business', icon: BriefcaseBusiness },
  { id: 'relationships', label: 'Relationships', icon: Heart },
  { id: 'plans', label: 'Plans', icon: null },
  { id: 'settings', label: 'Settings', icon: Settings2 },
] as const
type Page = (typeof pages)[number]['id']
type Overlay = { kind: 'search' } | { kind: 'read' | 'apply'; material: CourseMaterial; application?: CourseApplication }
type LocalState = { preferences: { reduced?: boolean; lite?: boolean }; drafts: Draft[] }

const storageKey = 'visions.nexus.v1'
const fallback = '{"preferences":{},"drafts":[]}'
const accent = (color: string) => ({ '--accent': color } as CSSProperties)

function readStorage() {
  try { return window.localStorage.getItem(storageKey) ?? fallback }
  catch { return fallback }
}

function parseStorage(snapshot: string): LocalState {
  try {
    const data = JSON.parse(snapshot) as LocalState
    return { preferences: data.preferences ?? {}, drafts: Array.isArray(data.drafts) ? data.drafts : [] }
  } catch { return { preferences: {}, drafts: [] } }
}

function subscribeStorage(callback: () => void) {
  window.addEventListener('storage', callback)
  window.addEventListener('visions-settings', callback)
  return () => {
    window.removeEventListener('storage', callback)
    window.removeEventListener('visions-settings', callback)
  }
}

function subscribeDestination(callback: () => void) {
  window.addEventListener('hashchange', callback)
  return () => window.removeEventListener('hashchange', callback)
}

function readPage(): Page {
  const hash = window.location.hash.slice(1)
  if (['guide', 'codex', 'agents'].includes(hash)) return 'core'
  if (['content', 'projects'].includes(hash)) return 'business'
  return pages.find(page => page.id === hash)?.id ?? 'dashboard'
}

function media(query: string) {
  return {
    listen(callback: () => void) {
      const condition = window.matchMedia(query)
      condition.addEventListener('change', callback)
      return () => condition.removeEventListener('change', callback)
    },
    read: () => window.matchMedia(query).matches,
  }
}
const reducedMotion = media('(prefers-reduced-motion: reduce)')
const smallScreen = media('(max-width: 700px)')
const off = () => false
const dashboard = (): Page => 'dashboard'

export function Nexus() {
  const local = parseStorage(useSyncExternalStore(subscribeStorage, readStorage, () => fallback))
  const [settingsError, setSettingsError] = useState('')
  const [overlay, setOverlay] = useState<Overlay | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [draftToRemove, setDraftToRemove] = useState<string | null>(null)
  const page = useSyncExternalStore(subscribeDestination, readPage, dashboard)
  const systemReduced = useSyncExternalStore(reducedMotion.listen, reducedMotion.read, off)
  const mobileRender = useSyncExternalStore(smallScreen.listen, smallScreen.read, off)
  const framework = useFramework()
  const reduced = systemReduced || local.preferences.reduced === true
  const lite = local.preferences.lite ?? mobileRender
  const domain = modules.find(module => module.id === page)
  const destination = pages.find(item => item.id === page)!
  const notes = framework.graph.ideas.filter(idea => !idea.guideDomain)

  function openSearch() {
    setSearch('')
    setOverlay({ kind: 'search' })
  }

  useEffect(() => {
    function shortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        openSearch()
      }
    }
    window.addEventListener('keydown', shortcut)
    return () => window.removeEventListener('keydown', shortcut)
  }, [])

  useEffect(() => {
    function resetNavigation() {
      setOverlay(null)
      setMenuOpen(false)
      setDraftToRemove(null)
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('hashchange', resetNavigation)
    return () => window.removeEventListener('hashchange', resetNavigation)
  }, [])

  function navigate(id: Page) {
    setOverlay(null)
    setMenuOpen(false)
    if (window.location.hash !== '#' + id) {
      window.history.pushState(null, '', '#' + id)
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    }
  }

  function saveLocal(change: (data: LocalState) => LocalState) {
    const current = parseStorage(readStorage())
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(change(current)))
      window.dispatchEvent(new Event('visions-settings'))
      setSettingsError('')
      return true
    } catch {
      setSettingsError('Browser storage is unavailable. Your changes could not be saved.')
      return false
    }
  }

  function updatePreferences(preferences: Partial<LocalState['preferences']>) {
    saveLocal(current => ({ ...current, preferences: { ...current.preferences, ...preferences } }))
  }

  function readCourse(id: string) {
    const material = courseMaterial(id)
    if (material) setOverlay({ kind: 'read', material })
  }

  function documentFor(id: ModuleId) {
    return <DomainDocument store={framework} domain={id}/>
  }

  const resources = domain ? workspaceCourse[domain.id] : null
  const searchResults = pages.filter(item => matches(search, item.label, item.id === 'core' ? 'Codex method guided framework' : ''))
  return <div className={`app-shell simple-nexus ${reduced ? 'reduced-motion' : ''} ${lite ? 'lite-mode' : ''}`}>
    <a href="#main-content" className="skip-link" onClick={event => { event.preventDefault(); document.getElementById('main-content')?.focus() }}>Skip to content</a>
    <header className="topbar">
      <button className="icon-button mobile-menu" type="button" onClick={() => setMenuOpen(value => !value)}
        aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} aria-controls="app-navigation">{menuOpen ? <X size={21}/> : <Menu size={21}/>}</button>
      <a className="brand" href="#dashboard" aria-label="VISIONS Reality Codex dashboard" onClick={event => { event.preventDefault(); navigate('dashboard') }}>
        <BrandMark size={39}/><span><strong>VISIONS</strong><small>REALITY CODEX</small></span>
      </a>
      <div className="nexus-header-actions">
        <button className="icon-button" type="button" aria-label="Find workspace" title="Find workspace (Ctrl/⌘ K)" onClick={openSearch}><Search size={19}/></button>
        <a className="icon-button" href="#settings" aria-label="Account and settings" title="Account and settings"><Settings2 size={19}/></a>
      </div>
    </header>
    <aside className={`sidebar ${menuOpen ? 'is-open' : ''}`} id="app-navigation">
      <nav aria-label="Main navigation">
        {pages.filter(item => item.id !== 'settings').map(({ id, label, icon: Icon }) => <a key={id} href={'#' + id}
          className={page === id ? 'nav-link active' : 'nav-link'} aria-current={page === id ? 'page' : undefined}
          onClick={event => { event.preventDefault(); navigate(id) }}>
          {Icon && <Icon size={17}/>} {label}
        </a>)}
      </nav>
    </aside>
    <main id="main-content" className="page" tabIndex={-1}>
      {page === 'dashboard' ? <>
        <div className="intro"><div>
          <div className="eyebrow intro-eyebrow"><span/> THE NEXUS</div>
          <h1>VISIONS <em>Reality Codex</em></h1>
          <p>Ancient wisdom. Modern intelligence.</p>
        </div></div>
        <div className="nexus-overview">
          <NeuralNetwork onOpen={() => navigate('core')} reduced={reduced} lite={lite}/>
          <section className="panel content-domains" aria-labelledby="content-domains-title">
            <h2 id="content-domains-title">Content domains</h2>
            {contentDomains.map(({ id, topic, pillars }) => {
              const workspace = modules.find(item => item.id === id)!
              return <a className="content-domain" href={'#' + id} key={id} style={accent(workspace.color)}
                onClick={event => { event.preventDefault(); navigate(id) }}>
                <span><strong>{topic}</strong><small>{pillars.join(' · ')}</small></span><ChevronRight size={15} aria-hidden="true"/>
              </a>
            })}
          </section>
        </div>
        <section className="nexus-workspaces" aria-labelledby="workspaces-title">
          <h2 className="eyebrow" id="workspaces-title">Workspaces</h2>
          <div className="reality-cards">
            {modules.map(module => <a className="reality-card" key={module.id} style={accent(module.color)} href={'#' + module.id}
              onClick={event => { event.preventDefault(); navigate(module.id) }}>
              <Wave offset={module.id === 'business' ? 2.3 : .6} colors={[module.color, '#ad67e4', module.color]}/>
              <span><strong>{module.name}</strong><span>{contentDomains.find(content => content.id === module.id)?.document}</span></span>
            </a>)}
          </div>
        </section>
      </> : <>
        <div className="intro inner-intro"><div>
          <div className="eyebrow intro-eyebrow"><span/> {page === 'core' ? 'VISIONS CORE' : contentDomains.find(item => item.id === page)?.topic.toUpperCase() ?? 'VISIONS REALITY CODEX'}</div>
          <h1>{page === 'core' ? 'VISIONS Reality Codex' : destination.label}</h1>
          {page === 'core' && <p>Work through seven movements that bring Theosis, Creativity, and Psychology into one practice.</p>}
        </div></div>
        {page === 'core' && <div className="nexus-stack">
          <GuidedWorkspace key={'method-' + framework.mode} store={framework}/>
          {notes.length > 0 && <details className="panel workspace-surface codex-reading"><summary>Saved notes and course applications ({notes.length})</summary>
            <FrameworkWorkspace store={framework} onReadCourse={readCourse} notesOnly/>
          </details>}
          <CoreReflection key={'reflection-' + framework.mode}/>
        </div>}
        {domain && resources && <div className="nexus-stack">
          {domain.id === 'business' ? <ol className="business-process" aria-label="Creative business process">
            <li><h2>Define your work</h2>
              {documentFor(domain.id)}
              <section className="panel workspace-surface"><CourseResource id={resources.main} onRead={readCourse} exclude={marketingToolkit}/></section>
            </li>
            <li><h2>Build your offer</h2>
              <section className="panel workspace-surface"><CourseResource id={resources.bonus} onRead={readCourse} bonus/></section>
            </li>
            <li><h2>Research, create, and publish</h2>
              <section className="panel workspace-surface">
                <CourseResource id={marketingToolkit} onRead={readCourse}/>
                <EdenWorkflow graph={framework.graph}/>
              </section>
            </li>
          </ol> : <>
            {documentFor(domain.id)}
            <section className="panel workspace-surface workspace-course" aria-label="The Master Creator">
              <h2>The Master Creator</h2>
              <CourseResource id={resources.main} onRead={readCourse}/>
              <CourseResource id={resources.bonus} onRead={readCourse} bonus/>
            </section>
          </>}
          <CourseLessons ids={resources.lessons} onRead={readCourse}/>
          {domain.id === 'lifestyle' && <details className="panel workspace-surface codex-reading"><summary>Habits and journal</summary>
            <LifestyleRecords/>
          </details>}
          {domain.id === 'relationships' && <details className="panel workspace-surface codex-reading"><summary>Private relationship records</summary>
            <PersonalWorkspace kind="relationship"/>
          </details>}
          {domain.id === 'business' && <details className="panel workspace-surface codex-reading"><summary>Projects and saved workflow drafts</summary>
            {local.drafts.map(draft => <article className="personal-record" key={draft.id}>
              <p>{draft.intention}</p>
              {draftToRemove === draft.id ? <div className="personal-actions">
                <button className="secondary-button" type="button" onClick={() => {
                  if (saveLocal(current => ({ ...current, drafts: current.drafts.filter(item => item.id !== draft.id) }))) setDraftToRemove(null)
                }}>Confirm removal</button>
                <button className="secondary-button" type="button" onClick={() => setDraftToRemove(null)}>Cancel</button>
              </div> : <button className="secondary-button" type="button" onClick={() => setDraftToRemove(draft.id)}>Remove local draft</button>}
            </article>)}
            {settingsError && <p role="alert">{settingsError}</p>}
            <PersonalWorkspace kind="project"/>
          </details>}
        </div>}
        {page === 'plans' && <VisionsPlans onStart={() => navigate('core')} onMaterials={() => navigate('business')}/>}
        {page === 'settings' && <div className="nexus-stack">
          <AccountAccess mode={framework.mode}/>
          <section className="panel workspace-surface settings-surface"><h2>Network display</h2>
            <label className="settings-option"><span><strong>Reduce motion</strong><small>Pause the movement of the neural mesh.</small></span>
              <input type="checkbox" checked={reduced} disabled={systemReduced} onChange={event => updatePreferences({ reduced: event.target.checked })}/></label>
            <label className="settings-option"><span><strong>Lightweight network</strong><small>Use a static scene with fewer particles.</small></span>
              <input type="checkbox" checked={lite} onChange={event => updatePreferences({ lite: event.target.checked })}/></label>
            {settingsError && <p role="alert">{settingsError}</p>}
          </section>
        </div>}
      </>}
      <footer className="footer"><span>VISIONS REALITY CODEX</span><span>Technology in service of the human person.</span></footer>
    </main>

    {overlay?.kind === 'search' && <Dialog title="Find workspace" onClose={() => setOverlay(null)}>
      <div onKeyDown={event => {
        if (event.key === 'Enter' && event.target instanceof HTMLInputElement && searchResults.length) navigate(searchResults[0].id)
      }}>
        <label className="search-field"><Search size={18}/><input data-dialog-focus aria-label="Search workspaces" value={search} onChange={event => setSearch(event.target.value)}/></label>
        <div className="palette-results">{searchResults.map(({ id, label }) => <button key={id} type="button" onClick={() => navigate(id)}>{label}</button>)}
          {!searchResults.length && <p>No matching workspaces.</p>}
        </div>
      </div>
    </Dialog>}
    {overlay?.kind === 'read' && <Dialog key={'read:' + overlay.material.id} title={overlay.material.title} label="THE MASTER CREATOR" onClose={() => setOverlay(null)}>
      <CourseReader id={overlay.material.id} onOpen={readCourse} onApply={application => setOverlay({ kind: 'apply', material: overlay.material, application })}/>
    </Dialog>}
    {overlay?.kind === 'apply' && <Dialog key={'apply:' + overlay.material.id} title={overlay.material.title} label="APPLY IN VISIONS" onClose={() => setOverlay(null)}>
      <FrameworkWorkspace store={framework} onReadCourse={readCourse} course={overlay.material} application={overlay.application}/>
    </Dialog>}
  </div>
}

function CoreReflection() {
  const [opened, setOpened] = useState(false)
  const [sourcesOpened, setSourcesOpened] = useState(false)
  return <details className="panel workspace-surface codex-reading" onToggle={event => {
    if (event.target === event.currentTarget && event.currentTarget.open) setOpened(true)
  }}>
    <summary>Reflect with VISIONS AI</summary>
    {opened && <>
      <AgentRun/>
      <details className="codex-reading" onToggle={event => { if (event.currentTarget.open) setSourcesOpened(true) }}>
        <summary>Manage source passages</summary>
        {sourcesOpened && <SourceLibrary/>}
      </details>
    </>}
  </details>
}

function LifestyleRecords() {
  const [section, setSection] = useState<'habit' | 'journal'>('habit')
  return <>
    <div className="personal-actions">
      <button className="secondary-button" type="button" aria-pressed={section === 'habit'} onClick={() => setSection('habit')}>Daily habits</button>
      <button className="secondary-button" type="button" aria-pressed={section === 'journal'} onClick={() => setSection('journal')}>Lifestyle journal</button>
    </div>
    <PersonalWorkspace key={section} kind={section}/>
  </>
}
