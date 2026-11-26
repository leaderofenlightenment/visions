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

const { cleanup, fireEvent, render, screen, waitFor, within } = await import('@testing-library/react')
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

test('exposes zoom and reset controls for the eight-node network', () => {
  render(<Nexus />)
  const network = within(screen.getByRole('region', { name: 'VISIONS neural network' }))
  assert.equal(network.getAllByRole('button').length, 11)
  fireEvent.click(network.getByRole('button', { name: 'Zoom in' }))
  assert.equal(network.getByRole('status').textContent, '120%')
  fireEvent.click(network.getByRole('button', { name: 'Reset network view' }))
  assert.equal(network.getByRole('status').textContent, '100%')
})


test('adds connected framework ideas and opens their live domain branch', async () => {
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
  const graph = within(screen.getByRole('region', { name: 'VISIONS neural network' }))
  assert.ok(graph.getByRole('button', { name: 'Business branch, vision, 1 idea' }))
  fireEvent.click(graph.getByRole('button', { name: 'Relationships branch, integration, 1 idea' }))
  assert.ok(screen.getByRole('dialog', { name: 'Integration' }))
  assert.ok(screen.getByRole('button', { name: 'Explore Shared evening rhythm' }))
  view.unmount()
  render(<Nexus />)
  await waitFor(() => assert.ok(screen.getByRole('button', { name: 'Relationships branch, integration, 1 idea' })))
})

test('applies a course system to its domain and grows a saved branch', async () => {
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
  assert.ok(screen.getByRole('button', { name: 'Lifestyle branch, system, 1 idea' }))
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
