import { memo, useEffect, useRef, useState } from 'react'
import { agents, agentColor } from './agents'
import { type AgentId, type Snapshot } from '../services/starflowApi'
const paths = [
  'M285 130 C380 130 370 205 445 205',
  'M915 130 C820 130 830 205 755 205',
  'M285 340 C360 340 373 283 445 283',
  'M915 340 C840 340 827 283 755 283',
]

type Particle = { key: string; id: AgentId; expires: number; delay: number; path: string }
const RequestParticle = memo(function RequestParticle({ particle }: { particle: Particle }) {
  const circle = useRef<SVGCircleElement>(null)
  const motion = useRef<SVGAnimateMotionElement>(null)
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (circle.current) circle.current.style.opacity = '1'
      motion.current?.beginElement()
    }, particle.delay)
    return () => clearTimeout(timer)
  }, [particle.delay])
  return <circle ref={circle} r="3" style={{ opacity: 0 }} fill={agentColor(particle.id)}><animateMotion ref={motion} dur="1.5s" begin="indefinite" fill="freeze" path={particle.path}/></circle>
})
export default function RequestPaths({ snapshot, live }: { snapshot: Snapshot | null; live: boolean }) {
  const previous = useRef<Snapshot | null>(null)
  const [particles, setParticles] = useState<Particle[]>([])
  const serial = useRef(0)
  useEffect(() => {
    const before = previous.current
    previous.current = snapshot
    if (!live || !snapshot || !before || snapshot.t < before.t) { setParticles(current => current.length ? [] : current); return }
    if (document.hidden || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const incoming: Particle[] = []
    for (const agent of snapshot.agents) {
      const last = before.agents.find(item => item.id === agent.id)
      const indexInSnapshot = snapshot.agents.findIndex(item => item.id === agent.id)
      const path = paths[indexInSnapshot]
      if (!last || !path) continue
      const delta = Math.max(0, agent.released - last.released)
      for (let index = 0; index < Math.min(delta, 6); index++) incoming.push({ key: `${agent.id}-${serial.current++}`, id: agent.id, expires: Date.now() + 1800 + index * 110, delay: index * 110, path })
    }
    // Synchronize with the external scheduler / navigation state.
    // eslint-disable-next-line react/set-state-in-effect
    setParticles(current => {
      const retained = current.filter(item => item.expires > Date.now())
      if (!incoming.length && retained.length === current.length) return current
      return [...retained, ...incoming].slice(-36)
    })
  }, [snapshot, live])
  useEffect(() => { const interval = setInterval(() => setParticles(current => current.some(item => item.expires <= Date.now()) ? current.filter(item => item.expires > Date.now()) : current), 400); return () => clearInterval(interval) }, [])
  return <svg className="request-paths" viewBox="0 0 1200 460" preserveAspectRatio="none" aria-hidden="true">{(snapshot?.agents ?? agents).slice(0,4).map((agent,index) => <g key={agent.id}><path d={paths[index]} stroke="#152a40" strokeWidth="8" fill="none"/><path d={paths[index]} stroke={agentColor(agent.id)} strokeOpacity={live ? '.55' : '.18'} strokeWidth="1.8" fill="none"/></g>)}{particles.map(particle => <RequestParticle key={particle.key} particle={particle}/>)}</svg>
}
