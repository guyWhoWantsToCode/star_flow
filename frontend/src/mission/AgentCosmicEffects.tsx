import { memo, useEffect, useId, useRef, type CSSProperties } from 'react'
import './agentCosmicEffects.css'

const themes: Record<string, string> = {
  chatbot: 'orbital',
  summarizer: 'nebula',
  tagger: 'vortex',
  fourth: 'asteroid',
}

// Decorative stars are deliberately separate from the real request packets.
const stars = Array.from({ length: 28 }, (_, index) => {
  const angle = index * 2.3999632297
  const radius = 1 + (index % 4) * .065
  return {
    x: 280 + Math.cos(angle) * 236 * radius,
    y: 178 + Math.sin(angle) * 128 * radius,
    size: index % 7 === 0 ? 2 : .75 + (index % 3) * .25,
    opacity: .25 + (index % 5) * .1,
  }
})

function OrbitalScene() {
  return <>
    <g className="card-space-filaments" fill="none" stroke="currentColor">
      <ellipse cx="280" cy="172" rx="243" ry="83" transform="rotate(-18 280 172)" opacity=".38"/>
      <ellipse cx="280" cy="172" rx="223" ry="141" transform="rotate(26 280 172)" opacity=".2"/>
      <path d="M78 90 144 42 240 37 313 76 M51 227 113 286 207 310 346 300 484 251" opacity=".3"/>
      <path d="M144 42 170 97 240 37 M113 286 125 231 207 310" opacity=".17"/>
    </g>
    <g className="card-space-light" fill="none" stroke="currentColor" strokeWidth="2.6">
      <path d="M46 194C12 143 86 77 195 63" opacity=".48"/>
      <path d="M351 280C434 268 528 225 516 170" opacity=".48"/>
    </g>
    <g fill="#c7fbff">
      <circle cx="144" cy="42" r="2.6"/><circle cx="240" cy="37" r="2"/>
      <circle cx="113" cy="286" r="2.8"/><circle cx="207" cy="310" r="2"/>
    </g>
    <g transform="translate(280 172) rotate(-18) scale(1 .34)">
      <g className="card-space-orbit-spin">
        <circle cx="239" cy="0" r="4.6" fill="#a9f5ff"/>
        <circle cx="-239" cy="0" r="3.1" fill="currentColor"/>
        <circle cx="0" cy="-239" r="2.4" fill="#e5ffff"/>
      </g>
    </g>
  </>
}

function NebulaScene() {
  return <>
    <g className="card-space-nebula-drift" fill="none" stroke="currentColor" strokeLinecap="round">
      <g className="card-space-cloud" strokeWidth="22" opacity=".3">
        <path d="M44 160C12 111 83 75 129 71S219 48 284 60 375 36 430 70 522 72 518 146"/>
        <path d="M77 244C106 291 180 264 225 282S343 300 397 273 495 283 523 224"/>
      </g>
      <g className="card-space-light" strokeWidth="3" opacity=".54">
        <path d="M45 155C25 118 84 94 124 90S206 49 264 70"/>
        <path d="M310 66C355 89 407 50 444 88S509 118 511 153"/>
        <path d="M122 272C172 245 221 299 277 288S368 286 407 261"/>
      </g>
      <g strokeWidth=".8" opacity=".4">
        <path d="M39 132C55 90 82 104 95 83S159 88 177 59 230 80 256 61"/>
        <path d="M363 57C391 103 421 50 452 91S497 100 527 162"/>
        <path d="M111 289C134 261 180 287 215 279S245 309 289 288 342 316 393 283"/>
      </g>
    </g>
    <g className="card-space-nebula-spark" fill="#f5e8ff">
      <path d="m467 90 2 8 8 2-8 2-2 8-2-8-8-2 8-2Z"/>
      <path d="m90 236 1.5 5 5 1.5-5 1.5-1.5 5-1.5-5-5-1.5 5-1.5Z"/>
      <circle cx="161" cy="68" r="1.8"/><circle cx="418" cy="280" r="2"/>
    </g>
  </>
}

function VortexScene() {
  return <>
    <g transform="translate(280 172) rotate(-17) scale(1 .57)">
      <g className="card-space-vortex-turn" fill="none" stroke="currentColor">
        <g className="card-space-cloud" strokeWidth="13" opacity=".23">
          <path d="M-262 0C-235-142 80-205 226-100S200 170-27 156-275 88-262 0"/>
          <path d="M262 0C235 142-80 205-226 100S-200-170 27-156 275-88 262 0"/>
        </g>
        <g className="card-space-light" strokeWidth="2.5" opacity=".54">
          <path d="M-253 0C-236-116 80-181 214-98S185 140-31 136"/>
          <path d="M253 0C236 116-80 181-214 98S-185-140 31-136"/>
        </g>
        <g strokeWidth=".8" opacity=".24">
          {[170, 200, 230, 260].map(radius => <ellipse key={radius} rx={radius} ry={radius * .64}/>)}
          <path d="M-260 0H260M0-166V166M-219-87 219 87M-219 87 219-87"/>
        </g>
        <g fill="#b2ddff" stroke="none">
          <circle cx="-239" cy="-43" r="3.1"/><circle cx="200" cy="84" r="2.3"/>
          <circle cx="107" cy="-143" r="2"/><circle cx="-100" cy="145" r="1.7"/>
        </g>
      </g>
    </g>
  </>
}

function AsteroidScene({ prefix }: { prefix: string }) {
  return <>
    <g className="card-space-dust-drift" fill="none" stroke="currentColor">
      <g className="card-space-cloud" strokeWidth="24" opacity=".21">
        <path d="M38 173C22 93 111 54 188 73M337 68C425 48 526 104 516 183M111 275C220 308 354 299 455 247"/>
      </g>
      <g className="card-space-light" strokeWidth="2" opacity=".47">
        <path d="M43 166C32 105 106 71 182 78M383 78C462 71 518 122 515 167M132 280C233 304 368 282 431 264"/>
      </g>
      <path d="M20 188C42 78 154 28 308 55S513 79 537 182" opacity=".18"/>
    </g>
    <g className="card-space-asteroids">
      <g>
        {/* Each stone has a lit face and a darker, irregular silhouette. */}
        <g className="card-space-stone card-space-stone-one">
          <path d="M477 59Q481 53 488 52Q496 52 501 56Q508 61 509 68Q512 76 505 82Q499 89 486 88Q477 87 473 79Q470 70 477 59Z" fill={`url(#${prefix}-stone)`}/>
          <path d="M477 60Q482 54 489 54Q496 54 500 59Q496 66 487 69Q479 71 475 69Q474 65 477 60Z" fill={`url(#${prefix}-stone-light)`}/>
          <ellipse cx="488" cy="63" rx="4.6" ry="3.7" transform="rotate(-25 488 63)" fill={`url(#${prefix}-stone-pit)`} opacity=".75"/>
          <ellipse cx="500" cy="73" rx="3.1" ry="2.7" fill={`url(#${prefix}-stone-pit)`} opacity=".55"/>
          <ellipse cx="480" cy="77" rx="2.2" ry="2.6" fill={`url(#${prefix}-stone-pit)`} opacity=".55"/>
          <path d="M483 62Q485 58 490 60M497 72Q499 69 502 71M476 60Q480 54 487 53" fill="none" stroke="#ccb18a" strokeWidth=".65" opacity=".3"/>
        </g>
        <g className="card-space-stone card-space-stone-two">
          <path d="M46 232Q50 225 57 226Q65 225 69 232Q73 237 72 244Q69 253 61 254Q52 254 47 249Q42 241 46 232Z" fill={`url(#${prefix}-stone)`}/>
          <path d="M47 233Q51 227 58 227Q64 226 67 232Q62 238 55 240Q49 240 46 237Z" fill={`url(#${prefix}-stone-light)`}/>
          <ellipse cx="55" cy="234" rx="3.7" ry="2.8" transform="rotate(-20 55 234)" fill={`url(#${prefix}-stone-pit)`} opacity=".65"/>
          <ellipse cx="64" cy="245" rx="2.8" ry="2.5" fill={`url(#${prefix}-stone-pit)`} opacity=".5"/>
          <path d="M51 233Q53 230 57 232M46 232Q50 227 55 226" fill="none" stroke="#c1a47a" strokeWidth=".6" opacity=".3"/>
        </g>
        <g className="card-space-stone card-space-stone-three">
          <path d="M436 279Q440 274 445 276Q452 276 455 281Q459 287 455 292Q451 297 443 294Q436 296 433 290Q431 284 436 279Z" fill={`url(#${prefix}-stone)`}/>
          <path d="M436 280Q440 276 445 277Q450 277 452 281Q447 286 442 286Q437 286 434 284Z" fill={`url(#${prefix}-stone-light)`}/>
          <ellipse cx="443" cy="282" rx="3" ry="2.4" fill={`url(#${prefix}-stone-pit)`} opacity=".65"/>
          <ellipse cx="449" cy="290" rx="1.8" ry="1.5" fill={`url(#${prefix}-stone-pit)`} opacity=".45"/>
        </g>
      </g>
    </g>
    <g className="card-space-dust" fill="#ffe0ad">
      {Array.from({ length: 22 }, (_, index) => {
        const angle = index * 2.137
        return <circle key={index} cx={280 + Math.cos(angle) * (230 + index % 3 * 10)} cy={178 + Math.sin(angle) * (125 + index % 4 * 5)} r={index % 6 === 0 ? 1.6 : .7} opacity={.25 + index % 4 * .1}/>
      })}
    </g>
  </>
}

function AgentCosmicEffects({ slot }: { slot: string }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const prefix = useId().replaceAll(':', '')
  const theme = themes[slot]
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    let visible = true
    const sync = () => { root.dataset.cosmicActive = String(visible && !document.hidden) }
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      sync()
    }, { rootMargin: '40px' })
    observer.observe(root)
    document.addEventListener('visibilitychange', sync)
    sync()
    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', sync)
    }
  }, [theme])
  if (!theme) return null
  return <div ref={rootRef} className={`agent-cosmic-effects card-space-${theme}`} data-cosmic-active="false" aria-hidden="true">
    <span className="card-space-haze"/>
    <svg className="card-space-scene" viewBox="0 0 560 360" preserveAspectRatio="none" focusable="false">
      <defs>
        <filter id={`${prefix}-light`} x="-25%" y="-35%" width="150%" height="170%" colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation="2.3" result="halo"/><feMerge><feMergeNode in="halo"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id={`${prefix}-cloud`} x="-25%" y="-40%" width="150%" height="180%" colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation="9"/>
        </filter>
        <radialGradient id={`${prefix}-stone`} cx="28%" cy="22%" r="85%" fx="25%" fy="18%">
          <stop offset="0" stopColor="#aa9476"/><stop offset=".3" stopColor="#796751"/>
          <stop offset=".68" stopColor="#443c33"/><stop offset="1" stopColor="#1a2229"/>
        </radialGradient>
        <radialGradient id={`${prefix}-stone-light`} cx="35%" cy="20%" r="75%">
          <stop offset="0" stopColor="#e3c89e" stopOpacity=".6"/>
          <stop offset=".55" stopColor="#bb9871" stopOpacity=".17"/><stop offset="1" stopColor="#bb9871" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id={`${prefix}-stone-pit`} cx="45%" cy="40%" r="65%">
          <stop offset="0" stopColor="#282724"/><stop offset=".45" stopColor="#3f3830"/>
          <stop offset=".8" stopColor="#756249"/><stop offset="1" stopColor="#aa9070" stopOpacity=".25"/>
        </radialGradient>
      </defs>
      <g className="card-space-art" style={{ '--card-light-filter': `url(#${prefix}-light)`, '--card-cloud-filter': `url(#${prefix}-cloud)` } as CSSProperties}>
        {theme === 'orbital' && <OrbitalScene/>}
        {theme === 'nebula' && <NebulaScene/>}
        {theme === 'vortex' && <VortexScene/>}
        {theme === 'asteroid' && <AsteroidScene prefix={prefix}/>}
      </g>
      <g className="card-space-stars" fill="#e4f4ff">
        {stars.map((star, index) => <circle key={index} className={index % 4 === 0 ? 'card-space-twinkle' : undefined} cx={star.x} cy={star.y} r={star.size} opacity={star.opacity} style={{ '--star-delay': `${-index * .47}s`, '--star-duration': `${3.5 + index % 4 * .7}s` } as CSSProperties}/>)}
      </g>
    </svg>
  </div>
}

export default memo(AgentCosmicEffects)
