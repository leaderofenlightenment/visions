'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { emptyFramework, parseFramework, type Framework } from '@/lib/framework'

type Access =
  | { mode: 'loading' | 'device' | 'signed-out' }
  | { mode: 'failed'; error: string }
  | { mode: 'account'; graph: Framework; revision: number }

const key = 'visions.framework.v1'
const deviceChoice = 'visions.framework-device-mode'
const empty = JSON.stringify(emptyFramework)

function subscribe(listener: () => void) {
  window.addEventListener('storage', listener)
  window.addEventListener('visions-framework', listener)
  return () => {
    window.removeEventListener('storage', listener)
    window.removeEventListener('visions-framework', listener)
  }
}

function getDeviceSnapshot() {
  try { return localStorage.getItem(key) ?? empty }
  catch { return empty }
}

function readDevice(snapshot: string) {
  try { return parseFramework(JSON.parse(snapshot)) ?? emptyFramework }
  catch { return emptyFramework }
}

export function useFramework() {
  const [access, setAccess] = useState<Access>({ mode: 'loading' })
  const [reload, setReload] = useState(0)
  const [useDevice, setUseDevice] = useState(false)
  const deviceSnapshot = useSyncExternalStore(subscribe, getDeviceSnapshot, () => empty)

  useEffect(() => {
    let controller: AbortController | undefined
    function refresh() {
      controller?.abort()
      const current = new AbortController()
      controller = current
      fetch('/api/framework', { signal: current.signal, cache: 'no-store' })
        .then(async response => {
          const data = await response.json()
          if (!response.ok) throw new Error(data.error ?? 'Could not open the framework.')
          if (!current.signal.aborted) {
            if (data.mode === 'signed-out') {
              try { setUseDevice(localStorage.getItem(deviceChoice) === 'yes') }
              catch { /* Device selection is optional. */ }
            }
            setAccess(data)
          }
        })
        .catch(error => {
          if (!current.signal.aborted) setAccess({ mode: 'failed', error: error instanceof Error ? error.message : 'Could not open the framework.' })
        })
    }
    refresh()
    function accountChanged() {
      setAccess({ mode: 'loading' })
      refresh()
    }
    window.addEventListener('visions-account', accountChanged)
    return () => {
      controller?.abort()
      window.removeEventListener('visions-account', accountChanged)
    }
  }, [reload])

  const mode = access.mode === 'signed-out' && useDevice ? 'device' : access.mode
  const graph = access.mode === 'account' ? access.graph : mode === 'device' ? readDevice(deviceSnapshot) : emptyFramework

  async function save(input: Framework) {
    const next = parseFramework(input)
    if (!next) throw new Error('Check the idea fields and framework limits.')
    if (mode === 'device') {
      if (getDeviceSnapshot() !== deviceSnapshot) throw new Error('This framework changed in another window. Open the latest graph first.')
      localStorage.setItem(key, JSON.stringify(next))
      window.dispatchEvent(new Event('visions-framework'))
      return
    }
    if (access.mode !== 'account') throw new Error('Open your framework before saving.')
    const response = await fetch('/api/framework', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ graph: next, revision: access.revision }),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error ?? 'Could not save the framework.')
    setAccess(current => current === access
      ? { mode: 'account', graph: next, revision: data.revision } : current)
  }

  function openDevice() {
    try { localStorage.setItem(deviceChoice, 'yes') }
    catch { /* Storage may be unavailable in this browser. */ }
    setUseDevice(true)
  }

  return { graph, mode, openDevice, error: access.mode === 'failed' ? access.error : '', save, reload: () => setReload(value => value + 1) }
}

export type FrameworkStore = ReturnType<typeof useFramework>
