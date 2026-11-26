import type { CSSProperties } from 'react'
import { modules } from '@/lib/codex'
import type { Connection, Idea } from '@/lib/framework'

export function LensNetwork({ ideas, connections, selected, onSelect }: {
  ideas: Idea[]; connections: Connection[]; selected: string; onSelect: (id: string) => void
}) {
  const hubs = modules.map((domain, i) => ({ ...domain, x: 18 + i * 32, y: 14 }))
  const rows = Math.ceil(ideas.length / 6)
  const height = Math.max(37, 21 + rows * 12)
  const nodes = ideas.map((idea, i) => ({ ...idea, x: 11 + i % 6 * 15.6 + (Math.floor(i / 6) % 2 ? 4 : 0), y: 30 + Math.floor(i / 6) * 12 }))
  const byId = new Map(nodes.map(node => [node.id, node]))
  return <div className="lens-map-scroll" tabIndex={0} aria-label="Connections inside this lens">
    <div className="lens-map" style={{ height: height * 3 }}>
      <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" aria-hidden="true">
        {nodes.flatMap(node => hubs.filter(hub => node.domains.includes(hub.id)).map(hub => (
          <path key={node.id + hub.id} stroke={hub.color} d={`M${hub.x} ${hub.y} Q${hub.x} ${node.y - 2} ${node.x} ${node.y}`} />
        )))}
        {connections.flatMap(([first, second]) => {
          const a = byId.get(first)
          const b = byId.get(second)
          return a && b ? [<path key={first + second} className="lens-link" stroke="#f1ccff" d={`M${a.x} ${a.y} Q${(a.x + b.x) / 2} ${Math.max(19, Math.min(a.y, b.y) - 7)} ${b.x} ${b.y}`}/>] : []
        })}
      </svg>
      {hubs.map(hub => <span key={hub.id} className="lens-hub" style={{ left: hub.x + '%', top: hub.y * 3, color: hub.color }}>{hub.name}</span>)}
      {nodes.map(node => <button type="button" key={node.id} className="lens-node" title={node.title} aria-label={'Explore ' + node.title} aria-pressed={selected === node.id}
        style={{ left: node.x + '%', top: node.y * 3, '--accent': hubs.find(hub => node.domains.includes(hub.id))?.color } as CSSProperties}
        onClick={() => onSelect(node.id)}><span aria-hidden="true"/></button>)}
    </div>
  </div>
}
