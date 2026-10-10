import test from 'node:test'
import assert from 'node:assert/strict'
import { parseSnapshot, waiting, setShares } from '../src/services/starflowApi.ts'
// Contract fixtures are used only by tests; the app never supplies simulated snapshots.
const snapshot = () => ({ t: 8, limit: 10, agents: [
  { id: 'chatbot', share: 5, tried: 3, released: 3, rejected: 0, rate: { tried: 3, released: 3, rejected: 0 } },
  { id: 'summarizer', share: 3, tried: 2, released: 2, rejected: 0, rate: { tried: 2, released: 2, rejected: 0 } },
  { id: 'tagger', share: 2, tried: 30, released: 5, rejected: 10, rate: { tried: 20, released: 5, rejected: 10 } },
], events: [{ t: 7, level: 'info', text: 'Backend event' }] })
test('uses rates independently from the current waiting queue', () => {
  const parsed = parseSnapshot(snapshot())
  assert.equal(waiting(parsed.agents[2]), 15)
  assert.equal(parsed.agents[2].rate.released, 5)
  assert.equal(parsed.events[0].text, 'Backend event')
})
test('accepts dynamic IDs, display names, additional fields and variable allocations', () => {
  const dynamic = { t: 268, limit: 10, agents: [{ id: 'invoice', name: 'Invoice processor', share: 12, tried: 425, released: 425, rejected: 0, rate: { tried: 5, released: 5, rejected: 0 }, extra: true }], events: [] }
  const parsed = parseSnapshot(dynamic)
  assert.equal(parsed.agents[0].name, 'Invoice processor')
  assert.equal(parsed.agents[0].rate.released, 5)
  assert.equal(parsed.agents[0].released, 425)
  assert.equal(parseSnapshot({ ...dynamic, agents: [] }).agents.length, 0)
})
test('rejects duplicate IDs and clamps temporarily inconsistent waiting totals', () => {
  const inconsistent = snapshot(); inconsistent.agents[0].released = 4
  assert.equal(waiting(parseSnapshot(inconsistent).agents[0]), 0)
  const duplicate = snapshot(); duplicate.agents[2].id = 'chatbot'
  assert.throws(() => parseSnapshot(duplicate))
})
test('rejects missing contracts and negative or fractional counters', () => {
  assert.throws(() => parseSnapshot({}))
  for (const value of [-1, .5, NaN, Infinity]) {
    const invalid = snapshot(); invalid.agents[0].tried = value
    assert.throws(() => parseSnapshot(invalid))
  }
})
test('invalid shares fail before any network mutation', async () => {
  await assert.rejects(setShares({ chatbot: -1, summarizer: 3, tagger: 2 }, 10))
  await assert.rejects(setShares({ chatbot: 8, summarizer: 3, tagger: 2 }, 10))
  await assert.rejects(setShares({ chatbot: 2.5, summarizer: 3, tagger: 2 }, 10))
})

test('sends dynamic shares in matching comma-separated ID and value order', async () => {
  const originalFetch = globalThis.fetch
  let captured = ''
  globalThis.fetch = async (url, options) => {
    captured = String(url)
    assert.equal(options?.method, 'POST')
    return new Response(JSON.stringify({ ok: true }), { status: 200 })
  }
  try {
    await setShares({ chatbot: 5, invoice: 3 }, 10)
    const url = new URL(captured, 'http://localhost')
    assert.equal(url.searchParams.get('ids'), 'chatbot,invoice')
    assert.equal(url.searchParams.get('shares'), '5,3')
  } finally { globalThis.fetch = originalFetch }
})
