'use client'

import { useState } from 'react'
import { courseMaterials, type CourseMaterial } from '@/lib/course'
import { agents, modules, type ModuleId } from '@/lib/codex'
import type { Framework } from '@/lib/framework'

export function CourseLibrary({ graph, onRead, onApply, domain, toolkit = false }: {
  graph: Framework; onRead: (material: CourseMaterial) => void; onApply: (material: CourseMaterial) => void; domain?: ModuleId; toolkit?: boolean
}) {
  const [search, setSearch] = useState('')
  const available = courseMaterials.filter(material => toolkit ? material.toolkit : !domain || material.domains.includes(domain))
  const visible = available.filter(material => material.title.toLowerCase().includes(search.trim().toLowerCase()))
  const title = toolkit ? 'Digital Marketing Toolkit' : domain ? 'Apply the course to ' + modules.find(module => module.id === domain)?.name : 'The Master Creator'
  return <section className="panel workspace-surface course-library">
    <h2>{title}</h2>
    <label className="search-field"><input aria-label="Find course material" placeholder="Find a lesson, system, or resource…" value={search} onChange={event => setSearch(event.target.value)}/></label>
    {!visible.length && <p>No matching materials.</p>}
    {(['Lessons', 'Systems', 'Bonuses'] as const).map(group => {
      const entries = visible.filter(item => item.group === group)
      if (!entries.length) return null
      function card(material: CourseMaterial): React.ReactNode {
        const children = entries.filter(item => item.parent === material.id)
        const applications = graph.ideas.filter(idea => idea.courseId === material.id).length
        return <article key={material.id} className="personal-record course-material">
          <h4>{material.title}</h4>
          <small>{agents.find(agent => agent.id === material.lens)?.name} · {material.domains.map(id => modules.find(module => module.id === id)?.name).join(' · ')}{applications ? ` · ${applications} saved` : ''}</small>
          <div className="personal-actions">
            <button className="secondary-button" type="button" onClick={() => onRead(material)}>Read in VISIONS</button>
            <button className="primary-button" onClick={() => onApply(material)}>Apply in VISIONS</button>
          </div>
          {children.length > 0 && <details><summary>{children.length} related resources</summary>{children.map(card)}</details>}
        </article>
      }
      return <section key={group}><h3>{group}</h3>{entries.filter(item => !entries.some(parent => parent.id === item.parent)).map(card)}</section>
    })}
  </section>
}
