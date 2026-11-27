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

test('opens the keyboard palette, finds the Core, and restores focus when closed', () => {
  render(<Nexus />)
  const opener = screen.getByRole('button', { name: 'Find workspace' })
  opener.focus()
  fireEvent.keyDown(opener, { key: 'k', ctrlKey: true })
  const search = screen.getByRole('textbox', { name: 'Search workspaces' })
  assert.equal(document.activeElement, search)
  fireEvent.change(search, { target: { value: 'Codex' } })
  assert.ok(within(screen.getByRole('dialog')).getByRole('button', { name: 'VISIONS Core' }))
  fireEvent.click(screen.getByRole('button', { name: 'Close dialog' }))
  assert.equal(document.activeElement, opener)
})

test('uses the centered Core as the only network control and shows the Codex content domains', async () => {
  render(<Nexus />)
  const network = within(screen.getByRole('region', { name: 'VISIONS neural network' }))
  assert.equal(network.getAllByRole('button').length, 1)
  const domains = within(screen.getByRole('region', { name: 'Content domains' }))
  assert.ok(domains.getByText('Mind · Body · Soul'))
  assert.ok(domains.getByText('Asceticism · Skillset · Community'))
  assert.ok(domains.getByText('Self-Mastery · Household Dynamics · Ministry'))

  fireEvent.click(network.getByRole('button', { name: 'VISIONS Core' }))
  const method = within(await screen.findByRole('region', { name: 'VISIONS method' }))
  assert.ok(method.getByRole('heading', { name: 'The Horizon of Dominion' }))
  assert.equal(screen.queryByRole('link', { name: 'Guided Framework' }), null)
  assert.equal(screen.queryByRole('link', { name: 'Reality Codex' }), null)
  assert.equal(screen.queryByRole('link', { name: 'Agents' }), null)
})

test('persists the reduced motion preference', () => {
  const { container } = render(<Nexus />)
  fireEvent.click(screen.getByRole('button', { name: 'Find workspace' }))
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Settings' }))
  fireEvent.click(screen.getByRole('checkbox', { name: /Reduce motion/ }))
  assert.ok(container.querySelector('.app-shell.reduced-motion'))
})

test('saves one VISIONS movement and populates all three documents', async () => {
  const view = render(<Nexus />)
  fireEvent.click(screen.getByRole('link', { name: 'VISIONS Core' }))
  const life = await screen.findByRole('textbox', { name: 'Theosis — Mind' })
  assert.match(life.getAttribute('aria-describedby') ?? '', /guide-vision-lifestyle/)
  const entries = [
    ['Theosis — Mind', 'Close work at sundown and leave space for prayer.'],
    ['Creativity — Asceticism', 'Protect mornings for writing.'],
    ['Psychology — Self-Mastery', 'Call my brother on Fridays.'],
  ] as const
  for (const [name, value] of entries) fireEvent.change(screen.getByRole('textbox', { name }), { target: { value } })
  fireEvent.click(screen.getByRole('button', { name: 'Save Vision' }))
  await screen.findByText('3 of 21 prompts saved')
  fireEvent.click(screen.getByRole('button', { name: 'Next movement' }))
  assert.ok(screen.getByRole('heading', { name: 'The Stewardship of the Vessel' }))
  assert.ok(screen.getByRole('textbox', { name: 'Psychology — Household Dynamics' }))

  for (const [index, [workspace, name]] of [['Lifestyle', 'Rule of Life'], ['Business', 'Business Plan'], ['Relationships', 'Relationship Management']].entries()) {
    fireEvent.click(screen.getByRole('link', { name: workspace }))
    assert.ok(within(screen.getByRole('region', { name })).getByText(entries[index][1]))
  }
  view.unmount()
  render(<Nexus />)
  fireEvent.click(screen.getByRole('link', { name: 'VISIONS Core' }))
  const loaded = await screen.findByRole('textbox', { name: 'Creativity — Asceticism' })
  assert.equal((loaded as HTMLTextAreaElement).value, entries[1][1])
})

test('keeps each system and bonus in its workspace and brings the toolkit into the business process', () => {
  render(<Nexus />)
  assert.equal(screen.queryByRole('link', { name: 'Course' }), null)
  for (const [workspace, system, bonus] of [
    ['Lifestyle', 'Sacramental Lifestyle Worksheet', 'Modern Monastic'],
    ['Business', 'Career Creation Clarity', 'The Vortex Funnel'],
    ['Relationships', 'Interpersonal Dynamic Articulation', 'Threefold Partner Identification'],
    ['Business', 'Career Creation Clarity', 'The Vortex Funnel'],
  ]) {
    fireEvent.click(screen.getByRole('link', { name: workspace }))
    assert.equal(screen.getAllByRole('button', { name: 'Read ' + system }).length, 1)
    assert.equal(screen.getAllByRole('button', { name: 'Read ' + bonus }).length, 1)
    assert.equal(screen.queryAllByRole('button', { name: 'Read Threefold Partner Identification' }).length, workspace === 'Relationships' ? 1 : 0)
  }
  const process = within(screen.getByRole('list', { name: 'Creative business process' }))
  assert.ok(process.getByRole('button', { name: 'Read Digital Marketing Toolkit' }))
  assert.equal(process.getByRole('link', { name: 'Explore Eden' }).getAttribute('href'), 'https://eden.so/?via=eric44')
})

function mockFetch(implementation: (path: string, init?: RequestInit) => Promise<Response>) {
  const fetchMock = globalThis.fetch as unknown as { mock: { mockImplementation(impl: typeof implementation): void } }
  fetchMock.mock.mockImplementation(implementation)
}

test('keeps internal course links and removes legacy marketing affiliate links', async () => {
  mockFetch(async path => Response.json(
    path === '/api/framework' ? { mode: 'device' }
      : path.endsWith('189776d8f62781d98745d93187bca0c7') ? { markdown: '## Toolkit\n\n[Old promotion](https://partners.example.com/offer?via=old)\n\n[Open related worksheet](#course-material=181776d8f62780d39355eaf88309c3a4)' }
      : { markdown: '## Related private worksheet' },
  ))
  render(<Nexus />)
  fireEvent.click(screen.getByRole('link', { name: 'Business' }))
  fireEvent.click(screen.getByRole('button', { name: 'Read Digital Marketing Toolkit' }))
  const reader = within(screen.getByRole('dialog', { name: 'Digital Marketing Toolkit' }))
  await reader.findByRole('heading', { name: 'Toolkit' })
  assert.equal(reader.queryByRole('link', { name: 'Old promotion' }), null)
  fireEvent.click(reader.getByRole('button', { name: 'Open related worksheet' }))
  const related = within(screen.getByRole('dialog', { name: 'Vision Sculpting' }))
  await related.findByRole('heading', { name: 'Related private worksheet' })
})

test('saves a private course answer then applies a copy with its source to the Core', async () => {
  const promptId = 'b'.repeat(24)
  const payloads: unknown[] = []
  mockFetch(async (path, init) => {
    if (path === '/api/framework') return Response.json({ mode: 'device' })
    if (path === '/api/course/189776d8f6278108ac1cfffcbc4605e8') {
      if (init?.method === 'POST') {
        const result = JSON.parse(String(init.body))
        payloads.push(result)
        return Response.json(result)
      }
      return Response.json({ parts: [{ markdown: '## Name a rhythm', prompt: { id: promptId, number: 1 } }], answers: [] })
    }
    return Response.json({ configured: false, signedIn: false })
  })
  render(<Nexus />)
  fireEvent.click(screen.getByRole('link', { name: 'Lifestyle' }))
  fireEvent.click(screen.getByRole('button', { name: 'Read Sacramental Lifestyle Worksheet' }))
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
  fireEvent.click(screen.getByRole('button', { name: 'Close dialog' }))
  fireEvent.click(screen.getByRole('link', { name: 'VISIONS Core' }))
  assert.ok(await screen.findByText('Saved notes and course applications (1)'))
})

test('reviews a ChatGPT map before saving answers to the Core', async () => {
  render(<Nexus />)
  fireEvent.click(screen.getByRole('link', { name: 'VISIONS Core' }))
  const answer = await screen.findByRole('textbox', { name: 'Theosis — Mind' })
  fireEvent.change(answer, { target: { value: 'Keep a quiet evening.' } })
  fireEvent.click(screen.getByRole('button', { name: 'Save Vision' }))
  await screen.findByText('1 of 21 prompts saved')

  const guide = screen.getByText('Use ChatGPT', { selector: 'summary' }).parentElement as HTMLDetailsElement
  guide.open = true
  const json = within(guide).getByRole('textbox', { name: 'Codex map from ChatGPT' })
  fireEvent.change(json, { target: { value: JSON.stringify({
    format: 'visions-codex-v1', answers: {
      vision: { lifestyle: 'Read for ten minutes before bed.' },
      interest: { business: 'Practice a craft each morning.', relationships: 'Share an evening meal.' },
    },
  }) } })
  fireEvent.click(within(guide).getByRole('button', { name: 'Review map' }))
  assert.ok(within(guide).getByRole('heading', { name: 'Review 3 answers' }))
  assert.ok(within(guide).getByText('Keep a quiet evening.'))
  const save = within(guide).getByRole<HTMLButtonElement>('button', { name: 'Save map to Core' })
  assert.equal(save.disabled, true)
  assert.equal((answer as HTMLTextAreaElement).value, 'Keep a quiet evening.')
  fireEvent.click(within(guide).getByRole('checkbox', { name: /replace 1 saved answer/i }))
  fireEvent.click(save)
  await within(guide).findByText('Map saved. Your workspace documents have been updated.')
  assert.equal((answer as HTMLTextAreaElement).value, 'Read for ten minutes before bed.')
  fireEvent.click(screen.getByRole('link', { name: 'Business' }))
  assert.ok(within(screen.getByRole('region', { name: 'Business Plan' })).getByText('Practice a craft each morning.'))
  fireEvent.click(screen.getByRole('link', { name: 'Relationships' }))
  assert.ok(within(screen.getByRole('region', { name: 'Relationship Management' })).getByText('Share an evening meal.'))
})
