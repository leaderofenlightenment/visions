import assert from 'node:assert/strict'
import { after, afterEach, test } from 'node:test'
import { JSDOM } from 'jsdom'

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://nexus.test' })
const { window } = dom
Object.assign(globalThis, {
  window,
  document: window.document,
  localStorage: window.localStorage,
  HTMLElement: window.HTMLElement,
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

afterEach(() => {
  cleanup()
  window.localStorage.clear()
  window.history.replaceState(null, '', '/')
})
after(() => window.close())

test('opens the keyboard palette, finds an agent, then returns focus to the launcher', () => {
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
  assert.ok(screen.getByRole('heading', { name: 'Live execution' }))
  fireEvent.click(screen.getByRole('button', { name: 'Close dialog' }))
  assert.equal(document.activeElement, opener)
})

test('saves a workflow intention, restores it on remount, and deletes it', () => {
  const view = render(<Nexus />)
  fireEvent.click(screen.getByRole('button', { name: 'Plan multi-agent workflow' }))
  const intention = screen.getByRole('textbox', { name: 'Task intention' })
  fireEvent.change(intention, { target: { value: 'Research and draft an article' } })
  fireEvent.click(screen.getByRole('button', { name: 'Save local draft' }))
  const project = screen.getByRole('article')
  assert.ok(within(project).getByText('Research and draft an article'))
  assert.ok(within(project).getByText('Negation'))
  view.unmount()

  render(<Nexus />)
  assert.ok(screen.getByRole('heading', { name: 'Research and draft an article' }))
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
