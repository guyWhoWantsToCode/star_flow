import { memo, useEffect, useRef, useState, type CSSProperties } from 'react'
import { connectionColors, stationDockAnchor } from './connectionGeometry'
import StationDepthEffects from './StationDepthEffects'
import StationCanvas, { type StationRenderer } from './StationCanvas'
function GeminiStation({ live, activeCount = 3 }: { live: boolean; activeCount?: number }) {
  const stageRef = useRef<HTMLDivElement>(null)
  const [renderer, setRenderer] = useState<StationRenderer>('loading')
  useEffect(() => {
    const stage = stageRef.current!
    const motion = matchMedia('(prefers-reduced-motion: reduce)')
    const layers = stage.querySelectorAll<SVGSVGElement>('[data-depth-animation]')
    let visible = true
    const update = () => {
      const active = live && visible && !document.hidden && !motion.matches
      stage.dataset.effectsActive = String(active)
      layers.forEach(layer => { if (active && stage.dataset.renderer === 'fallback') layer.unpauseAnimations(); else layer.pauseAnimations() })
    }
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update() })
    const rendererObserver = new MutationObserver(update)
    rendererObserver.observe(stage, { attributes: true, attributeFilter: ['data-renderer'] })
    observer.observe(stage)
    document.addEventListener('visibilitychange', update)
    motion.addEventListener('change', update)
    update()
    return () => {
      observer.disconnect()
      rendererObserver.disconnect()
      document.removeEventListener('visibilitychange', update)
      motion.removeEventListener('change', update)
      layers.forEach(layer => layer.pauseAnimations())
    }
  }, [live])
  return <div className={`gemini-station ${live ? 'station-live' : ''}`}>
    <div className="station-stage" ref={stageRef} data-renderer={renderer} aria-busy={renderer === 'loading'}>
      <div className="station-depth-aura" aria-hidden="true"/>
      <StationDepthEffects layer="rear"/>
      <StationCanvas live={live} activeCount={activeCount} onRendererChange={setRenderer}/>
      {renderer !== '3d' && <img className={`station-render ${renderer === 'loading' ? 'station-preview' : ''}`} src="/images/mission-station-current.png" width="1159" height="1357" alt="" decoding="async" fetchPriority="high"/>}
      <div className="station-energy" aria-hidden="true"/>
      <div className="station-glass-light" aria-hidden="true"><i/></div>
      <StationDepthEffects layer="front"/>
      {connectionColors.slice(0,activeCount).map((color,index) => {
        const desktop = stationDockAnchor(index), mobile = stationDockAnchor(index,true)
        const style = {
          color, '--dock-x': `${desktop.x*100}%`, '--dock-y': `${desktop.y*100}%`,
          '--dock-mobile-x': `${mobile.x*100}%`, '--dock-mobile-y': `${mobile.y*100}%`,
        } as CSSProperties
        return <span key={color} className={`station-inlet station-inlet-${index}`} data-station-port={index} style={style} aria-hidden="true"/>
      })}
      <div className="station-core-label"><strong data-label="Gemini">Gemini</strong></div>
      <div className="scheduler-band"><span className="scheduler-wordmark"><b>StarFlow</b>{' scheduler'}</span></div>
    </div>
    <span className="station-caption">Guaranteed shares first. Unused capacity flows to agents that need it.</span>
  </div>
}
export default memo(GeminiStation)
