'use client'

import { useState } from 'react'
import type { PersonalRecord } from '@/lib/personal'

const colors = ['#e45454', '#e58b35', '#eab308', '#399be4', '#2dbb74']
function conditionColor(condition: number | null) {
  return condition === null ? '#b7a5ce' : colors[Math.floor((condition - 1) / 2)]
}

export function RelationshipGraph({ groups, onSelect }: {
  groups: ReadonlyMap<string, PersonalRecord[]>
  onSelect: (person: PersonalRecord) => void
}) {
  const [zoom, setZoom] = useState(1)
  const columns = Math.min(3, groups.size)
  if (!columns) return null
  return <details className="relationship-graph">
    <summary>Explore relationship graph</summary>
    <div className="personal-actions" aria-label="Relationship graph zoom">
      <button className="secondary-button" type="button" disabled={zoom <= .75} onClick={() => setZoom(value => value - .25)}>Zoom out</button>
      <button className="secondary-button" type="button" disabled={zoom >= 2} onClick={() => setZoom(value => value + .25)}>Zoom in</button>
      <button className="secondary-button" type="button" onClick={() => setZoom(1)}>Reset zoom</button>
      <output>{Math.round(zoom * 100)}%</output>
    </div>
    <div className="relationship-scroll" tabIndex={0} aria-label="Scrollable relationship graph">
      <div className="relationship-clusters" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, width: Math.max(240 * columns, 620) * zoom }}>
        {Array.from(groups, ([category, people]) => <div className="relationship-cluster" key={category}>
          <strong>{category}</strong>
          <ul>{people.map(person => <li key={person.id}>
            <button className="secondary-button" type="button" onClick={() => onSelect(person)}>
              <span className="relationship-node" aria-hidden="true" style={{ backgroundColor: conditionColor(person.condition) }}/>
              {person.title} <small>{person.condition === null ? 'Unrated' : person.condition + '/10'}</small>
            </button>
          </li>)}</ul>
        </div>)}
      </div>
    </div>
  </details>
}
