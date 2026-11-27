import assert from 'node:assert/strict'
import { after, afterEach, beforeEach, mock, test } from 'node:test'
import { JSDOM } from 'jsdom'

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://nexus.test' })
const { window } = dom
Object.assign(globalThis, {
  window,
  document: window.document,
  localStorage: window.localStorage,
  HTMLElement: window.HTMLElement,
  FormData: window.FormData,
  Event: window.Event,
  HashChangeEvent: window.HashChangeEvent,
})

Object.defineProperties(window, {
  matchMedia: { value: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }) },
  scrollTo: { value: () => {} },
})
// The browser scene is separate from the controls exercised by these DOM tests.
window.HTMLCanvasElement.prototype.getContext = () => null
window.HTMLDialogElement.prototype.showModal ??= function () { this.open = true }
window.HTMLDialogElement.prototype.close ??= function () { this.open = false }

const { cleanup, fireEvent, render, screen, within } = await import('@testing-library/react')
const { Nexus } = await import('../components/nexus')

beforeEach(() => {
  mock.method(globalThis, 'fetch', async (path: string) => Response.json(path === '/api/framework'
    ? { mode: 'device' } : { configured: false, signedIn: false }))
})

afterEach(() => {
  cleanup()
  mock.restoreAll()
  window.localStorage.clear()
  window.history.replaceState(null, '', '/')
})
after(() => window.close())

test('opens the keyboard palette, finds a lens, then returns focus to the launcher', async () => {
  render(<Nexus />)
  const opener = screen.getByRole('button', { name: 'Open command palette' })
  opener.focus()
  fireEvent.keyDown(opener, { key: 'k', ctrlKey: true })
  const search = screen.getByRole('textbox', { name: /search workspaces/i })
  assert.equal(document.activeElement, search)
  fireEvent.change(search, { target: { value: 'discernment engine' } })
  const result = within(screen.getByRole('dialog')).getByRole('button', { name: /Negation/ })
  fireEvent.keyDown(search, { key: 'ArrowDown' })
  assert.equal(document.activeElement, result)
  fireEvent.click(result)
  assert.ok(screen.getByRole('dialog', { name: 'Negation' }))
  await screen.findByRole('region', { name: 'VISIONS framework' })
  assert.ok(screen.getByText(/what might you need to question/i))
  fireEvent.click(screen.getByRole('button', { name: 'Close dialog' }))
  assert.equal(document.activeElement, opener)
})

test('saves a workflow intention, restores it on remount, and deletes it', () => {
  const view = render(<Nexus />)
  fireEvent.click(screen.getByRole('button', { name: 'Plan multi-agent workflow' }))
  const intention = screen.getByRole('textbox', { name: 'Task intention' })
  fireEvent.change(intention, { target: { value: 'Serve others through work without crowding out family time' } })
  fireEvent.click(screen.getByRole('button', { name: 'Save local draft' }))
  const project = screen.getByRole('article')
  assert.ok(within(project).getByText('Serve others through work without crowding out family time'))
  assert.ok(within(project).getByText('Negation'))
  view.unmount()

  render(<Nexus />)
  assert.ok(screen.getByRole('heading', { name: 'Serve others through work without crowding out family time' }))
  fireEvent.click(screen.getByRole('button', { name: 'Delete draft' }))
  assert.equal(screen.queryByRole('article'), null)
})

test('toggles module visibility and changes the reduced motion preference', () => {
  const { container } = render(<Nexus />)
  fireEvent.click(screen.getByRole('switch', { name: 'Lifestyle' }))
  assert.equal(screen.queryByRole('button', { name: /Being Lifestyle/ }), null)
  assert.ok(screen.getByRole('link', { name: 'Lifestyle' }))
  fireEvent.click(screen.getByRole('link', { name: 'Settings' }))
  fireEvent.click(screen.getByRole('checkbox', { name: /Reduce motion/ }))
  assert.ok(container.querySelector('.app-shell.reduced-motion'))
})

test('uses the centered Core as the only network control', () => {
  render(<Nexus />)
  const network = within(screen.getByRole('region', { name: 'VISIONS neural network' }))
  assert.equal(network.getAllByRole('button').length, 1)
  fireEvent.click(network.getByRole('button', { name: 'VISIONS Core' }))
  assert.ok(screen.getByRole('dialog', { name: 'VISIONS Core' }))
})

test('adds connected framework ideas and returns to them through the Core', async () => {
  const view = render(<Nexus />)
  fireEvent.click(screen.getByRole('button', { name: 'VISIONS Core' }))
  const dialog = within(screen.getByRole('dialog', { name: 'VISIONS Core' }))
  await dialog.findByRole('table')
  fireEvent.click(dialog.getByRole('button', { name: 'Vision in Lifestyle: 0 ideas' }))
  fireEvent.change(dialog.getByRole('textbox', { name: 'Idea title' }), { target: { value: 'Protected rest' } })
  fireEvent.click(dialog.getByRole('checkbox', { name: 'Business' }))
  fireEvent.click(dialog.getByRole('button', { name: 'Save idea' }))
  await dialog.findByRole('heading', { name: 'Protected rest' })
  fireEvent.click(dialog.getByRole('button', { name: 'Integration in Relationships: 0 ideas' }))
  fireEvent.change(dialog.getByRole('textbox', { name: 'Idea title' }), { target: { value: 'Shared evening rhythm' } })
  fireEvent.click(dialog.getByRole('checkbox', { name: 'Protected rest · Vision' }))
  fireEvent.click(dialog.getByRole('button', { name: 'Save idea' }))
  await dialog.findByRole('heading', { name: 'Shared evening rhythm' })
  assert.ok(dialog.getByRole('button', { name: 'Protected rest · Vision' }))
  fireEvent.click(dialog.getByRole('button', { name: 'Close dialog' }))
  view.unmount()
  render(<Nexus />)
  fireEvent.click(screen.getByRole('button', { name: 'VISIONS Core' }))
  const reopened = within(screen.getByRole('dialog', { name: 'VISIONS Core' }))
  const relationships = await reopened.findByRole('button', { name: 'Integration in Relationships: 1 idea' })
  fireEvent.click(relationships)
  assert.ok(reopened.getByRole('button', { name: 'Explore Shared evening rhythm' }))
})

test('applies a course system and makes it available in the Core', async () => {
  render(<Nexus />)
  fireEvent.click(screen.getByRole('button', { name: 'Explore course' }))
  fireEvent.change(screen.getByRole('textbox', { name: 'Find course material' }), { target: { value: 'Sacramental Lifestyle Worksheet' } })
  fireEvent.click(screen.getByRole('button', { name: 'Apply in VISIONS' }))
  const dialog = within(screen.getByRole('dialog', { name: 'Sacramental Lifestyle Worksheet' }))
  const title = await dialog.findByRole('textbox', { name: 'Idea title' })
  assert.ok((dialog.getByRole('checkbox', { name: 'Lifestyle' }) as HTMLInputElement).checked)
  fireEvent.change(title, { target: { value: 'Make space for family rest' } })
  fireEvent.click(dialog.getByRole('button', { name: 'Save idea' }))
  await dialog.findByRole('heading', { name: 'Make space for family rest' })
  assert.ok(dialog.getByRole('button', { name: 'Sacramental Lifestyle Worksheet' }))
  fireEvent.click(dialog.getByRole('button', { name: 'Close dialog' }))
  fireEvent.click(screen.getByRole('link', { name: 'Dashboard' }))
  fireEvent.click(screen.getByRole('button', { name: 'VISIONS Core' }))
  assert.ok(await screen.findByRole('button', { name: 'System in Lifestyle: 1 idea' }))
})

test('keeps each domain course library in its own workspace when switching sections', () => {
  render(<Nexus />)

  const courseHeading = 'Apply the course to Relationships'
  for (const destination of ['Lifestyle', 'Business', 'Course', 'Content Library', 'Settings', 'Dashboard']) {
    fireEvent.click(screen.getByRole('link', { name: 'Relationships' }))
    assert.equal(screen.getAllByRole('heading', { name: courseHeading }).length, 1)
    assert.ok(screen.getByRole('heading', { name: 'Interpersonal Dynamic Articulation' }))
    assert.ok(screen.getByRole('heading', { name: 'Private relationships' }))

    fireEvent.click(screen.getByRole('link', { name: destination }))
    assert.equal(screen.queryAllByRole('heading', { name: courseHeading }).length, 0, destination)
  }
})

test('reads lesson content inside VISIONS and follows an internal course reference', async () => {
  const fetchMock = globalThis.fetch as unknown as { mock: { mockImplementation(impl: (path: string) => Promise<Response>): void } }
  fetchMock.mock.mockImplementation(async path => Response.json(
    path === '/api/framework' ? { mode: 'device' }
      : path.endsWith('189776d8f6278108ac1cfffcbc4605e8') ? { markdown: '## A private exercise\n\n[Open related material](#course-material=181776d8f62780d39355eaf88309c3a4)' }
      : { markdown: '## Related private exercise' },
  ))
  render(<Nexus />)
  fireEvent.click(screen.getByRole('button', { name: 'Explore course' }))
  fireEvent.change(screen.getByRole('textbox', { name: 'Find course material' }), { target: { value: 'Sacramental Lifestyle Worksheet' } })
  fireEvent.click(screen.getByRole('button', { name: 'Read in VISIONS' }))
  const reader = within(screen.getByRole('dialog', { name: 'Sacramental Lifestyle Worksheet' }))
  await reader.findByRole('heading', { name: 'A private exercise' })
  fireEvent.click(reader.getByRole('button', { name: 'Open related material' }))
  const related = within(screen.getByRole('dialog', { name: 'Vision Sculpting' }))
  await related.findByRole('heading', { name: 'Related private exercise' })
  assert.equal(screen.queryByRole('link', { name: /notion/i }), null)
})

test('saving the guided framework updates the Core and the corresponding document', async () => {
  render(<Nexus />)
  fireEvent.click(screen.getByRole('button', { name: 'Open guided framework' }))
  const answer = await screen.findByRole('textbox', { name: /Vision of Theosis/ })
  fireEvent.change(answer, { target: { value: 'Close work at sundown and leave space for prayer.' } })
  fireEvent.click(screen.getByRole('button', { name: 'Save Lifestyle to VISIONS' }))
  await screen.findByText('1 of 21 prompts saved')
  fireEvent.click(screen.getByRole('link', { name: 'Dashboard' }))
  fireEvent.click(screen.getByRole('button', { name: 'VISIONS Core' }))
  assert.ok(await screen.findByRole('button', { name: 'Vision in Lifestyle: 1 idea' }))
  fireEvent.click(screen.getByRole('button', { name: 'Close dialog' }))
  fireEvent.click(screen.getByRole('link', { name: 'Lifestyle' }))
  assert.ok(screen.getByRole('heading', { name: 'The Theosis Framework document' }))
  assert.ok(screen.getByText('Close work at sundown and leave space for prayer.'))
})

test('saves a private course answer then applies a copy with its source to the Core', async () => {
  const promptId = 'b'.repeat(24)
  const payloads: unknown[] = []
  const fetchMock = globalThis.fetch as unknown as { mock: { mockImplementation(impl: (path: string, init?: RequestInit) => Promise<Response>): void } }
  fetchMock.mock.mockImplementation(async (path, init) => {
    if (path === '/api/framework') return Response.json({ mode: 'device' })
    if (init?.method === 'POST') {
      const result = JSON.parse(String(init.body))
      payloads.push(result)
      return Response.json(result)
    }
    return Response.json({ parts: [{ markdown: '## Name a rhythm', prompt: { id: promptId, number: 1 } }], answers: [] })
  })
  render(<Nexus />)
  fireEvent.click(screen.getByRole('button', { name: 'Explore course' }))
  fireEvent.change(screen.getByRole('textbox', { name: 'Find course material' }), { target: { value: 'Sacramental Lifestyle Worksheet' } })
  fireEvent.click(screen.getByRole('button', { name: 'Read in VISIONS' }))
  const response = await screen.findByRole('textbox', { name: 'Your answer 1' })
  const value = 'Make room for an unhurried weekly meal.'
  fireEvent.change(response, { target: { value } })
  fireEvent.click(screen.getByRole('button', { name: 'Save answer' }))
  await screen.findByText('Answer saved in the course.')
  fireEvent.click(screen.getByRole('button', { name: 'Add answer to VISIONS Core' }))
  const form = await screen.findByRole('textbox', { name: 'Reflection' })
  assert.equal((form as HTMLTextAreaElement).value, value)
  fireEvent.click(screen.getByRole('button', { name: 'Save idea' }))
  await screen.findByText('Idea added to the network.')
  assert.deepEqual(payloads, [{ promptId, answer: value }])
  assert.ok(localStorage.getItem('visions.framework.v1')?.includes(promptId))
})
