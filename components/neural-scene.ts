type Point = { x: number; y: number; z: number; hue: number; size: number }
type Vector = Pick<Point, 'x' | 'y' | 'z'>
type Projected = { x: number; y: number; depth: number; scale: number }
type Edge = { a: number; b: number; spark: boolean }

const turn = Math.PI * 2
const goldenAngle = Math.PI * (3 - Math.sqrt(5))

function seededRandom(seed: number) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 4294967296
  }
}

export function buildNeuralScene(lite: boolean) {
  const random = seededRandom(7343)
  const count = lite ? 124 : 271
  const points: Point[] = Array.from({ length: count }, (_, index) => {
    const height = 1 - 2 * (index + .5) / count
    const angle = index * goldenAngle
    const ring = Math.sqrt(1 - height * height)
    const r = .49 + .57 * Math.pow(random(), .42)
    const ripple = 1 + .08 * Math.sin(angle * 3 + height * 5)
    return {
      x: Math.cos(angle) * ring * r * ripple,
      y: height * r * .84,
      z: Math.sin(angle) * ring * r,
      hue: 202 + random() * 92,
      size: .55 + Math.pow(random(), 3) * 1.5,
    }
  })

  const pairs = new Set<string>()
  const edges: Edge[] = []
  for (const [a, point] of points.entries()) {
    const near = points.map((target, b) => ({
      b, distance: (point.x - target.x) ** 2 + (point.y - target.y) ** 2 + (point.z - target.z) ** 2,
    })).filter(target => target.b !== a && target.distance < .2).sort((a, b) => a.distance - b.distance)
    for (const { b } of near.slice(0, lite ? 3 : 4)) {
      const key = Math.min(a, b) + ':' + Math.max(a, b)
      if (pairs.has(key)) continue
      pairs.add(key)
      edges.push({ a, b, spark: random() < .055 })
    }
  }

  const orbits = Array.from({ length: lite ? 3 : 5 }, (_, band) =>
    Array.from({ length: 93 }, (_, i) => {
      const phase = i / 92 * turn
      const tilt = .38 + band * .56
      const radius = 1.03 + band * .034 + .048 * Math.sin(phase * 4 + band)
      return {
        x: Math.cos(phase) * radius,
        y: Math.sin(phase) * Math.cos(tilt) * radius,
        z: Math.sin(phase) * Math.sin(tilt) * radius,
      }
    }),
  )
  return { points, edges, orbits, lite }
}

export function drawNeuralScene(
  ctx: CanvasRenderingContext2D, scene: ReturnType<typeof buildNeuralScene>,
  width: number, height: number, time: number, pointerX: number, pointerY: number,
) {
  const radius = Math.min(width * .435, height * .46)
  const cx = width / 2
  const cy = height / 2
  const turnY = .32 + time * .19 + pointerX * .14
  const turnX = .20 + Math.sin(time * .25) * .13 + pointerY * .16
  const cosY = Math.cos(turnY)
  const sinY = Math.sin(turnY)
  const cosX = Math.cos(turnX)
  const sinX = Math.sin(turnX)
  const project = (point: Vector): Projected => {
    const x = point.x * cosY + point.z * sinY
    const z = point.z * cosY - point.x * sinY
    const y = point.y * cosX - z * sinX
    const depth = point.y * sinX + z * cosX
    const scale = 3.9 / (3.9 - depth)
    return { x: cx + x * radius * scale, y: cy + y * radius * scale, depth, scale }
  }
  const projected = scene.points.map(project)
  ctx.clearRect(0, 0, width, height)
  ctx.globalCompositeOperation = 'lighter'

  for (const [index, orbit] of scene.orbits.entries()) {
    ctx.beginPath()
    for (const [i, point] of orbit.entries()) {
      const p = project(point)
      if (i === 0) ctx.moveTo(p.x, p.y)
      else ctx.lineTo(p.x, p.y)
    }
    ctx.lineWidth = .67
    ctx.strokeStyle = index % 2 ? 'rgba(80,184,255,.15)' : 'rgba(169,100,250,.18)'
    ctx.stroke()
  }

  for (const [index, edge] of scene.edges.entries()) {
    const a = projected[edge.a]
    const b = projected[edge.b]
    const depth = (a.depth + b.depth + 2.2) / 4.4
    const hue = (scene.points[edge.a].hue + scene.points[edge.b].hue) / 2
    ctx.strokeStyle = `hsla(${hue}, 93%, 67%, ${.045 + depth * .29})`
    ctx.lineWidth = .48 + depth * .61
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.stroke()

    if (edge.spark && !scene.lite) {
      const t = (time * (.28 + index % 5 * .044) + index * .618) % 1
      const tail = Math.max(0, t - .2)
      ctx.lineWidth = 1.15
      ctx.strokeStyle = `hsla(${hue}, 100%, 78%, ${Math.sin(t * Math.PI) * (.26 + depth * .62)})`
      ctx.beginPath()
      ctx.moveTo(a.x + (b.x - a.x) * tail, a.y + (b.y - a.y) * tail)
      ctx.lineTo(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t)
      ctx.stroke()
    }
  }

  for (const [index, point] of projected.entries()) {
    const { size, hue } = scene.points[index]
    const near = (point.depth + 1.2) / 2.4
    const r = size * point.scale * (.7 + near * .67)
    if (size > 1.35 && near > .53) {
      const bloom = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, r * 4.5)
      bloom.addColorStop(0, `hsla(${hue}, 96%, 66%, .36)`)
      bloom.addColorStop(1, `hsla(${hue}, 96%, 66%, 0)`)
      ctx.fillStyle = bloom
      ctx.fillRect(point.x - r * 4.5, point.y - r * 4.5, r * 9, r * 9)
    }
    ctx.fillStyle = `hsla(${hue}, 90%, ${62 + near * 22}%, ${.27 + near * .67})`
    ctx.beginPath()
    ctx.arc(point.x, point.y, r, 0, turn)
    ctx.fill()
  }
  ctx.globalCompositeOperation = 'source-over'
}
