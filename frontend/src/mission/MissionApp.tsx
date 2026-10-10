import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react'
import LandingPage from '../components/landing/LandingPage'
import GalaxyBackground from '../components/landing/GalaxyBackground'
import LunarOrbits from '../components/landing/LunarOrbits'
import { useStarFlow } from '../hooks/useStarFlow'
import { MissionNavigation } from './navigation'
import SpaceTravel from './SpaceTravel'
import AgentSelection from './AgentSelection'
import MissionControl from './MissionControl'
import './mission.css'
const route = () => location.pathname === '/dashboard' ? 'dashboard' : location.pathname === '/setup' ? 'setup' : 'landing'
type Phase = 'landing' | 'launching' | 'setup' | 'initializing' | 'dashboard'
export default function MissionApp() {
  const [phase, setPhase] = useState<Phase>(route)
  const [active, setActive] = useState(() => route() === 'dashboard')
  const [setupKey, setSetupKey] = useState(0)
  const [activationReady, setActivationReady] = useState(false)
  const launchLock = useRef(false)
  const powerLock = useRef(false)
  const activationTimer = useRef(0)
  const connection = useStarFlow(active)
  const navigate = useCallback((path: string, next: Phase) => {
    history.pushState(null, '', path)
    setPhase(next)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])
  useEffect(() => {
    const handleBack = () => {
      clearTimeout(activationTimer.current)
      launchLock.current = false; powerLock.current = false
      setSetupKey(value => value + 1)
      const next = route(); setPhase(next); setActive(next === 'dashboard'); setActivationReady(false)
    }
    window.addEventListener('popstate', handleBack)
    return () => { window.removeEventListener('popstate', handleBack); clearTimeout(activationTimer.current) }
  }, [])
  useEffect(() => {
    // Synchronize with the external scheduler / navigation state.
    // eslint-disable-next-line react/set-state-in-effect
    if (phase === 'initializing' && activationReady && connection.status === 'live') navigate('/dashboard','dashboard')
  }, [phase, activationReady, connection.status, navigate])
  useEffect(() => {
    if (phase === 'launching') return
    const frame = requestAnimationFrame(() => document.querySelector<HTMLElement>('main h1')?.focus({ preventScroll: true }))
    return () => cancelAnimationFrame(frame)
  }, [phase])
  const launch = useCallback((event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    if (launchLock.current) return
    launchLock.current = true
    setPhase('launching')
  }, [])
  const arrive = useCallback(() => { launchLock.current = false; navigate('/setup','setup') }, [navigate])
  function powerOn() {
    if (powerLock.current) return
    powerLock.current = true
    setPhase('initializing'); setActive(true); setActivationReady(false)
    activationTimer.current = window.setTimeout(() => setActivationReady(true), matchMedia('(prefers-reduced-motion: reduce)').matches ? 100 : 1500)
  }
  function resetSetup() {
    clearTimeout(activationTimer.current)
    powerLock.current = false; setActive(false); setActivationReady(false)
    setSetupKey(value => value + 1)
    navigate('/setup','setup')
  }
  return <MissionNavigation.Provider value={launch}><GalaxyBackground/><LunarOrbits mission={phase !== 'landing' && phase !== 'launching'}/>{phase === 'landing' || phase === 'launching' ? <div className={phase === 'launching' ? 'landing-launching' : ''}><LandingPage/></div> : phase === 'setup' || phase === 'initializing' ? <AgentSelection key={setupKey} status={connection.status} error={connection.error} initializing={phase === 'initializing'} onPower={powerOn} onRetry={connection.retry} onReset={resetSetup}/> : <MissionControl connection={connection} onSetup={resetSetup}/>} {phase === 'launching' && <SpaceTravel onComplete={arrive}/>}</MissionNavigation.Provider>
}
