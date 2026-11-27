'use client'

import { useEffect, useState, type FormEvent } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { CourseAnswer, type CourseApplication } from './course-answer'
import type { CourseResponse, WorksheetPart } from '@/lib/course-worksheet'
import { courseMaterial } from '@/lib/course'

const mediaUrl = /^\/api\/course\/media\/[a-f0-9]{64}\.[a-z0-9]{1,8}$/

function readerUrl(url: string) {
  if (mediaUrl.test(url) || /^#course-material=[a-f0-9]{32}$/.test(url)) return url
  try {
    const target = new URL(url)
    if (/^https?:$/.test(target.protocol) && !/(^|\.)notion\.(com|so|site)$/i.test(target.hostname)) return url
  } catch { /* Unrecognized links remain plain text. */ }
  return ''
}

export function CourseReader({ id, onOpen, onApply }: {
  id: string; onOpen: (id: string) => void; onApply: (application?: CourseApplication) => void
}) {
  const [resource, setResource] = useState<{ parts: WorksheetPart[]; answers: CourseResponse[]; writable: boolean } | { error: string; status: number } | null>(null)
  const [retry, setRetry] = useState(0)
  const [signingIn, setSigningIn] = useState(false)
  const [loginError, setLoginError] = useState('')
  useEffect(() => {
    const pending = new AbortController()
    function load() {
      fetch('/api/course/' + id, { signal: pending.signal, cache: 'no-store' }).then(async response => {
        const data = await response.json()
        if (!pending.signal.aborted) setResource(response.ok ? { parts: data.parts ?? [{ markdown: data.markdown }], answers: data.answers ?? [], writable: data.writable !== false } : { error: data.error, status: response.status })
      }).catch(() => {
        if (!pending.signal.aborted) setResource({ error: 'Could not open the course material.', status: 503 })
      })
    }
    load()
    function authChanged() { setResource(null); setRetry(value => value + 1) }
    window.addEventListener('visions-account', authChanged)
    return () => { pending.abort(); window.removeEventListener('visions-account', authChanged) }
  }, [id, retry])

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    setSigningIn(true)
    setLoginError('')
    try {
      const response = await fetch('/api/account', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'signin', email: fields.get('email'), password: fields.get('password') }),
      })
      if (!response.ok) throw new Error('Sign-in failed. Check your email and password.')
      window.dispatchEvent(new Event('visions-account'))
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Could not sign in.')
    } finally { setSigningIn(false) }
  }

  if (!resource) return <p role="status">Opening course material…</p>
  if ('error' in resource) return <div>
    <p role="alert">{resource.error}</p>
    {resource.status === 401 && <form className="personal-form" onSubmit={signIn}>
      <label>Email <input type="email" name="email" autoComplete="username" required maxLength={254}/></label>
      <label>Password <input type="password" name="password" autoComplete="current-password" required maxLength={1024}/></label>
      {loginError && <p role="alert">{loginError}</p>}
      <button className="primary-button" disabled={signingIn}>{signingIn ? 'Signing in…' : 'Sign in'}</button>
    </form>}
    {resource.status !== 401 && <button type="button" className="secondary-button" onClick={() => { setResource(null); setRetry(value => value + 1) }}>Try again</button>}
  </div>

  return <section aria-label="Course material">
    {!resource.writable && <p role="alert">Course answers are temporarily unavailable. You can still read the material.</p>}
    <div className="course-reading">{resource.parts.map((part, index) => <div key={part.prompt?.id ?? 'text-' + index}>
      <Markdown remarkPlugins={[remarkGfm]} skipHtml
        urlTransform={readerUrl}
        components={{
          a({ href, children }) {
            if (!href) return <>{children}</>
            if (href.startsWith('#course-material=')) {
              const target = href.split('=')[1]
              return courseMaterial(target)
                ? <button className="course-inline-link" type="button" onClick={() => onOpen(target)}>{children}</button>
                : <>{children}</>
            }
            if (mediaUrl.test(href)) {
              if (/\.(mp4|webm)$/.test(href)) return <video src={href} controls preload="metadata"/>
              if (/\.(mp3|wav|ogg|m4a)$/.test(href)) return <audio src={href} controls preload="metadata"/>
              return <a href={href} target="_blank" rel="noreferrer">{children}</a>
            }
            return <a href={href} target="_blank" rel="noreferrer">{children}</a>
          },
          img({ src, alt }) {
            if (typeof src !== 'string' || !mediaUrl.test(src)) return <span>{alt || 'External image'}</span>
            // Course images are authorized on demand through the private media route.
            // eslint-disable-next-line @next/next/no-img-element
            return <img src={src} alt={alt ?? ''} loading="lazy"/>
          },
        }}>{part.markdown}</Markdown>
      {part.prompt && <CourseAnswer key={part.prompt.id} prompt={part.prompt} materialId={id} writable={resource.writable} onApply={onApply}
        initial={resource.answers.find(answer => answer.promptId === part.prompt?.id)?.answer ?? ''}/>}
    </div>)}</div>
    <button type="button" className="primary-button" onClick={() => onApply()}>Apply in VISIONS</button>
  </section>
}
