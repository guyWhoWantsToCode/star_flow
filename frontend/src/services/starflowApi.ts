export const agentIds = ['chatbot', 'summarizer', 'tagger'] as const
export type AgentId = typeof agentIds[number]
export type Counts = { tried: number; released: number; rejected: number }
export type AgentSnapshot = Counts & { id: AgentId; share: number; rate: Counts }
export type Snapshot = { t: number; limit: number; agents: AgentSnapshot[]; events: { t: number; level: string; text: string }[] }
export type Connection = 'connecting' | 'live' | 'data delayed' | 'reconnecting' | 'offline' | 'contract error'
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null
const count = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
const counts = (value: unknown): value is Counts & Record<string, unknown> => record(value) && count(value.tried) && count(value.released) && count(value.rejected)

export function parseSnapshot(value: unknown): Snapshot {
  if (!record(value) || !count(value.t) || !count(value.limit) || value.limit === 0 || !Array.isArray(value.agents) || !Array.isArray(value.events)) throw new Error('Invalid scheduler snapshot')
  const agents: AgentSnapshot[] = value.agents.map((agent: unknown) => {
    if (!record(agent) || !agentIds.includes(agent.id as AgentId) || !counts(agent) || !count(agent.share) || !counts(agent.rate) || agent.tried < agent.released + agent.rejected) throw new Error('Invalid agent counters')
    return { id: agent.id as AgentId, share: agent.share, tried: agent.tried, released: agent.released, rejected: agent.rejected, rate: agent.rate }
  })
  if (agents.length !== 3 || new Set(agents.map(agent => agent.id)).size !== 3 || agents.reduce((sum, agent) => sum + agent.share, 0) > value.limit) throw new Error('Unexpected agent allocation')
  const events = value.events.map((event: unknown) => {
    if (!record(event) || !count(event.t) || typeof event.text !== 'string' || typeof event.level !== 'string') throw new Error('Invalid scheduler event')
    return { t: event.t, text: event.text, level: event.level }
  })
  return { t: value.t, limit: value.limit, agents, events }
}

export function waiting(agent: AgentSnapshot) { return agent.tried - agent.released - agent.rejected }
const configuredBase = (import.meta as ImportMeta & { env: Record<string, string | undefined> }).env?.VITE_STARFLOW_API_URL
export const apiBase = (configuredBase || '/api').replace(/\/$/, '')
export function socketUrl() {
  const url = new URL(`${apiBase}/ws`, location.origin)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  return url.toString()
}
async function request(path: string, method = 'GET', signal?: AbortSignal): Promise<Record<string, unknown>> {
  const response = await fetch(`${apiBase}${path}`, { method, signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(45000)]) : AbortSignal.timeout(45000) })
  if (!response.ok) throw new Error(`Backend returned HTTP ${response.status}`)
  const result: unknown = await response.json()
  if (!record(result)) throw new Error('Backend returned an invalid response')
  if (result.ok === false) throw new Error(typeof result.error === 'string' ? result.error : 'Request rejected')
  return result
}
export async function readRogue(signal?: AbortSignal) {
  const result = await request('/rogue', 'GET', signal)
  if (typeof result.rogue !== 'boolean') throw new Error('Invalid rogue state')
  return result.rogue
}
export async function setRogue(on: boolean) {
  const result = await request(`/rogue?on=${on}`, 'POST')
  if (result.rogue !== on) throw new Error('Rogue change was not confirmed')
  return on
}
export async function setShares(shares: Record<AgentId, number>, limit: number) {
  if (agentIds.some(id => !count(shares[id])) || Object.values(shares).reduce((a,b) => a+b, 0) > limit) throw new Error('Shares must be nonnegative integers within capacity')
  const result = await request(`/shares?${new URLSearchParams(Object.entries(shares).map(([key,value]) => [key,String(value)]))}`, 'POST')
  if (result.ok !== true) throw new Error('Share change was not confirmed')
}
export async function ask(agent: AgentId, text: string) {
  const result = await request(`/ask?${new URLSearchParams({ agent, text, real: 'true' })}`)
  if (result.ok !== true || typeof result.answer !== 'string') throw new Error('Backend returned no Gemini answer')
  if (/^\[(error:|rate limited or slow)/.test(result.answer)) throw new Error(result.answer)
  return result.answer
}
