'use client'

import { useEffect, useRef } from 'react'
import { Waypoints } from 'lucide-react'
import { BrandMark } from './brand'
import { buildNeuralScene, drawNeuralScene } from './neural-scene'

export function NeuralNetwork({ onOpen, reduced, lite }: {
  onOpen: () => void
  reduced: boolean
  lite: boolean
}) {
  const frame = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const pointer = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const element = frame.current
    const surface = canvas.current
    const ctx = surface?.getContext('2d')
    if (!element || !surface || !ctx) return

    const scene = buildNeuralScene(lite)
    const animate = !reduced && !lite
    let width = 0
    let height = 0
    let x = 0
    let y = 0
    let last = 0
    let animation = 0
    const start = performance.now()
    function paint(now: number) {
      if (!ctx || !width || !height) return
      x += (pointer.current.x - x) * .12
      y += (pointer.current.y - y) * .12
      drawNeuralScene(ctx, scene, width, height, animate ? (now - start) / 1000 : 0, animate ? x : 0, animate ? y : 0)
    }
    function tick(now: number) {
      if (now - last >= 1000 / 42) {
        paint(now)
        last = now
      }
      animation = requestAnimationFrame(tick)
    }
    const observer = new ResizeObserver(() => {
      width = element.clientWidth
      height = element.clientHeight
      if (!width || !height) return
      const dpr = Math.min(window.devicePixelRatio || 1, lite ? 1 : 2)
      surface.width = Math.round(width * dpr)
      surface.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      paint(performance.now())
    })
    observer.observe(element)
    if (animate) animation = requestAnimationFrame(tick)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(animation)
    }
  }, [lite, reduced])

  return <section className="network-panel" aria-label="VISIONS neural network">
    <div className="network-heading"><span><Waypoints size={14}/> VISIONS INTELLIGENCE NETWORK</span></div>
    <div className="network-frame" ref={frame}
      onPointerMove={event => {
        if (reduced || lite || event.pointerType !== 'mouse') return
        const rect = event.currentTarget.getBoundingClientRect()
        pointer.current = { x: (event.clientX - rect.left) / rect.width * 2 - 1, y: (event.clientY - rect.top) / rect.height * 2 - 1 }
      }}
      onPointerLeave={() => { pointer.current = { x: 0, y: 0 } }}>
      <canvas ref={canvas} aria-hidden="true"/>
      <button className="core-orb" onClick={onOpen} type="button" aria-label="VISIONS Core">
        <BrandMark size={57}/><strong>VISIONS</strong><small>OPEN CORE</small>
      </button>
    </div>
  </section>
}
