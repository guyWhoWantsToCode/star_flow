import { memo, useId } from 'react'

const orbit = 'M1127 715 A548 112 0 1 1 31 715 A548 112 0 1 1 1127 715'

// The rear and front halves share the same projection and timing. The station
// occludes the rear half, keeping the light projection attached as the station drifts.
function StationDepthEffects({ layer }: { layer: 'rear' | 'front' }) {
  const uid = useId().replace(/:/g, '')
  return <svg className={`station-depth-orbit station-depth-${layer}`} viewBox="0 0 1159 1357" fill="none" aria-hidden="true" data-depth-animation>
    <defs>
      <clipPath id={`${uid}-half`}>
        <rect x="0" y={layer === 'rear' ? 0 : 715} width="1159" height={layer === 'rear' ? 715 : 642}/>
      </clipPath>
    </defs>
    {layer === 'front' && <g className="station-rim-lights">
      <ellipse cx="579" cy="708" rx="510" ry="489" stroke="#63cbff" strokeOpacity=".08" strokeWidth="9"/>
      <ellipse className="station-rim-scan" cx="579" cy="708" rx="510" ry="489" stroke="#88deff" strokeOpacity=".5" strokeWidth="1.5" strokeDasharray="23 360 5 730"/>
      <ellipse className="station-rim-scan station-rim-counter" cx="579" cy="708" rx="500" ry="480" stroke="#b79aff" strokeOpacity=".3" strokeWidth="1" strokeDasharray="45 610 9 440"/>
    </g>}
    <g clipPath={`url(#${uid}-half)`}>
      <path d={orbit} stroke="#79c9ec" strokeOpacity={layer === 'rear' ? '.12' : '.23'} strokeWidth="1"/>
      <path d={orbit} stroke="#4a9ed0" strokeOpacity=".055" strokeWidth="8"/>
      {[{ color: '#8eeaff', phase: '-2s', duration: '20s' }, { color: '#c9a6ff', phase: '-12s', duration: '20s' }].map(light => <g key={light.color}>
        <circle r="14" fill={light.color} opacity=".08"/>
        <circle r="7" fill={light.color} opacity=".24"/>
        <circle r="3.2" fill={light.color}/>
        <circle r="1.3" fill="#f1fbff"/>
        <animateMotion path={orbit} dur={light.duration} begin={light.phase} repeatCount="indefinite"/>
      </g>)}
    </g>
  </svg>
}

export default memo(StationDepthEffects)
