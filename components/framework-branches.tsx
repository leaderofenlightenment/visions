import type { CSSProperties } from 'react'
import type { AgentId, ModuleId } from '@/lib/codex'
import type { Framework } from '@/lib/framework'
import { frameworkNetwork } from '@/lib/framework-network'
import { core } from './neural-scene'

export function FrameworkBranches({ graph, focused, onSelect }: {
  graph: Framework; focused: AgentId | 'core' | null; onSelect: (lens: AgentId, domain: ModuleId) => void
}) {
  if (graph.ideas.length === 0) return null
  const { junctions, dots, edges } = frameworkNetwork(graph, core)
  return <>
    <svg className="framework-branches" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      {edges.map(({ id, kind, from, to, color, lens }) => {
        const dx = to.x - from.x
        const dy = to.y - from.y
        const bend = kind === 'stem' ? .24 : kind === 'idea' ? .12 : .18
        const d = `M${from.x} ${from.y} Q${from.x + dx * .5 - dy * bend} ${from.y + dy * .5 + dx * bend} ${to.x} ${to.y}`
        return <g className={`branch branch-${kind}${focused === lens ? ' branch-highlight' : ''}`} key={id} style={{ color }}>
          <path d={d} className="branch-line"/>
          {(kind === 'stem' || kind === 'connection') && <path d={d} pathLength={100} className="branch-signal" style={{ animationDelay: -(from.x + to.y) / 19 + 's' }}/>}
        </g>
      })}
      {dots.map(dot => <circle key={dot.id} cx={dot.x} cy={dot.y} r=".39" fill={dot.color} className="framework-dot"/>)}
    </svg>
    {junctions.map(junction => <button className="domain-junction" type="button" key={junction.id}
      style={{ '--x': junction.x + '%', '--y': junction.y + '%', '--accent': junction.color } as CSSProperties}
      aria-label={`${junction.name} branch, ${junction.lens}, ${junction.count} ${junction.count === 1 ? 'idea' : 'ideas'}`}
      title={`${junction.name} · ${junction.count}`} onClick={() => onSelect(junction.lens, junction.domain)}>
      <span>{junction.count}</span>
    </button>)}
  </>
}
