import { memo, useEffect, useRef } from 'react'

type World = 'moon' | 'ocean' | 'rust' | 'gas'

// Generate spherical, directionally lit surfaces once; animate only their positions.
function makeWorld(kind: World) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 128
  const context = canvas.getContext('2d')!
  const pixels = context.createImageData(128, 128)
  const craters = [ [-0.35, -0.22, 0.2], [0.24, 0.33, 0.16], [-0.18, 0.52, 0.1], [0.4, -0.4, 0.12], [-0.58, 0.18, 0.09] ]
  for (let y = 0; y < 128; y++) {
    for (let x = 0; x < 128; x++) {
      const nx = (x - 63.5) / 62
      const ny = (y - 63.5) / 62
      const square = nx * nx + ny * ny
      if (square > 1) continue
      const nz = Math.sqrt(1 - square)
      const longitude = Math.atan2(nx, nz)
      const latitude = Math.asin(ny)
      const detail = Math.sin(longitude * 19 + Math.cos(latitude * 13) * 3) * Math.cos(latitude * 27 - longitude * 7)
      const grain = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
      const noise = (grain - Math.floor(grain) - 0.5) * 14
      let color: number[]
      if (kind === 'moon') {
        let shade = 163 + detail * 19 + noise
        for (const [cx, cy, radius] of craters) {
          const distance = Math.hypot(nx - cx, ny - cy) / radius
          if (distance < 1) shade -= (1 - distance) * 48
          if (distance > 0.85 && distance < 1.1) shade += 15
        }
        color = [shade, shade * 0.98, shade * 0.96]
      } else if (kind === 'ocean') {
        const land = Math.sin(longitude * 4 + Math.sin(latitude * 6)) * Math.cos(latitude * 5 - longitude * 2) + detail * 0.13
        color = land > 0.27 ? [76 + noise, 120 + detail * 15, 100 + noise] : [28, 97 + noise, 159 + detail * 12]
        const cloud = Math.pow(Math.max(0, Math.sin(longitude * 12 + latitude * 21 + detail)), 9) * 0.5
        color = color.map(value => value * (1 - cloud) + 231 * cloud)
      } else if (kind === 'rust') {
        color = [182 + detail * 25 + noise, 96 + detail * 19, 64 + noise]
      } else {
        const bands = Math.sin(latitude * 37 + detail * 0.7)
        color = [201 + bands * 23, 166 + bands * 25, 122 + bands * 22]
      }
      const light = Math.max(0, nx * -0.48 + ny * -0.42 + nz * 0.77)
      const illumination = 0.09 + light * 0.91
      const index = (y * 128 + x) * 4
      for (let channel = 0; channel < 3; channel++) pixels.data[index + channel] = color[channel] * illumination
      pixels.data[index + 3] = Math.min(1, (1 - square) * 80) * 255
    }
  }
  context.putImageData(pixels, 0, 0)
  return canvas
}

function LunarOrbits() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current!
    const context = canvas.getContext('2d')
    if (!context) return
    const moon = makeWorld('moon')
    const planets = [
      { surface: makeWorld('ocean'), orbit: 73, size: 17, phase: 0.7, speed: 0.24 },
      { surface: makeWorld('rust'), orbit: 120, size: 12, phase: 3.6, speed: 0.17 },
      { surface: makeWorld('gas'), orbit: 170, size: 24, phase: 5.5, speed: 0.11 },
    ]
    const motion = matchMedia('(prefers-reduced-motion: reduce)')
    let visible = true
    let frame = 0
    let previous = 0
    let elapsed = 0
    let scrollFrame = 0
    function followScroll() {
      if (scrollFrame) return
      scrollFrame = requestAnimationFrame(() => {
        const shift = motion.matches ? 0 : Math.min(window.scrollY * 0.055, 65)
        canvas.parentElement!.style.transform = `translateY(${shift}px)`
        scrollFrame = 0
      })
    }
    function render() {
      if (!context) return
      context.clearRect(0, 0, 380, 100)
      context.save()
      context.translate(190, 49)
      context.rotate(-0.08)
      context.strokeStyle = 'rgba(171,190,215,0.28)'
      context.lineWidth = 0.65
      for (const planet of planets) {
        context.beginPath()
        context.ellipse(0, 0, planet.orbit, planet.orbit * 0.2, 0, 0, Math.PI * 2)
        context.stroke()
      }
      const positions = planets.map(planet => {
        const angle = planet.phase + elapsed * planet.speed
        return { ...planet, x: Math.cos(angle) * planet.orbit, y: Math.sin(angle) * planet.orbit * 0.2 }
      })
      function drawPlanet(planet: typeof positions[number]) {
        if (!context) return
        const size = planet.size * (1 + planet.y / 250)
        context.drawImage(planet.surface, planet.x - size / 2, planet.y - size / 2, size, size)
      }
      // Bodies pass behind the moon on the far side and in front on the near side.
      positions.filter(planet => planet.y < 0).forEach(drawPlanet)
      context.drawImage(moon, -22, -22, 44, 44)
      positions.filter(planet => planet.y >= 0).forEach(drawPlanet)
      context.restore()
    }
    function tick(time: number) {
      if (!visible || document.hidden || motion.matches) return
      if (previous) elapsed += Math.min((time - previous) / 1000, 0.1)
      previous = time
      render()
      frame = requestAnimationFrame(tick)
    }
    function update() {
      cancelAnimationFrame(frame)
      previous = 0
      render()
      if (visible && !document.hidden && !motion.matches) frame = requestAnimationFrame(tick)
    }
    function resize() {
      const ratio = Math.min(devicePixelRatio || 1, 2)
      canvas.width = 380 * ratio
      canvas.height = 100 * ratio
      context!.setTransform(ratio, 0, 0, ratio, 0, 0)
      update()
    }
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update() })
    observer.observe(canvas)
    window.addEventListener('resize', resize)
    window.addEventListener('scroll', followScroll, { passive: true })
    motion.addEventListener('change', followScroll)
    followScroll()
    document.addEventListener('visibilitychange', update)
    motion.addEventListener('change', update)
    resize()
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('resize', resize)
      window.removeEventListener('scroll', followScroll)
      motion.removeEventListener('change', followScroll)
      cancelAnimationFrame(scrollFrame)
      document.removeEventListener('visibilitychange', update)
      motion.removeEventListener('change', update)
    }
  }, [])
  return <div className="lunar-orbits" aria-hidden="true"><canvas ref={canvasRef} /></div>
}

export default memo(LunarOrbits)
