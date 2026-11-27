import { modules, type AgentId, type ModuleId } from './codex'
import { frameworkConnections } from './guided'
import { frameworkSummary, type Framework } from './framework'

type Point = { x: number; y: number }
type Junction = Point & { id: string; lens: AgentId; domain: ModuleId; name: string; color: string; count: number }
type Dot = Point & { id: string; color: string }
type Edge = { id: string; from: Point; to: Point; color: string; kind: 'stem' | 'idea' | 'domain' | 'connection'; lens?: AgentId }

function point(x: number, y: number): Point {
  return { x: Math.max(4, Math.min(96, x)), y: Math.max(5, Math.min(95, y)) }
}

export function frameworkNetwork(graph: Framework, center: Point) {
  const junctions: Junction[] = []
  const dots = new Map<string, Dot>()
  const edges: Edge[] = []
  const nodeAnchors = new Map<ModuleId, Junction[]>()
  for (const { lens, ideas, domains } of frameworkSummary(graph)) {
    const dx = lens.x - center.x
    const dy = lens.y - center.y
    const length = Math.hypot(dx, dy)
    const ox = dx / length
    const oy = dy / length
    for (const [index, domain] of domains.entries()) {
      if (!domain.count) continue
      const side = (index - 1) * 8
      const base = point(lens.x + ox * 13 - oy * side, lens.y + oy * 11 + ox * side)
      const junction = { ...base, id: lens.id + ':' + domain.id, lens: lens.id, domain: domain.id, name: domain.name, color: domain.color, count: domain.count }
      junctions.push(junction)
      const anchors = nodeAnchors.get(domain.id) ?? []
      anchors.push(junction)
      nodeAnchors.set(domain.id, anchors)
      edges.push({ id: junction.id, from: lens, to: junction, lens: lens.id, color: domain.color, kind: 'stem' })
      const cluster = ideas.filter(idea => idea.domains.includes(domain.id))
      for (const [i, idea] of cluster.entries()) {
        const angle = Math.atan2(oy, ox) + i * 2.399963
        const distance = 1.8 + Math.sqrt(i) * .9
        const leaf = point(base.x + Math.cos(angle) * distance, base.y + Math.sin(angle) * distance)
        if (!dots.has(idea.id)) dots.set(idea.id, { ...leaf, id: idea.id, color: domain.color })
        const dot = dots.get(idea.id)!
        edges.push({ id: junction.id + ':' + idea.id, from: junction, to: dot, lens: lens.id, color: domain.color, kind: 'idea' })
      }
    }
  }
  for (const domain of modules) {
    const anchors = nodeAnchors.get(domain.id) ?? []
    for (let i = 1; i < anchors.length; i++) {
      const from = anchors[i - 1]
      const to = anchors[i]
      edges.push({ id: from.id + ':' + to.id, from, to, color: domain.color, kind: 'domain' })
    }
  }
  for (const [a, b] of frameworkConnections(graph)) {
    const from = dots.get(a)
    const to = dots.get(b)
    if (from && to) edges.push({ id: a + ':' + b, from, to, color: '#dfd0ff', kind: 'connection' })
  }
  return { junctions, dots: [...dots.values()], edges }
}
