'use client'

import { useState, type FormEvent } from 'react'
import type { FrameworkStore } from './use-framework'

export function AccountAccess({ mode }: { mode: FrameworkStore['mode'] }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const signedIn = mode === 'account'

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/account', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signedIn ? { action: 'signout' } : { action: 'signin', email: fields.get('email'), password: fields.get('password') }),
      })
      if (!response.ok) throw new Error((await response.json()).error ?? 'Could not change account access.')
      window.dispatchEvent(new Event('visions-account'))
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not change account access.')
    } finally { setBusy(false) }
  }

  return <section className="panel workspace-surface">
    <h2>Account</h2>
    <form className="personal-form" onSubmit={submit}>
      {!signedIn && <>
        <label>Email <input name="email" type="email" autoComplete="username" maxLength={254} required/></label>
        <label>Password <input name="password" type="password" autoComplete="current-password" maxLength={1024} required/></label>
      </>}
      {error && <p role="alert">{error}</p>}
      <button className="primary-button" disabled={busy || mode === 'loading'}>{signedIn ? 'Sign out' : 'Sign in'}</button>
    </form>
  </section>
}
