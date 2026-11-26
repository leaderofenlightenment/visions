import { agents } from '@/lib/codex'

export const core = { x: 50, y: 47.8, color: '#a778ff' }
export const points = [...agents, core]
const spectrum = ['#805dff', '#ab54ff', '#f54ebc', '#ff9651', '#51e5ff', '#377bff']
const tau = Math.PI * 2

function randomSequence(seed: number) {
  return () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0
    return seed / 4294967296
  }
}

export function drawNetwork(ctx: CanvasRenderingContext2D, width: number, height: number, lite: boolean) {
  const random = randomSequence(712)
  const cx = width * .5
  const cy = height * .479
  const rx = width * .446
  const ry = height * .455
  ctx.clearRect(0, 0, width, height)

  const nebulae = [
    [.47, .44, .52, '90,40,220'], [.78, .41, .35, '159,29,200'],
    [.24, .63, .34, '38,58,218'], [.58, .82, .28, '37,114,200'],
    [.58, .20, .25, '168,65,110'],
  ] as const
  for (const [x, y, radius, rgb] of nebulae) {
    const gradient = ctx.createRadialGradient(width * x, height * y, 0, width * x, height * y, width * radius)
    gradient.addColorStop(0, `rgba(${rgb},.21)`)
    gradient.addColorStop(.55, `rgba(${rgb},.07)`)
    gradient.addColorStop(1, `rgba(${rgb},0)`)
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
  }

  for (let i = 0; i < (lite ? 170 : 580); i++) {
    const x = random() * width
    const y = random() * height
    ctx.fillStyle = spectrum[Math.floor(random() * spectrum.length)]
    ctx.globalAlpha = .09 + random() * .40
    const size = random() * 1.05 + .14
    ctx.fillRect(x, y, size, size)
  }

  const curves = []
  for (let from = 0; from < points.length; from++) {
    for (let to = from + 1; to < points.length; to++) {
      const a = points[from]
      const b = points[to]
      const ax = a.x / 100 * width
      const ay = a.y / 100 * height
      const bx = b.x / 100 * width
      const by = b.y / 100 * height
      const dx = bx - ax
      const dy = by - ay
      for (let strand = 0; strand < (lite ? 1 : 3); strand++) {
        const bend = (random() - .5) * .82
        const c1x = ax + dx * .32 + dy * bend
        const c1y = ay + dy * .32 - dx * bend
        const c2x = bx - dx * .32 + dy * bend * .62
        const c2y = by - dy * .32 - dx * bend * .62
        const gradient = ctx.createLinearGradient(ax, ay, bx, by)
        gradient.addColorStop(0, a.color)
        gradient.addColorStop(.52, spectrum[(from + to + strand) % spectrum.length])
        gradient.addColorStop(1, b.color)
        ctx.strokeStyle = gradient
        ctx.lineWidth = strand === 0 ? 1 : .55
        ctx.globalAlpha = strand === 0 ? .45 : .22
        ctx.beginPath()
        ctx.moveTo(ax, ay)
        ctx.bezierCurveTo(c1x, c1y, c2x, c2y, bx, by)
        ctx.stroke()
        if (strand === 0) curves.push({ ax, ay, bx, by, c1x, c1y, c2x, c2y, color: a.color })
      }
    }
  }

  for (let ribbon = 0; ribbon < 5; ribbon++) {
    const phase = ribbon * 1.45
    const steps = lite ? 112 : 232
    const threads = lite ? 5 : 17
    const gradient = ctx.createLinearGradient(0, height * .17, width, height * .85)
    gradient.addColorStop(0, spectrum[ribbon])
    gradient.addColorStop(.31, spectrum[(ribbon + 2) % spectrum.length])
    gradient.addColorStop(.59, spectrum[(ribbon + 4) % spectrum.length])
    gradient.addColorStop(1, spectrum[(ribbon + 1) % spectrum.length])
    ctx.fillStyle = gradient
    ctx.strokeStyle = gradient
    for (let thread = 0; thread <= threads; thread++) {
      ctx.lineWidth = thread === threads ? .97 : .46
      ctx.globalAlpha = thread === threads ? .65 : .19
      ctx.beginPath()
      for (let i = 0; i <= steps; i++) {
        const a = i / steps * tau
        const deformation = .84 + .093 * Math.sin(a * 3 + phase) + .055 * Math.cos(a * 5 - phase)
        const surface = (thread / threads - .5) * .21 * Math.sin(a * 2 + phase)
        const x = cx + rx * Math.cos(a + phase * .10) * (deformation + surface)
        const y = cy + ry * Math.sin(a) * (deformation - surface) + Math.sin(a * 4 + phase) * height * .032
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
        if ((i + thread) % 3 === 0) ctx.fillRect(x, y, thread === threads ? 1.25 : .72, thread === threads ? 1.25 : .72)
      }
      ctx.closePath()
      ctx.stroke()
    }
  }

  for (let i = 0; i < 44; i++) {
    const curve = curves[(i * 5 + 2) % curves.length]
    const [x, y] = sampleCurve(curve, .14 + random() * .72)
    const size = i % 7 === 0 ? 2.3 : .8 + random() * .75
    ctx.globalAlpha = .84
    ctx.shadowBlur = i % 7 === 0 ? 14 : 7
    ctx.shadowColor = curve.color
    ctx.fillStyle = curve.color
    ctx.beginPath()
    ctx.arc(x, y, size, 0, tau)
    ctx.fill()
    ctx.shadowBlur = 0
    ctx.fillStyle = '#f9edff'
    ctx.beginPath()
    ctx.arc(x, y, size * .48, 0, tau)
    ctx.fill()
  }
  ctx.globalAlpha = 1
  return curves
}

type Curve = { ax: number; ay: number; bx: number; by: number; c1x: number; c1y: number; c2x: number; c2y: number; color: string }

export function sampleCurve(curve: Curve, t: number) {
  const u = 1 - t
  const { ax, ay, bx, by, c1x, c1y, c2x, c2y } = curve
  return [
    u ** 3 * ax + 3 * u ** 2 * t * c1x + 3 * u * t ** 2 * c2x + t ** 3 * bx,
    u ** 3 * ay + 3 * u ** 2 * t * c1y + 3 * u * t ** 2 * c2y + t ** 3 * by,
  ]
}
