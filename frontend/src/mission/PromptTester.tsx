import { useEffect, useRef, useState } from 'react'
import { agents } from './agents'
import { ask, type AgentId } from '../services/starflowApi'
export default function PromptTester({ live, availableAgents = agents }: { live: boolean; availableAgents?: readonly { id: string; name: string }[] }) {
  const [agent, setAgent] = useState<AgentId>('chatbot')
  const [text, setText] = useState('')
  const [answer, setAnswer] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [elapsed, setElapsed] = useState<number | null>(null)
  const lock = useRef(false)
  const mounted = useRef(true)
  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])
  const selectedAgent = availableAgents.some(item => item.id === agent) ? agent : availableAgents[0]?.id ?? ''
  async function send(event: React.FormEvent) {
    event.preventDefault()
    if (lock.current || !live || !selectedAgent || !text.trim()) return
    lock.current = true
    setPending(true); setAnswer(''); setError(''); setElapsed(null)
    const start = performance.now()
    try { const result = await ask(selectedAgent, text.trim()); if (mounted.current) { setAnswer(result); setElapsed(Math.round(performance.now() - start)) } }
    catch (failure) { if (mounted.current) setError(failure instanceof Error ? failure.message : 'Prompt request failed') }
    finally { lock.current = false; if (mounted.current) setPending(false) }
  }
  return <section className="mission-panel prompt-panel"><div className="panel-heading"><div><p className="mission-kicker">Direct to Gemini</p><h2>Try a prompt</h2></div><label className="agent-selector"><span className="sr-only">Prompt agent</span><select value={selectedAgent} disabled={pending} onChange={event => setAgent(event.target.value as AgentId)}>{availableAgents.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></div><form onSubmit={send}><label htmlFor="mission-prompt" className="sr-only">Your prompt</label><div className="prompt-entry"><textarea id="mission-prompt" value={text} onChange={event => setText(event.target.value)} placeholder="Ask a question, share text, or classify content…" maxLength={6000} disabled={pending} rows={2}/><button className="mission-button primary" disabled={!live || !selectedAgent || pending || !text.trim()}>{pending ? 'Sending…' : 'Send'}<span aria-hidden="true">↗</span></button></div></form><div className={`prompt-response ${error ? 'response-error' : ''}`} aria-live="polite" aria-busy={pending}><p>{error || answer || (pending ? 'Submitted to the scheduler. Awaiting the backend response…' : 'Your answer appears here.')}</p><div><span>{elapsed === null ? 'Response time —' : `Round trip ${(elapsed / 1000).toFixed(2)}s`}</span><span>Real Gemini request</span></div></div><p className="panel-footnote">Release permits API access; it does not indicate Gemini completion.</p></section>
}
