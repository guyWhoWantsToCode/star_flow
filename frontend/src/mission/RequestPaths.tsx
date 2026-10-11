import { memo, useEffect, useLayoutEffect, useRef, useState, useId, type RefObject } from 'react'
import { agents } from './agents'
import { type AgentId, type Snapshot } from '../services/starflowApi'
import { connectionColors, connectorPath, portCenter, stationDrift, type Point } from './connectionGeometry'

type Route = { id: string; path: string; color: string; start: Point; end: Point; vertical: boolean }
type Geometry = { width: number; height: number; routes: Route[] }
type Particle = { key: string; id: AgentId; expires: number; delay: number }
const RequestParticle = memo(function RequestParticle({ particle, route, pathId }: { particle: Particle; route: Route; pathId: string }) {
  const circle = useRef<SVGGElement>(null)
  const motion = useRef<SVGAnimateMotionElement>(null)
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (circle.current) circle.current.style.opacity = '1'
      motion.current?.beginElement()
    }, particle.delay)
    return () => clearTimeout(timer)
  }, [particle.delay])
  return <g ref={circle} className="released-packet" style={{ opacity: 0, color: route.color }}>
    <circle r="8" fill="currentColor" opacity=".2"/><circle r="4.8" fill="currentColor"/><circle r="2.2" fill="#efffff"/>
    <animateMotion ref={motion} dur="1.5s" begin="indefinite" fill="freeze"><mpath href={`#${pathId}`}/></animateMotion>
  </g>
})
export default function RequestPaths({ snapshot, live, consoleRef }: { snapshot: Snapshot | null; live: boolean; consoleRef: RefObject<HTMLElement | null> }) {
  const beforeSnapshot = useRef<Snapshot | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const driftClock = useRef(0)
  const [particles, setParticles] = useState<Particle[]>([])
  const [geometry, setGeometry] = useState<Geometry>({ width: 1, height: 1, routes: [] })
  const serial = useRef(0)
  const uid = useId().replace(/:/g,'')
  const ids = (snapshot?.agents ?? agents).slice(0,4).map(agent => agent.id).join(',')
  useLayoutEffect(() => {
    const console = consoleRef.current
    if (!console) return
    let frame = 0, disposed = false
    const measure = () => {
      frame = 0
      if (disposed) return
      const origin = console.getBoundingClientRect()
      const modules = Array.from(console.querySelectorAll<HTMLElement>('[data-agent-module]'))
      const stage = console.querySelector<HTMLElement>('.station-stage')
      const offset = { x: Number(stage?.dataset.driftX ?? 0), y: Number(stage?.dataset.driftY ?? 0) }
      const vertical = matchMedia('(max-width:760px)').matches
      const routes = ids.split(',').flatMap((id,index) => {
        const source = modules.find(module => module.dataset.agentModule === id)?.querySelector('[data-agent-port]')
        const destination = console.querySelector(`[data-station-port="${index}"]`)
        if (!source || !destination) return []
        const start = portCenter(source.getBoundingClientRect(), origin)
        const measuredEnd = portCenter(destination.getBoundingClientRect(), origin)
        const end = { x: measuredEnd.x - offset.x, y: measuredEnd.y - offset.y }
        return [{ id, color: connectionColors[index], start, end, vertical, path: connectorPath(start,end,vertical) }]
      })
      setGeometry(current => current.width === origin.width && current.height === origin.height && JSON.stringify(current.routes) === JSON.stringify(routes) ? current : { width: origin.width, height: origin.height, routes })
    }
    const schedule = () => { if (!disposed && !frame) frame = requestAnimationFrame(measure) }
    const observer = new ResizeObserver(schedule)
    observer.observe(console)
    console.querySelectorAll('.agent-module-heading, .station-stage, [data-agent-port], [data-station-port]').forEach(element => observer.observe(element))
    const rendererObserver = new MutationObserver(schedule)
    const stage = console.querySelector('.station-stage')
    if (stage) rendererObserver.observe(stage, { attributes: true, attributeFilter: ['data-renderer'] })
    window.addEventListener('resize', schedule)
    void document.fonts.ready.then(schedule)
    // Geometry synchronizes the rendered docking ports with their SVG connections.
    measure()
    return () => { disposed = true; cancelAnimationFrame(frame); observer.disconnect(); rendererObserver.disconnect(); window.removeEventListener('resize',schedule) }
  }, [ids, consoleRef])
  useLayoutEffect(() => {
    const stage = consoleRef.current?.querySelector<HTMLElement>('.station-stage')
    const svg = svgRef.current
    if (!stage || !svg || !geometry.routes.length) return
    const pathElements = Array.from(svg.querySelectorAll<SVGPathElement>('[data-route-id]'))
    const routes = geometry.routes.map(route => ({ route, path: pathElements.find(path => path.dataset.routeId === route.id) }))
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0, lastTime: number | null = null, visible = true
    const draw = (offset: Point) => {
      stage.style.transform = `translate3d(${offset.x}px, ${offset.y}px, 0)`
      stage.dataset.driftX = String(offset.x)
      stage.dataset.driftY = String(offset.y)
      for (const { route, path } of routes) {
        path?.setAttribute('d', connectorPath(route.start, { x: route.end.x + offset.x, y: route.end.y + offset.y }, route.vertical))
      }
    }
    const tick = (time: number) => {
      if (lastTime !== null) driftClock.current += Math.min(time - lastTime, 50)
      lastTime = time
      // One clock moves the artwork and its SVG endpoints; no per-frame React renders or layout reads.
      draw(stationDrift(driftClock.current))
      frame = requestAnimationFrame(tick)
    }
    const update = () => {
      cancelAnimationFrame(frame)
      lastTime = null
      const active = live && visible && !document.hidden && !reducedMotion.matches
      stage.style.willChange = active ? 'transform' : ''
      if (reducedMotion.matches) { driftClock.current = 0; draw({ x: 0, y: 0 }) }
      else draw(stationDrift(driftClock.current))
      if (active) frame = requestAnimationFrame(tick)
    }
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update() })
    observer.observe(stage)
    document.addEventListener('visibilitychange', update)
    reducedMotion.addEventListener('change', update)
    update()
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      document.removeEventListener('visibilitychange', update)
      reducedMotion.removeEventListener('change', update)
      stage.style.willChange = ''
    }
  }, [geometry, live, consoleRef])
  useEffect(() => {
    const before = beforeSnapshot.current
    beforeSnapshot.current = snapshot
    if (!live || !snapshot || !before || snapshot.t < before.t || snapshot.agents.map(agent => agent.id).join(',') !== before.agents.map(agent => agent.id).join(',')) {
      setParticles(current => current.length ? [] : current); return
    }
    if (document.hidden || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const incoming: Particle[] = []
    for (const agent of snapshot.agents.slice(0,4)) {
      const last = before.agents.find(item => item.id === agent.id)
      if (!last) continue
      const delta = Math.max(0, agent.released - last.released)
      for (let index = 0; index < Math.min(delta,6); index++) incoming.push({ key: `${agent.id}-${serial.current++}`, id: agent.id, expires: Date.now()+1800+index*110, delay: index*110 })
    }
    // Derive released packets from the external scheduler's cumulative counters.
    // eslint-disable-next-line react/set-state-in-effect
    setParticles(current => {
      const retained = current.filter(item => item.expires > Date.now())
      if (!incoming.length && retained.length === current.length) return current
      return [...retained,...incoming].slice(-36)
    })
  }, [snapshot,live])
  useEffect(() => {
    const interval = setInterval(() => setParticles(current => current.some(item => item.expires <= Date.now()) ? current.filter(item => item.expires > Date.now()) : current),400)
    return () => clearInterval(interval)
  }, [])
  return <svg ref={svgRef} className={`request-paths ${live ? 'channels-live' : ''}`} viewBox={`0 0 ${geometry.width} ${geometry.height}`} preserveAspectRatio="none" aria-hidden="true">
    <defs>{geometry.routes.map((route,index) => <g key={route.id}>
      <path id={`${uid}-route-${index}`} data-route-id={route.id} d={route.path}/>
      <linearGradient id={`${uid}-tube-${index}`} x1="0" y1="0" x2="0" y2="1"><stop stopColor={route.color} stopOpacity=".7"/><stop offset=".3" stopColor={route.color} stopOpacity=".15"/><stop offset=".65" stopColor={route.color} stopOpacity=".3"/><stop offset="1" stopColor={route.color} stopOpacity=".85"/></linearGradient>
      <marker id={`${uid}-arrow-${index}`} viewBox="0 0 18 18" refX="14" refY="9" markerWidth="18" markerHeight="18" markerUnits="userSpaceOnUse" orient="auto"><path d="M1 3L10 3L10 0L18 9L10 18L10 15L1 15Z" fill={route.color}/></marker>
    </g>)}</defs>
    {geometry.routes.map((route,index) => <g key={route.id} className="request-channel" style={{ color: route.color }} strokeLinecap="round">
      <use href={`#${uid}-route-${index}`} stroke="currentColor" strokeWidth="28" strokeOpacity=".05" fill="none"/>
      <use href={`#${uid}-route-${index}`} stroke="currentColor" strokeWidth="21" strokeOpacity=".12" fill="none"/>
      <use href={`#${uid}-route-${index}`} stroke="#081423" strokeWidth="16" fill="none"/>
      <use href={`#${uid}-route-${index}`} stroke={`url(#${uid}-tube-${index})`} strokeWidth="15" fill="none"/>
      <use href={`#${uid}-route-${index}`} stroke="currentColor" strokeWidth="2" strokeOpacity=".55" fill="none"/>
      <use href={`#${uid}-route-${index}`} stroke="currentColor" strokeWidth=".75" strokeOpacity=".35" fill="none" markerEnd={`url(#${uid}-arrow-${index})`}/>
    </g>)}
    {particles.map(particle => { const index = geometry.routes.findIndex(item => item.id === particle.id); return index >= 0 ? <RequestParticle key={particle.key} particle={particle} route={geometry.routes[index]} pathId={`${uid}-route-${index}`}/> : null })}
  </svg>
}
