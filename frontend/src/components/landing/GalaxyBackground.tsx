import { memo, useEffect, useRef } from 'react'

// A seeded texture keeps the star field stable across resizes and React updates.
function randomSource(seed: number) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) | 0
    return (seed >>> 0) / 4294967296
  }
}

const textureCache = new Map<boolean, HTMLCanvasElement>()
function makeGalaxy(mobile: boolean) {
  const cached = textureCache.get(mobile)
  if (cached) return cached
  const texture = document.createElement('canvas')
  const size = mobile ? 1500 : 2800
  texture.width = texture.height = size
  const context = texture.getContext('2d')!
  const random = randomSource(73109)
  const center = size / 2
  const radius = size * 0.46
  const haze = context.createRadialGradient(center, center, 0, center, center, radius)
  haze.addColorStop(0, 'rgba(220,205,255,0.32)')
  haze.addColorStop(0.16, 'rgba(167,139,220,0.16)')
  haze.addColorStop(0.5, 'rgba(106,87,173,0.065)')
  haze.addColorStop(1, 'rgba(83,78,160,0)')
  context.fillStyle = haze
  context.fillRect(0, 0, size, size)

  const star = document.createElement('canvas')
  star.width = star.height = 24
  const starContext = star.getContext('2d')!
  const light = starContext.createRadialGradient(12, 12, 0, 12, 12, 12)
  light.addColorStop(0, 'rgba(245,238,255,1)')
  light.addColorStop(0.14, 'rgba(216,202,255,0.95)')
  light.addColorStop(0.35, 'rgba(159,140,230,0.35)')
  light.addColorStop(1, 'rgba(125,107,212,0)')
  starContext.fillStyle = light
  starContext.fillRect(0, 0, 24, 24)

  context.globalCompositeOperation = 'lighter'
  const count = mobile ? 23000 : 68000
  for (let index = 0; index < count; index++) {
    const coreStar = random() < 0.17
    const distance = coreStar
      ? Math.pow(random(), 0.85) * radius * 0.26
      : Math.pow(random(), 0.72) * radius
    const fraction = distance / radius
    const arm = Math.floor(random() * 4) * Math.PI / 2
    // More spread near the core, narrower streams along the outer arms.
    const scatter = (random() + random() + random() - 1.5) * (0.22 + 0.42 * (1 - fraction))
    const angle = coreStar || random() < 0.19
      ? random() * Math.PI * 2
      : arm + fraction * 6.1 + scatter
    const x = center + Math.cos(angle) * distance
    const y = center + Math.sin(angle) * distance
    const bright = random()
    const diameter = (bright > 0.99 ? 7 : 1.5 + bright * 2.5) * size / 1400
    context.globalAlpha = (0.4 + random() * 0.6) * (1 - fraction * 0.4)
    context.drawImage(star, x - diameter / 2, y - diameter / 2, diameter, diameter)
    // A sharp luminous point inside the halo prevents soft, smeared stars.
    context.fillStyle = bright > 0.8 ? '#f0e7ff' : '#aaa2ef'
    context.beginPath()
    context.arc(x, y, (0.24 + bright * 0.22) * size / 1400, 0, Math.PI * 2)
    context.fill()
  }
  context.globalAlpha = 1
  const core = context.createRadialGradient(center, center, 0, center, center, radius * 0.28)
  core.addColorStop(0, 'rgba(255,245,255,0.75)')
  core.addColorStop(0.18, 'rgba(241,224,253,0.48)')
  core.addColorStop(0.5, 'rgba(198,167,229,0.2)')
  core.addColorStop(1, 'rgba(149,121,204,0)')
  context.fillStyle = core
  context.fillRect(0, 0, size, size)
  textureCache.set(mobile, texture)
  return texture
}

function GalaxyBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current!
    const context = canvas.getContext('2d', { alpha: true })
    if (!context) return
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let texture: HTMLCanvasElement
    let width = 0
    let height = 0
    let mobile = false
    let angle = 0
    let frame = 0
    let lastTime = 0
    let inView = true
    let starLayers: { path: Path2D; opacity: number }[] = []
    const random = randomSource(9127)
    const distantStars = Array.from({ length: 65 }, () => {
      return { x: random(), y: random(), size: 0.4 + random() * 0.7, opacity: 0.1 + random() * 0.3 }
    })

    function draw() {
      if (!context || !texture) return
      context.clearRect(0, 0, width, height)
      for (const layer of starLayers) {
        context.fillStyle = `rgba(190,205,232,${layer.opacity})`
        context.fill(layer.path)
      }
      const diameter = mobile ? width * 1.65 : Math.min(width * 0.86, 1500)
      context.save()
      context.translate(width * (mobile ? 0.76 : 0.7), height * (mobile ? 0.5 : 0.55))
      context.rotate(-0.18)
      context.scale(1, 0.56)
      // Canvas Y points down, so increasing this angle rotates clockwise.
      context.rotate(angle)
      context.globalAlpha = mobile ? 0.72 : 1
      context.drawImage(texture, -diameter / 2, -diameter / 2, diameter, diameter)
      context.restore()
    }

    function tick(time: number) {
      frame = 0
      if (motion.matches || !inView || document.hidden) return
      if (!lastTime) lastTime = time
      if (time - lastTime >= 1000 / (mobile ? 30 : 60) - 0.75) {
        angle += Math.min((time - lastTime) / 1000, 0.1) * 0.075
        lastTime = time
        draw()
      }
      frame = requestAnimationFrame(tick)
    }

    function updateAnimation() {
      cancelAnimationFrame(frame)
      lastTime = 0
      draw()
      if (!motion.matches && inView && !document.hidden) frame = requestAnimationFrame(tick)
    }

    function resize() {
      const bounds = canvas.getBoundingClientRect()
      if (texture && width === bounds.width && height === bounds.height && canvas.width === Math.round(bounds.width * Math.min(window.devicePixelRatio || 1, 2))) return
      width = bounds.width
      height = bounds.height
      starLayers = Array.from({ length: 4 }, (_, index) => ({ path: new Path2D(), opacity: .1 + index * .1 }))
      for (const star of distantStars) {
        const layer = starLayers[Math.min(3, Math.round((star.opacity - .1) / .1))]
        layer.path.moveTo(star.x * width + star.size, star.y * height)
        layer.path.arc(star.x * width, star.y * height, star.size, 0, Math.PI * 2)
      }
      const nextMobile = width < 760
      if (!texture || mobile !== nextMobile) {
        mobile = nextMobile
        texture = makeGalaxy(mobile)
      }
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(width * pixelRatio)
      canvas.height = Math.round(height * pixelRatio)
      context!.imageSmoothingEnabled = true
      context!.imageSmoothingQuality = 'high'
      context!.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      updateAnimation()
    }

    const resizeObserver = new ResizeObserver(resize)
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting
      updateAnimation()
    })
    resizeObserver.observe(canvas)
    visibilityObserver.observe(canvas)
    motion.addEventListener('change', updateAnimation)
    document.addEventListener('visibilitychange', updateAnimation)
    resize()
    return () => {
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      visibilityObserver.disconnect()
      motion.removeEventListener('change', updateAnimation)
      document.removeEventListener('visibilitychange', updateAnimation)
    }
  }, [])

  return <div className="galaxy-background" aria-hidden="true"><canvas ref={canvasRef} /></div>
}

export default memo(GalaxyBackground)
