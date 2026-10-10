import { useEffect, useRef } from 'react'
export default function SpaceTravel({ onComplete }: { onComplete: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current!
    const context = canvas.getContext('2d')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const duration = reduced ? 180 : 3100
    let frame = 0
    let start = 0
    let randomSeed = 231
    const random = () => { randomSeed = (Math.imul(randomSeed, 1664525) + 1013904223) >>> 0; return randomSeed / 4294967296 }
    const stars = Array.from({ length: 210 }, () => ({ angle: random() * Math.PI * 2, radius: random(), depth: .25 + random() * .75 }))
    const pixelRatio = Math.min(devicePixelRatio || 1, 2)
    function resize() {
      canvas.width = Math.round(innerWidth * pixelRatio)
      canvas.height = Math.round(innerHeight * pixelRatio)
      context?.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
    }
    resize()
    function render(time: number) {
      if (!start) start = time
      const progress = Math.min((time - start) / duration, 1)
      if (context && !reduced) {
        const w = canvas.width / pixelRatio, h = canvas.height / pixelRatio
        context.clearRect(0, 0, w, h)
        const acceleration = Math.sin(progress * Math.PI) ** 2
        for (const star of stars) {
          const radius = ((star.radius + progress * (1.8 + star.depth)) % 1) * Math.hypot(w,h) * .55
          const angle = star.angle + progress * .24
          const x = Math.cos(angle), y = Math.sin(angle)
          const trail = acceleration * 65 * star.depth
          context.strokeStyle = `rgba(167,205,238,${(.25 + star.depth * .55) * Math.sin(progress * Math.PI)})`
          context.lineWidth = .6 + star.depth
          context.beginPath()
          context.moveTo(w*.5 + x*radius, h*.46 + y*radius)
          context.lineTo(w*.5 + x*(radius+trail), h*.46 + y*(radius+trail))
          context.stroke()
        }
      }
      if (progress >= 1) onComplete()
      else frame = requestAnimationFrame(render)
    }
    frame = requestAnimationFrame(render)
    window.addEventListener('resize', resize)
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', resize) }
  }, [onComplete])
  return <div className="space-travel" role="status" aria-live="polite"><canvas ref={canvasRef}/><div><span className="travel-rule"/><p>Approaching Mission Control</p><span>Preparing your orbital station</span></div></div>
}
