'use client'

import { BookOpen, ChevronRight } from 'lucide-react'
import { courseMaterial, courseMaterials } from '@/lib/course'

export type CourseActions = { onRead: (id: string) => void }

export function CourseResource({ id, onRead, bonus = false, exclude }: CourseActions & { id: string; bonus?: boolean; exclude?: string }) {
  const material = courseMaterial(id)
  if (!material) return null
  const children = courseMaterials.filter(item => item.parent === id && item.id !== exclude)
  return <article className="course-resource">
    <div className="section-row">
      <div>
        {bonus && <small>Bonus</small>}
        <h3>{material.title}</h3>
      </div>
      <button className="secondary-button" type="button" onClick={() => onRead(id)} aria-label={'Read ' + material.title}>
        <BookOpen size={15}/> Read <ChevronRight size={13}/>
      </button>
    </div>
    {children.length > 0 && <details className="codex-reading"><summary>Worksheets and resources</summary>
      {children.map(item => <CourseResource key={item.id} id={item.id} onRead={onRead}/>)}
    </details>}
  </article>
}

export function CourseLessons({ ids, onRead }: CourseActions & { ids: readonly string[] }) {
  return <details className="panel workspace-surface codex-reading supplemental-lessons">
    <summary>Related lessons from The Master Creator</summary>
    {ids.map(id => <CourseResource key={id} id={id} onRead={onRead}/>)}
  </details>
}
