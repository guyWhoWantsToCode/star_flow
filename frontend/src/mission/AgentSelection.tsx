import { AgentIcon } from './AgentIcon'
import { useState } from 'react'
import { Brand, OrbitLogo } from '../components/landing/Brand'
import { agents, agentStyle } from './agents'
import type { AgentId, Connection } from '../services/starflowApi'
export default function AgentSelection({ status, error, initializing, onPower, onRetry, onReset }: {
  status: Connection; error: string; initializing: boolean; onPower: () => void; onRetry: () => void; onReset: () => void
}) {
  const [selected, setSelected] = useState<AgentId[]>([])
  const ready = selected.length === 3
  return <div className="mission-shell setup-screen"><header className="mission-header"><Brand/><span className="system-status">{initializing ? status === 'live' ? 'STATION INITIALIZING' : status.toUpperCase() : 'SYSTEM STANDBY'}</span></header><main className={`setup-main ${initializing ? 'is-initializing' : ''}`}>
    <p className="mission-kicker">Station configuration</p><h1 tabIndex={-1}>Every service. One fair system.</h1><p className="setup-description">Select the three AI services sharing your API capacity.<br/>Then bring Mission Control online.</p>
    <div className="selection-grid">{agents.map((agent, index) => <button key={agent.id} className={`selection-card ${selected.includes(agent.id) ? 'is-selected' : ''}`} style={{ ...agentStyle(agent.id), animationDelay: `${index * 180}ms` }} aria-pressed={selected.includes(agent.id)} disabled={initializing} onClick={() => setSelected(current => current.includes(agent.id) ? current.filter(id => id !== agent.id) : [...current, agent.id])}><span className="selection-card-top"><span className="agent-icon"><AgentIcon id={agent.id}/></span><span className="selection-check">{selected.includes(agent.id) ? '✓' : '+'}</span></span><strong>{agent.name}</strong><span>{agent.description}</span><small>{selected.includes(agent.id) ? 'Selected for mission' : 'Select service'}</small></button>)}</div>
    <div className="power-area"><p aria-live="polite">{selected.length} <span>/ 3 services selected</span></p><button className="power-button" disabled={!ready || initializing} onClick={() => { if (ready && !initializing) onPower() }} aria-label="Power on Mission Control"><svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M16 4v12m-7-9a12 12 0 1 0 14 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg></button><strong>{initializing ? 'Connecting to Mission Control' : ready ? 'Power on' : 'Select all three services'}</strong><span>{initializing ? 'Activating the existing backend session' : ready ? 'All systems ready' : 'Each service needs a protected share'}</span></div>
    {initializing && <div className="activation-symbol"><OrbitLogo/><span>Scheduler connection</span><button className="mission-text-button" onClick={onReset}>Cancel connection</button></div>}
    {initializing && (error || status === 'offline' || status === 'contract error') && <div className="connection-error" role="alert"><p>{error || 'Mission Control is unavailable.'}</p><div><button className="mission-button" onClick={onRetry}>Retry connection</button><button className="mission-button quiet" onClick={onReset}>Return to setup</button></div></div>}
    <p className="setup-note">Selection prepares this interface. The backend runs all three services independently.</p><a href="/" className="text-link">← Return to overview</a>
  </main></div>
}
