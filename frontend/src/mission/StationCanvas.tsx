import { memo, useEffect, useRef } from 'react'
import type { StationScene } from './stationScene'
import { loadStationScene } from './preloadStation'

export type StationRenderer = 'loading' | '3d' | 'fallback'

function StationCanvas({ live, activeCount, onRendererChange }: {
  live: boolean
  activeCount: number
  onRendererChange: (renderer: StationRenderer) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<StationScene | null>(null)
  const statusRef = useRef({ live, activeCount })
  useEffect(() => {
    statusRef.current = { live, activeCount }
    sceneRef.current?.setStatus(live, activeCount)
  }, [live, activeCount])
  useEffect(() => {
    const canvas = canvasRef.current!
    let disposed = false
    onRendererChange('loading')
    const fallback = () => { if (!disposed) onRendererChange('fallback') }
    // Reuse the renderer download started during agent selection.
    void loadStationScene().then(({ createStationScene }) => {
      if (disposed) return
      sceneRef.current = createStationScene(canvas, {
        onReady: () => { if (!disposed) onRendererChange('3d') },
        onFailure: fallback,
      })
      const status = statusRef.current
      sceneRef.current.setStatus(status.live, status.activeCount)
    }).catch(fallback)
    return () => {
      disposed = true
      sceneRef.current?.dispose()
      sceneRef.current = null
    }
  }, [onRendererChange])
  return <canvas className="station-canvas" ref={canvasRef} aria-hidden="true"/>
}

export default memo(StationCanvas)
