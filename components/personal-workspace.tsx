'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { type Completion, type PersonalRecord, type RecordKind, localDay } from '@/lib/personal'
import { RelationshipGraph } from './relationship-graph'

const labels = { habit: 'Habit', journal: 'Journal entry', relationship: 'Person', project: 'Project' }

async function request(path: string, data?: Record<string, unknown>, signal?: AbortSignal) {
  const response = await fetch(path, data
    ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), signal }
    : { cache: 'no-store', signal })
  const result = await response.json()
  if (!response.ok) throw new Error(result.error ?? 'The request failed.')
  return result
}

function message(error: unknown) { return error instanceof Error ? error.message : 'The request failed.' }

export function PersonalWorkspace({ kind }: { kind: RecordKind }) {
  const [account, setAccount] = useState<{ configured: boolean; signedIn: boolean } | null>(null)
  const [records, setRecords] = useState<PersonalRecord[]>([])
  const [completions, setCompletions] = useState<Completion[]>([])
  const [day, setDay] = useState('')
  const [span, setSpan] = useState(7)
  const [edit, setEdit] = useState<PersonalRecord | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)
  const [busy, setBusy] = useState(false)
  const label = labels[kind]
  const dates = day ? Array.from({ length: span }, (_, index) => {
    const date = new Date(day + 'T12:00:00')
    date.setDate(date.getDate() - span + 1 + index)
    return localDay(date)
  }) : []
  const from = dates[0] ?? ''

  useEffect(() => {
    const controller = new AbortController()
    request('/api/account', undefined, controller.signal).then(result => {
      if (!controller.signal.aborted) { setAccount(result); setDay(localDay()) }
    })
      .catch(error => { if (!controller.signal.aborted) setError(message(error)) })
    return () => controller.abort()
  }, [])

  const signedIn = account?.signedIn
  useEffect(() => {
    if (!signedIn || (kind === 'habit' && !day)) return
    const controller = new AbortController()
    const query = new URLSearchParams({ kind, start: from, end: day })
    request('/api/personal?' + query, undefined, controller.signal).then(data => {
      if (!controller.signal.aborted) {
        setRecords(data.records)
        setCompletions(data.completions)
      }
    }).catch(error => { if (!controller.signal.aborted) setError(message(error)) })
    return () => controller.abort()
  }, [signedIn, kind, from, day, revision])

  async function run(work: () => Promise<void>) {
    setBusy(true)
    setError('')
    try { await work() }
    catch (error) { setError(message(error)) }
    finally { setBusy(false) }
  }

  function accountAction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    void run(async () => {
      const action = account?.signedIn ? 'signout' : 'signin'
      const result = await request('/api/account', { action, email: form.get('email'), password: form.get('password') })
      setRecords([])
      setCompletions([])
      setEdit(null)
      setDeleteId(null)
      setDay(localDay())
      setAccount({ configured: true, signedIn: result.signedIn })
    })
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const element = event.currentTarget
    const form = new FormData(element)
    const condition = form.get('condition')
    void run(async () => {
      await request('/api/personal', {
        action: 'save', kind, id: edit?.id ?? null, title: form.get('title'), note: form.get('note'),
        category: form.get('category'), condition: condition ? Number(condition) : null, archived: edit?.archived ?? false,
      })
      setEdit(null)
      element.reset()
      setRevision(value => value + 1)
    })
  }

  const visible = records.filter(record => record.archived === showArchived
    && (record.title + ' ' + record.category).toLowerCase().includes(search.trim().toLowerCase()))
  const groups = new Map<string, PersonalRecord[]>()
  for (const record of visible) {
    const category = record.category || 'Uncategorized'
    groups.set(category, [...(groups.get(category) ?? []), record])
  }

  return <section className="panel workspace-surface personal-workspace">
    <div className="section-row"><h2>{label === 'Person' ? 'Private relationships' : label + 's'}</h2>
      {account?.signedIn && <form onSubmit={accountAction}><button className="secondary-button" disabled={busy}>Sign out</button></form>}
    </div>
    {error && <p role="alert" className="status-note">{error}</p>}
    {!account && !error && <p role="status">Checking workspace access…</p>}
    {account && !account.configured && <p className="muted">This workspace needs Supabase authentication and the database migration. See the project README for setup.</p>}
    {account?.configured && !account.signedIn && <form className="personal-form" onSubmit={accountAction}>
      <label>Email <input name="email" type="email" autoComplete="username" maxLength={254} required/></label>
      <label>Password <input name="password" type="password" autoComplete="current-password" maxLength={1024} required/></label>
      <button className="primary-button" disabled={busy}>Sign in</button>
    </form>}
    {account?.signedIn && <>
      <form className="personal-form" key={edit?.id ?? 'new'} onSubmit={save}>
        <label>{kind === 'relationship' ? 'Name' : 'Title'} <input id="personal-record-title" name="title" required maxLength={160} defaultValue={edit?.title}/></label>
        <label>Category <input name="category" maxLength={80} defaultValue={edit?.category}/></label>
        <label>{kind === 'relationship' ? 'Private notes and next action' : 'Notes'} <textarea name="note" maxLength={12000} rows={3} defaultValue={edit?.note}/></label>
        {kind === 'relationship' && <label>Relationship condition (optional, 1–10)
          <input name="condition" type="number" min={1} max={10} step={1} defaultValue={edit?.condition ?? undefined}/>
        </label>}
        <div className="personal-actions"><button className="primary-button" disabled={busy}>{edit ? 'Save changes' : 'Add ' + label.toLowerCase()}</button>
          {edit && <button className="secondary-button" type="button" onClick={() => setEdit(null)}>Cancel edit</button>}</div>
      </form>
      <div className="personal-filters">
        <label>Search <input value={search} onChange={event => setSearch(event.target.value)}/></label>
        <label><input type="checkbox" checked={showArchived} onChange={event => setShowArchived(event.target.checked)}/> Archived</label>
        {kind === 'habit' && <>
          <label>Ending date <input type="date" value={day || localDay()} onChange={event => { if (event.target.value) setDay(event.target.value) }}/></label>
          <label>Calendar <select value={span} onChange={event => setSpan(Number(event.target.value))}><option value="7">Last 7 days</option><option value="30">Last 30 days</option></select></label>
        </>}
      </div>
      {kind === 'relationship' && <RelationshipGraph groups={groups} onSelect={record => {
        setEdit(record)
        requestAnimationFrame(() => document.getElementById('personal-record-title')?.focus())
      }}/>}
      {!visible.length && <p className="muted">No matching records.</p>}
      {Array.from(groups).map(([category, entries]) => <section key={category}>
        <h3>{category}</h3>
        {entries.map(record => <article className="personal-record" key={record.id}>
          <strong>{record.title}</strong>
          {kind === 'relationship' && <small>{record.condition === null ? 'Unrated' : 'Relationship condition · ' + record.condition + '/10'}</small>}
          {record.note && <p>{record.note}</p>}
          {kind === 'habit' && !record.archived && dates.length > 0 && <div className="habit-calendar" aria-label={record.title + ' completion calendar'}>
            {dates.map(date => {
              const done = completions.some(item => item.habit_id === record.id && item.day === date)
              return <button key={date} type="button" className="secondary-button" aria-label={record.title + ' on ' + date}
                aria-pressed={done} disabled={busy} onClick={() => void run(async () => {
                  await request('/api/personal', { action: 'complete', id: record.id, day: date, done: !done })
                  setRevision(value => value + 1)
                })}>{date.slice(5)}</button>
            })}
          </div>}
          <div className="personal-actions">
            <button className="secondary-button" onClick={() => setEdit(record)}>Edit {label.toLowerCase()}</button>
            <button className="secondary-button" disabled={busy} onClick={() => void run(async () => {
              await request('/api/personal', { ...record, action: 'save', archived: !record.archived })
              setRevision(value => value + 1)
            })}>{record.archived ? 'Restore' : 'Archive'}</button>
            <button className="secondary-button" disabled={busy} onClick={() => setDeleteId(record.id)}>Delete</button>
          </div>
          {deleteId === record.id && <div className="personal-actions"><p>Delete this record permanently?</p>
            <button className="secondary-button" disabled={busy} onClick={() => void run(async () => {
              await request('/api/personal', { action: 'delete', kind, id: record.id })
              setDeleteId(null)
              if (edit?.id === record.id) setEdit(null)
              setRevision(value => value + 1)
            })}>Confirm delete</button>
            <button className="secondary-button" onClick={() => setDeleteId(null)}>Cancel</button></div>}
        </article>)}
      </section>)}
    </>}
  </section>
}
