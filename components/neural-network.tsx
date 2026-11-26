'use client'

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { Maximize, Minus, Plus, Waypoints } from 'lucide-react'
import { agents, type AgentId } from '@/lib/codex'
import { agentIcons } from './icons'
import { BrandMark } from './brand'
import { core, drawNetwork, points, sampleCurve } from './neural-scene'

export function NeuralNetwork({ onSelect, reduced, lite }: {
  onSelect: (node: AgentId | 'core') => void
  reduced: boolean
  lite: boolean
}) {
  const frame = useRef<HTMLDivElement>(null)
  const background = useRef<HTMLCanvasElement>(null)
  const foreground = useRef<HTMLCanvasElement>(null)
  const drag = useRef<{ id: number; x: number; y: number } | null>(null)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [hovered, setHovered] = useState<AgentId | 'core' | null>(null)
  const focusPoint = hovered === 'core' ? core : agents.find(agent => agent.id === hovered)

  useEffect(() => {
    const element = frame.current
    const back = background.current
    const front = foreground.current
    const ctx = back?.getContext('2d')
    const pulse = front?.getContext('2d')
    if (!element || !back || !front || !ctx || !pulse) return
    let animation = 0
    function resize() {
      if (!element || !back || !front || !ctx || !pulse) return
      cancelAnimationFrame(animation)
      const { width, height } = element.getBoundingClientRect()
      if (width === 0 || height === 0) return
      const dpr = Math.min(window.devicePixelRatio || 1, lite ? 1 : 2)
      for (const canvas of [back, front]) {
        canvas.width = Math.round(width * dpr)
        canvas.height = Math.round(height * dpr)
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      pulse.setTransform(dpr, 0, 0, dpr, 0, 0)
      const curves = drawNetwork(ctx, width, height, lite)
      if (reduced || lite) return
      const draw = (now: number) => {
        pulse.clearRect(0, 0, width, height)
        for (let i = 0; i < 12; i++) {
          const curve = curves[(i * 7 + Math.floor(i / 4)) % curves.length]
          const t = (now / (4700 + i * 458) + i * .19) % 1
          const [x, y] = sampleCurve(curve, t)
          pulse.globalAlpha = Math.sin(t * Math.PI) * .6
          pulse.shadowBlur = 8
          pulse.shadowColor = curve.color
          pulse.fillStyle = curve.color
          pulse.beginPath()
          pulse.arc(x, y, 1.45, 0, Math.PI * 2)
          pulse.fill()
        }
        pulse.globalAlpha = .25
        pulse.shadowBlur = 5
        pulse.shadowColor = '#9665fa'
        const glow = pulse.createLinearGradient(width * .09, height * .8, width * .91, height * .8)
        glow.addColorStop(0, '#8065ff00')
        glow.addColorStop(.34, '#b45dff')
        glow.addColorStop(.63, '#ff75d8')
        glow.addColorStop(1, '#52e1ff00')
        pulse.strokeStyle = glow
        pulse.lineWidth = 1
        pulse.beginPath()
        for (let i = 0; i <= 120; i++) {
          const x = width * (.08 + .84 * i / 120)
          const ratio = i / 120
          const y = height * (.88 + Math.sin(ratio * 11 + now / 2100) * .035
            + Math.cos(ratio * 16 - now / 2600) * .023)
          if (i === 0) pulse.moveTo(x, y)
          else pulse.lineTo(x, y)
        }
        pulse.stroke()
        animation = requestAnimationFrame(draw)
      }
      animation = requestAnimationFrame(draw)
    }
    const observer = new ResizeObserver(resize)
    observer.observe(element)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(animation)
    }
  }, [lite, reduced])

  function beginPan(event: PointerEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest('button') || event.button !== 0) return
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY }
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  function movePan(event: PointerEvent<HTMLDivElement>) {
    const active = drag.current
    if (!active || active.id !== event.pointerId) {
      if (reduced || lite || event.pointerType !== 'mouse') return
      const rect = event.currentTarget.getBoundingClientRect()
      event.currentTarget.style.setProperty('--depth-x', ((event.clientX - rect.left) / rect.width - .5) * 7 + 'px')
      event.currentTarget.style.setProperty('--depth-y', ((event.clientY - rect.top) / rect.height - .5) * 7 + 'px')
      return
    }
    const dx = event.clientX - active.x
    const dy = event.clientY - active.y
    active.x = event.clientX
    active.y = event.clientY
    const capX = frame.current?.clientWidth ? frame.current.clientWidth * .46 : 160
    const capY = frame.current?.clientHeight ? frame.current.clientHeight * .46 : 160
    setOffset(previous => ({ x: Math.max(-capX, Math.min(capX, previous.x + dx)), y: Math.max(-capY, Math.min(capY, previous.y + dy)) }))
  }

  return <section className="network-panel" aria-label="VISIONS neural network">
    <div className="network-heading">
      <span><Waypoints size={14}/> VISIONS INTELLIGENCE NETWORK</span>
      <small>8 NODES</small>
    </div>
    <div className="network-frame" ref={frame} onPointerDown={beginPan} onPointerMove={movePan}
      onPointerLeave={event => {
        event.currentTarget.style.removeProperty('--depth-x')
        event.currentTarget.style.removeProperty('--depth-y')
      }}
      onPointerUp={() => { drag.current = null }} onLostPointerCapture={() => { drag.current = null }}>
      <div className="network-scene" style={{ translate: `${offset.x}px ${offset.y}px`, scale: zoom }}>
        <canvas ref={background} aria-hidden="true"/>
        <canvas ref={foreground} className="ambient-layer" aria-hidden="true"/>
        {focusPoint && <svg className="connection-highlight" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {points.filter(point => point !== focusPoint).map(point => {
            const dx = point.x - focusPoint.x
            const dy = point.y - focusPoint.y
            return <path key={point.x + ':' + point.y} d={`M${focusPoint.x} ${focusPoint.y} Q${focusPoint.x + dx * .45 - dy * .22} ${focusPoint.y + dy * .45 + dx * .22} ${point.x} ${point.y}`}
              stroke={focusPoint.color} />
          })}
        </svg>}
        <button className="orb core-orb" style={{ '--x': core.x + '%', '--y': core.y + '%', '--accent': core.color } as CSSProperties}
          onClick={() => onSelect('core')} onMouseEnter={() => setHovered('core')} onMouseLeave={() => setHovered(null)}
          onFocus={() => setHovered('core')} onBlur={() => setHovered(null)} title="VISIONS Core · Coordination">
          <BrandMark size={49}/><strong>VISIONS</strong><small>CORE</small>
        </button>
        {agents.map(agent => {
          const Icon = agentIcons[agent.id]
          return <button className="orb agent-orb" key={agent.id}
            style={{ '--x': agent.x + '%', '--y': agent.y + '%', '--accent': agent.color } as CSSProperties}
            onClick={() => onSelect(agent.id)} onMouseEnter={() => setHovered(agent.id)} onMouseLeave={() => setHovered(null)}
            onFocus={() => setHovered(agent.id)} onBlur={() => setHovered(null)}
            title={`${agent.name} · ${agent.role}`}>
            <Icon size={19}/><strong>{agent.name}</strong><small>{agent.role}</small>
          </button>
        })}
      </div>
      {hovered && <div className="network-tooltip" role="status">
        {hovered === 'core' ? 'VISIONS Core · Network coordination' : agents.find(agent => agent.id === hovered)?.description}
        <span>Open workspace to check execution access</span>
      </div>}
    </div>
    <div className="network-footer">
      <span><i/> Ambient visualization</span>
      <div className="zoom-controls" aria-label="Network view controls">
        <button type="button" aria-label="Zoom out" disabled={zoom <= .8} onClick={() => setZoom(value => Math.max(.8, value - .2))}><Minus size={13}/></button>
        <output aria-live="polite">{Math.round(zoom * 100)}%</output>
        <button type="button" aria-label="Zoom in" disabled={zoom >= 1.8} onClick={() => setZoom(value => Math.min(1.8, value + .2))}><Plus size={13}/></button>
        <button type="button" aria-label="Reset network view" onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }) }}><Maximize size={13}/></button>
      </div>
    </div>
  </section>
}
