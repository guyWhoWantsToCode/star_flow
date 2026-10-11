import { memo, useEffect, useRef, useState, type CSSProperties } from 'react'
import AgentSpaceArt from './AgentSpaceArt'
import { spaceThemes } from './spaceThemes'
import { Brand, OrbitLogo } from '../components/landing/Brand'
import { agentStyle } from './agents'
import { readCatalog, splitAgentShares, type AgentId, type Connection } from '../services/starflowApi'
function AgentSelection({ status, error, initializing, onPower, onRetry, onReset }: {
  status: Connection; error: string; initializing: boolean; onPower: (ids: AgentId[]) => void; onRetry: () => void; onReset: () => void
}) {
  const [catalog, setCatalog] = useState<{id: string; name: string}[]>([])
  const gridRef = useRef<HTMLDivElement>(null)
  const [catalogError, setCatalogError] = useState('')
  const [loading, setLoading] = useState(true)
  const [attempt, setAttempt] = useState(0)
  const [selected, setSelected] = useState<AgentId[]>([])
  useEffect(() => {
    const abort = new AbortController()
    async function load() {
      setLoading(true); setCatalogError('')
      try {
        const result = await readCatalog(abort.signal)
        if (!abort.signal.aborted) {
          setCatalog(result)
          setSelected(current => ['chatbot', ...current.filter(id => id !== 'chatbot' && result.some(agent => agent.id === id))].filter(id => result.some(agent => agent.id === id)).slice(0, 4))
        }
      } catch (failure) {
        if (!abort.signal.aborted) setCatalogError(failure instanceof Error ? failure.message : 'Cannot load the agent catalog')
      } finally { if (!abort.signal.aborted) setLoading(false) }
    }
    void load()
    return () => abort.abort()
  }, [attempt])
  useEffect(() => {
    const grid = gridRef.current!
    const cards = grid.querySelectorAll<HTMLElement>('.selection-card')
    // Start visible cards immediately instead of waiting for the first observer callback.
    cards.forEach(card => {
      const bounds = card.getBoundingClientRect()
      card.dataset.artVisible = String(bounds.bottom > -30 && bounds.top < innerHeight + 30)
    })
    const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
      for (const entry of entries) (entry.target as HTMLElement).dataset.artVisible = String(entry.isIntersecting)
    }, { rootMargin: '30px' }) : null
    if (observer) cards.forEach(card => observer.observe(card))
    else cards.forEach(card => card.removeAttribute('data-art-visible'))
    const visibility = () => { grid.dataset.pageHidden = String(document.hidden) }
    visibility()
    document.addEventListener('visibilitychange', visibility)
    return () => { observer?.disconnect(); document.removeEventListener('visibilitychange', visibility) }
  }, [catalog])
  const ready = !loading && !catalogError && selected.length >= 3 && selected.length <= 4 && selected.includes('chatbot')
  const shares = ready ? splitAgentShares(selected) : []
  return <div className="mission-shell setup-screen"><header className="mission-header"><Brand/><span className="system-status">{initializing ? status === 'live' ? 'STATION INITIALIZING' : 'STATION CONNECTING' : 'SYSTEM STANDBY'}</span></header><main className={`setup-main ${initializing ? 'is-initializing' : ''}`}>
    <p className="mission-kicker">Station configuration</p><h1 tabIndex={-1}>Your agents. One fair system.</h1><p className="setup-description">Choose 3–4 services from the live catalog, including Customer chatbot.<br/>We’ll divide 10 requests per second as evenly as possible.</p>
    <div className="catalog-toolbar"><span>{loading ? 'Loading agent catalog…' : `${catalog.length} services available`}</span><span aria-live="polite">{selected.length} / 4 selected · minimum 3</span></div>
    {catalogError && <div className="connection-error" role="alert"><p>{catalogError}</p><button className="mission-button" onClick={() => setAttempt(value => value + 1)}>Reload catalog</button></div>}
    {!loading && !catalogError && !catalog.some(agent => agent.id === 'chatbot') && <p className="inline-error" role="alert">Chatbot is unavailable in the catalog. Refresh the catalog before starting.</p>}
    <div ref={gridRef} className="selection-grid catalog-grid" aria-label="Available agents" aria-busy={loading}>{catalog.map((agent, index) => {
      const chosen = selected.includes(agent.id)
      const required = agent.id === 'chatbot'
      return <button key={agent.id} className={`selection-card ${chosen ? 'is-selected' : ''}`} style={{ ...agentStyle(agent.id), '--agent-color': spaceThemes[agent.id]?.color ?? '#80c4e9', '--scene-cycle': `${10 + index * .3}s`, animationDelay: `${Math.min(index,3) * 180}ms` } as CSSProperties} aria-pressed={chosen} disabled={initializing || required || (!chosen && selected.length >= 4)} onClick={() => setSelected(current => current.includes(agent.id) ? current.filter(id => id !== agent.id) : current.length < 4 ? [...current, agent.id] : current)}><span className="selection-card-top"><span className="agent-icon"><AgentSpaceArt id={agent.id} icon/></span><span className="selection-check">{chosen ? '✓' : '+'}</span></span><strong>{agent.name}</strong><span className="catalog-agent-description">{spaceThemes[agent.id]?.description ?? 'Connected to your shared scheduling layer.'}</span><AgentSpaceArt id={agent.id}/><small>{required ? 'Required · included' : chosen ? 'Selected for mission' : selected.length >= 4 ? 'Selection limit reached' : 'Select service'}</small></button>
    })}</div>
    <div className="catalog-start"><div><strong>{initializing ? 'Configuring your station…' : ready ? 'Ready for your mission' : 'Choose at least two more services'}</strong><p>{ready ? selected.map((id,index) => `${catalog.find(agent => agent.id === id)?.name ?? id}: ${shares[index]}/s`).join(' · ') : 'Chatbot stays selected. Add up to three other services.'}</p></div><button className="mission-button primary" disabled={!ready || initializing} onClick={() => { if (ready && !initializing) onPower([...selected]) }}>{initializing ? 'Connecting…' : 'Get Started'}<span aria-hidden="true">↗</span></button></div>
    {initializing && <div className="activation-symbol"><OrbitLogo/><span>Scheduler connection</span><button className="mission-text-button" onClick={onReset}>Cancel connection</button></div>}
    {initializing && (error || status === 'contract error') && <div className="connection-error" role="alert"><p>{error || 'Mission Control is unavailable.'}</p><div><button className="mission-button" onClick={onRetry}>Retry connection</button><button className="mission-button quiet" onClick={onReset}>Return to setup</button></div></div>}
    <p className="setup-note">Shares protect request capacity. Gemini generates each selected service’s response.</p><a href="/" className="text-link">← Return to overview</a>
  </main></div>
}

export default memo(AgentSelection)
