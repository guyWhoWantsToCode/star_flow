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
    const url = new URL(captured)
    assert.equal(url.searchParams.get('ids'), 'chatbot,invoice')
    assert.equal(url.searchParams.get('shares'), '5,3')
  } finally { globalThis.fetch = originalFetch }
})

test('configuration requires chatbot and 3–4 distinct agents', async () => {
  const { splitAgentShares } = await import('../src/services/starflowApi.ts')
  assert.deepEqual(splitAgentShares(['chatbot','invoice','fraud']), [4,3,3])
  assert.deepEqual(splitAgentShares(['chatbot','invoice','fraud','review']), [3,3,2,2])
  for (const ids of [['invoice','fraud','review'],['chatbot','invoice'],['chatbot','invoice','invoice'],['chatbot','invoice','fraud','review','notes']]) assert.throws(() => splitAgentShares(ids))
})
test('reads all catalog entries and submits selected agents with even shares', async () => {
  const { readCatalog, configureAgents } = await import('../src/services/starflowApi.ts')
  const originalFetch = globalThis.fetch
  globalThis.fetch = async (url, options) => {
    const parsed = new URL(String(url))
    if (parsed.pathname === '/catalog') return Response.json({ chatbot: 'Customer chatbot', invoice: 'Invoice parser', fraud: 'Fraud screener', review: 'Code reviewer' })
    assert.equal(parsed.pathname, '/agents')
    assert.equal(options?.method, 'POST')
    assert.equal(parsed.searchParams.get('ids'), 'chatbot,invoice,fraud,review')
    assert.equal(parsed.searchParams.get('shares'), '3,3,2,2')
    return Response.json({ ok: true })
  }
  try {
    const catalog = await readCatalog()
    assert.equal(catalog.length, 4)
    assert.equal(catalog[1].name, 'Invoice parser')
    await configureAgents(catalog.map(agent => agent.id))
  } finally { globalThis.fetch = originalFetch }
})
test('configuration surfaces backend rejections', async () => {
  const { configureAgents } = await import('../src/services/starflowApi.ts')
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => Response.json({ ok: false, error: 'configuration rejected' })
  try { await assert.rejects(configureAgents(['chatbot','invoice','fraud']), /configuration rejected/) }
  finally { globalThis.fetch = originalFetch }
})

test('HTTP and WebSocket endpoints are always the secure Railway deployment', async () => {
  const { apiBase, socketUrl } = await import('../src/services/starflowApi.ts')
  assert.equal(apiBase, 'https://starflow-production-7ca6.up.railway.app')
  assert.equal(socketUrl(), 'wss://starflow-production-7ca6.up.railway.app/ws')
})
