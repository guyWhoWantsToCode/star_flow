import { AgentIcon } from './AgentIcon'
import { useEffect, useRef, useState } from 'react'
import { agents, agentStyle } from './agents'
import { waiting, type AgentId, type AgentSnapshot } from '../services/starflowApi'
export default function AgentModule({ id, data, live, rogue }: { id: AgentId; data?: AgentSnapshot; live: boolean; rogue: boolean | null }) {
  const agent = agents.find(item => item.id === id)!
  const previous = useRef(data?.rejected)
  const [rejection, setRejection] = useState(false)
  const rejected = data?.rejected
  useEffect(() => {
    const fresh = live && rejected !== undefined && previous.current !== undefined && rejected > previous.current
    previous.current = rejected
    if (!fresh) return
    setRejection(true)
    const timer = setTimeout(() => setRejection(false), 1400)
    return () => clearTimeout(timer)
  }, [rejected, live])
  const queue = data ? waiting(data) : null
  const values = [data?.rate.tried, data?.rate.released, queue, data?.rate.rejected]
  return <article className={`agent-module agent-${id}`} style={agentStyle(id)} aria-label={`${agent.name} statistics`}><div className="agent-module-heading"><span className="agent-icon"><AgentIcon id={id}/></span><div><h2>{agent.name}</h2><p>Share <strong>{data?.share ?? '—'}</strong> <span>/ second</span></p></div><span className={`agent-status ${id === 'tagger' && rogue ? 'rogue' : ''}`}>{!live ? data ? 'Stale' : 'Unavailable' : id === 'tagger' && rogue ? 'Rogue on' : 'Open'}</span></div><dl className="agent-statistics">{['Arrived /s', 'Released /s', 'Waiting', 'Rejected /s'].map((label,index) => <div key={label} className={index === 2 && queue ? 'has-waiting' : index === 3 && values[3] ? 'has-rejections' : ''}><dt>{label}</dt><dd>{values[index] ?? '—'}</dd></div>)}</dl><div className="agent-queue" aria-label={queue === null ? 'Waiting for queue data' : `${queue} requests waiting`}><span>Queue</span><div aria-hidden="true">{Array.from({ length: Math.min(queue || 0, 8) }, (_,index) => <i key={index}/>)}</div><span className="rejection-notice" role="status">{rejection && live ? '× Request rejected' : ''}</span></div></article>
}
