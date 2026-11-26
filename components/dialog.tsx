'use client'

import { useEffect, useId, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

export function Dialog({ title, label, onClose, children }: { title: string; label?: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    const previous = document.activeElement
    dialog.showModal()
    dialog.querySelector<HTMLElement>('[data-dialog-focus]')?.focus()
    return () => {
      dialog.close()
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus()
    }
  }, [])
  return <dialog ref={ref} aria-labelledby={titleId} className="workspace-dialog" onCancel={event => { event.preventDefault(); onClose() }}>
    <div className="dialog-header">
      <div>{label && <span className="eyebrow">{label}</span>}<h2 id={titleId}>{title}</h2></div>
      <button className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={19}/></button>
    </div>
    {children}
  </dialog>
}
