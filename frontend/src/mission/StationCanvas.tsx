import { memo, useEffect, useRef } from 'react'
import type { StationScene } from './stationScene'

function StationCanvas({ live, activeCount }: { live: boolean; activeCount: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<StationScene | null>(null)
  const statusRef = useRef({ live, activeCount })
  useEffect(() => {
    statusRef.current = { live, activeCount }
    sceneRef.current?.setStatus(live, activeCount)
  }, [live, activeCount])
  useEffect(() => {
    const canvas = canvasRef.current!
    const stage = canvas.parentElement!
    let disposed = false
    const fallback = () => { if (!disposed) delete stage.dataset.renderer }
    // Load the renderer only on Mission Control, leaving the landing page light.
    void import('./stationScene').then(({ createStationScene }) => {
      if (disposed) return
      sceneRef.current = createStationScene(canvas, {
        onReady: () => { if (!disposed) stage.dataset.renderer = '3d' },
        onFailure: fallback,
      })
      const status = statusRef.current
      sceneRef.current.setStatus(status.live, status.activeCount)
    }).catch(fallback)
    return () => {
      disposed = true
      sceneRef.current?.dispose()
      sceneRef.current = null
      delete stage.dataset.renderer
    }
  }, [])
  return <canvas className="station-canvas" ref={canvasRef} aria-hidden="true"/>
}

export default memo(StationCanvas)
