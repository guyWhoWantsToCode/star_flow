import { memo, useId } from 'react'



const glyphs: Record<string, string> = {
  chatbot:'M7 7H17Q20 7 20 10V16Q20 19 17 19H7Q4 19 4 16V10Q4 7 7 7ZM12 3V7M8 12H9M15 12H16M9 16H15',
  triage:'M5 6H19M12 6V12M5 19V15H19V19M12 12V19',
  search:'M16 16L21 21M18 10A8 8 0 1 1 2 10A8 8 0 1 1 18 10',
  rerank:'M5 6H17M5 12H14M5 18H11M19 10V20M16 17L19 20L22 17',
  translate:'M3 5H13M8 3V5M5 5Q6 13 12 15M11 5Q10 12 3 15M13 20L17 10L21 20M15 16H19',
  moderate:'M12 3L20 6V12Q20 18 12 21Q4 18 4 12V6ZM8 12L11 15L16 9',
  fraud:'M12 3L20 6V12Q20 18 12 21Q4 18 4 12V6ZM12 8V13M12 16H12.1',
  onboard:'M12 3Q5 8 8 15H16Q19 8 12 3ZM8 12L4 17H8M16 12L20 17H16M10 18L12 22L14 18',
  alerts:'M12 4V15M12 19H12.1M12 2L22 21H2Z',
  voice:'M4 10V14M8 6V18M12 3V21M16 6V18M20 10V14',
  summarizer:'M3 7H21V19H3ZM3 7L12 14L21 7M7 3H17',
  tagger:'M3 12L12 3H21V12L12 21ZM16 7H16.1',
  notes:'M5 3H19V21H5ZM8 7H16M8 11H16M8 15H13',
  invoice:'M5 3H19V21L15 19L12 21L9 19L5 21ZM8 7H16M8 11H13M8 15H16',
  resume:'M3 12A9 9 0 1 0 12 3V12L18 6M6 12H18M12 6V18',
  caption:'M3 5H21V19H3ZM3 16L8 11L13 16L17 12L21 16M16 9H16.1',
  sentiment:'M3 12H7L10 6L14 18L17 12H21',
  lead:'M12 3L21 12L12 21L3 12ZM12 8V16M8 12H16',
  review:'M7 6L2 12L7 18M17 6L22 12L17 18M14 3L10 21',
  changelog:'M5 3V21M5 8H11Q15 8 15 12V15M12 15H18M12 19H20',
}
function AgentSpaceArt({ id, icon = false }: { id: string; icon?: boolean }) {
  const uid = useId().replace(/:/g,'')
  if (icon) return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={glyphs[id] ?? glyphs.notes}/></svg>
  const planet = `url(#${uid}-planet)`
  const haze = `url(#${uid}-haze)`
  const glass = `url(#${uid}-glass)`
  const orb = (x:number,y:number,r:number) => <circle key={`${x}-${y}-${r}`} cx={x} cy={y} r={r} fill={planet} stroke="currentColor" strokeWidth=".7"/>
  const stars = <g opacity=".5">{Array.from({length:19},(_,i)=><circle key={i} cx={12+(i*53)%218} cy={9+(i*31)%129} r={i%5===0?1.1:.55} fill="currentColor"/>)}</g>
  let art
  switch(id) {
    case 'chatbot': art=<><ellipse cx="120" cy="123" rx="65" ry="10" fill={haze}/><g className="space-float"><ellipse cx="120" cy="92" rx="50" ry="29" fill="none" stroke="currentColor" opacity=".3" transform="rotate(-18 120 92)"/><path d="M93 77Q120 65 147 77L143 108Q120 123 97 108Z" fill={glass} stroke="currentColor"/><rect x="87" y="30" width="66" height="49" rx="23" fill={planet} stroke="currentColor"/><rect x="95" y="39" width="50" height="27" rx="13" fill="#071823" stroke="currentColor" strokeOpacity=".6"/><g className="space-pulse"><circle cx="108" cy="52" r="3" fill="currentColor"/><circle cx="132" cy="52" r="3" fill="currentColor"/></g><path d="M120 30V21M88 49L81 46M153 49L160 46M93 83L82 102M147 83L158 102" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>{orb(120,93,7)}</g></>;break
    case 'triage': art=<><g className="space-orbit"><ellipse cx="120" cy="75" rx="73" ry="30" stroke="currentColor" strokeDasharray="2 8"/>{[0,1,2,3,4,5].map(i=>orb(120+Math.cos(i)*72,75+Math.sin(i)*30,4+i%3))}</g>{orb(120,75,24)}<path d="M74 104L88 107L83 92M166 47L152 43L157 58" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></>;break
    case 'search': art=<><g transform="rotate(-24 120 72)"><g className="space-vortex">{[26,36,48,61].map((r,i)=><ellipse key={r} cx="120" cy="72" rx={r} ry={r*.55} stroke="currentColor" strokeWidth={i===1?4:1.5} opacity={.8-i*.15} strokeDasharray={`${r*1.8} ${r*.55}`}/>)}</g><ellipse cx="120" cy="72" rx="22" ry="13" fill="#040812" stroke="currentColor"/></g><g className="space-float"><circle cx="172" cy="104" r="16" fill={glass} stroke="currentColor" strokeWidth="2"/><path d="M184 116L201 133" stroke="currentColor" strokeWidth="5" strokeLinecap="round"/></g></>;break
    case 'rerank': art=<><ellipse cx="120" cy="119" rx="60" ry="17" stroke="currentColor" opacity=".25"/><path d="M120 24V119" stroke="currentColor" strokeWidth="1.5" opacity=".6"/>{[40,69,98].map((y,i)=><g key={y} className={`space-pulse space-phase-${i}`}><ellipse cx="120" cy={y} rx={12+i*11} ry="6" stroke="currentColor"/>{orb(120,y,3.5)}</g>)}<path className="space-float" d="M120 12L124 23L136 27L124 31L120 42L116 31L104 27L116 23Z" fill="currentColor"/></>;break
    case 'translate': art=<>{orb(120,76,37)}<path d="M93 56L109 49L123 59L117 75L98 81L104 96M132 52L148 68L140 86L131 94L124 86" fill="currentColor" opacity=".4"/><g className="space-orbit"><ellipse cx="120" cy="76" rx="72" ry="24" stroke="currentColor" transform="rotate(-30 120 76)"/><ellipse cx="120" cy="76" rx="59" ry="24" stroke="currentColor" opacity=".4" transform="rotate(38 120 76)"/>{orb(58,110,4)}</g></>;break
    case 'moderate': art=<>{orb(120,76,35)}<g className="space-orbit"><circle cx="120" cy="76" r="54" stroke="currentColor" strokeDasharray="28 9" opacity=".65"/><path d="M67 55L62 43L57 55ZM176 103L171 91L166 103Z" stroke="currentColor"/></g><path d="M105 76L116 86L137 62" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></>;break
    case 'fraud': art=<><path d="M120 29L155 44V78Q152 106 120 125Q88 106 85 78V44Z" fill={glass} stroke="currentColor" strokeWidth="1.5"/><path d="M120 40L145 51V78Q142 97 120 112Q98 97 95 78V51Z" stroke="currentColor" opacity=".45"/><g className="space-pulse"><path d="M106 73L117 84L138 61" stroke="currentColor" strokeWidth="3"/>{orb(120,75,4)}</g><g className="space-stream"><path d="M43 48L69 64M177 102L201 117M175 39L199 23" stroke="currentColor" strokeWidth="2" strokeDasharray="3 12"/></g></>;break
    case 'onboard': art=<><ellipse cx="120" cy="127" rx="48" ry="12" fill={haze}/><g className="space-launch"><path d="M120 22Q96 48 107 87H133Q144 48 120 22Z" fill={planet} stroke="currentColor"/><circle cx="120" cy="57" r="8" fill="#0b1727" stroke="currentColor"/><path d="M107 70L95 91L108 88M133 70L145 91L132 88" fill={glass} stroke="currentColor"/><path className="space-pulse" d="M111 91Q120 119 129 91" fill="currentColor" opacity=".6"/></g></>;break
    case 'alerts': art=<><g className="space-float"><path d="M84 58L63 43L47 65L68 80M145 89L167 105L183 83L162 67" fill={glass} stroke="currentColor"/><path d="M54 54L76 69M61 45L82 60M164 76L177 90" stroke="currentColor" opacity=".4"/><path d="M94 54L139 86L127 103L82 71Z" fill={planet} stroke="currentColor"/><circle cx="100" cy="64" r="8" fill={glass} stroke="currentColor"/></g><g className="space-signal"><path d="M142 44Q159 52 159 68M152 31Q176 43 176 69M82 94Q65 88 64 75" stroke="currentColor" strokeWidth="1.5"/></g></>;break
    case 'voice': art=<>{orb(120,75,31)}<g className="space-orbit"><circle cx="120" cy="75" r="45" stroke="currentColor" strokeDasharray="70 24"/><circle cx="120" cy="75" r="53" stroke="currentColor" strokeDasharray="20 13" opacity=".35"/></g><g className="space-wave">{[0,1,2,3,4,5,6].map(i=><path key={i} d={`M${93+i*9} ${75-(16-Math.abs(3-i)*4)}V${75+(16-Math.abs(3-i)*4)}`} stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>)}</g></>;break
    case 'summarizer': art=<><g className="space-comet"><path d="M181 27L97 91L154 38L101 95L192 17" fill={glass}/>{orb(96,93,11)}</g><g className="space-float"><path d="M137 89H189V129H137Z" fill={glass} stroke="currentColor"/><path d="M140 91L163 109L187 91M137 129L157 110M189 129L171 110" stroke="currentColor"/><path d="M147 83H179V107L163 119L147 107Z" fill={planet}/><path d="M153 89H173M153 95H173" stroke="currentColor" opacity=".8"/></g></>;break
    case 'tagger': art=<><path className="space-stream" strokeDasharray="4 12" d="M45 88L82 45L126 70L172 35L199 93L146 118L126 70L82 115L45 88" stroke="currentColor" strokeOpacity=".35"/><g className="space-pulse">{[[45,88],[82,45],[126,70],[172,35],[199,93],[146,118],[82,115]].map(([x,y])=> <circle key={`${x}-${y}`} cx={x} cy={y} r="3" fill="currentColor"/>)}</g>{[[58,55],[144,54],[169,106]].map(([x,y])=><g key={x}><rect x={x} y={y} width="23" height="12" rx="3" fill={glass} stroke="currentColor"/><path d={`M${x+5} ${y+6}H${x+17}`} stroke="currentColor"/></g>)}</>;break
    case 'notes': art=<>{orb(171,100,29)}<path className="space-stream" strokeDasharray="35 6" d="M40 29L73 47L90 84L125 74L149 40M73 47L57 95L90 84L110 120" stroke="currentColor" opacity=".6"/><g className="space-twinkle">{[[40,29],[73,47],[90,84],[125,74],[149,40],[57,95],[110,120]].map(([x,y])=><circle key={x} cx={x} cy={y} r="2.2" fill="currentColor"/>)}</g><circle cx="168" cy="91" r="7" fill="#091323" opacity=".4"/><circle cx="183" cy="109" r="5" fill="#091323" opacity=".3"/></>;break
    case 'invoice': art=<><g className="space-orbit"><circle cx="120" cy="75" r="47" stroke="currentColor" strokeWidth="2"/><ellipse cx="120" cy="75" rx="28" ry="47" stroke="currentColor"/><path d="M73 75H167M120 28V122" stroke="currentColor" opacity=".5"/></g><path className="space-float" d="M120 37L129 67L154 75L128 83L120 113L112 83L86 75L112 67Z" fill={glass} stroke="currentColor"/>{orb(120,75,8)}<path d="M118 14H122V25H118Z" fill="currentColor"/></>;break
    case 'resume': art=<><g opacity=".5">{[22,39,55].map(r=><circle key={r} cx="120" cy="75" r={r} stroke="currentColor"/>)}<path d="M65 75H175M120 20V130" stroke="currentColor" opacity=".35"/></g><g className="space-orbit"><path d="M120 75L120 20A55 55 0 0 1 175 75Z" fill={glass}/><path d="M120 75L161 39" stroke="currentColor"/></g><g className="space-pulse">{orb(141,56,3)}{orb(98,93,2)}</g></>;break
    case 'caption': art=<><g className="space-float"><path d="M98 60L145 39L154 62L107 83Z" fill={planet} stroke="currentColor"/><ellipse cx="149" cy="50" rx="8" ry="13" transform="rotate(-24 149 50)" fill="#07172b" stroke="currentColor"/><path d="M123 74L110 123M123 74L146 123M123 74V120" stroke="currentColor" strokeWidth="2"/><path d="M95 65L88 68L94 82L102 80" fill={glass} stroke="currentColor"/></g><g className="space-signal"><path d="M171 33L181 25M179 50H195M166 70L182 76" stroke="currentColor"/></g></>;break
    case 'sentiment': art=<><path d="M30 78Q66 21 120 76T210 74" stroke="currentColor" strokeOpacity=".4"/><g className="space-wave"><path d="M40 80H81L90 62L102 102L115 48L128 92L139 80H198" stroke="currentColor" strokeWidth="2"/></g>{orb(120,28,7)}<ellipse cx="120" cy="119" rx="60" ry="8" fill={haze}/></>;break
    case 'lead': art=<><g className="space-orbit"><ellipse cx="120" cy="77" rx="61" ry="42" stroke="currentColor" strokeDasharray="4 10"/>{orb(170,53,4)}</g><path d="M120 30L152 77L120 123L88 77Z" fill={glass} stroke="currentColor"/><path d="M120 49L140 77L120 105L100 77Z" stroke="currentColor" opacity=".6"/>{orb(120,77,7)}<g className="space-pulse"><path d="M120 68V86M111 77H129" stroke="currentColor"/></g></>;break
    case 'review': art=<><g className="space-float"><rect x="61" y="39" width="118" height="76" rx="7" fill={glass} stroke="currentColor"/><path d="M61 54H179" stroke="currentColor" opacity=".4"/><circle cx="70" cy="47" r="1.5" fill="currentColor"/><circle cx="77" cy="47" r="1.5" fill="currentColor"/><path d="M94 69L79 83L94 97M146 69L161 83L146 97M126 65L114 101" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></g><g className="space-stream"><path d="M39 29L201 29M45 128H195" stroke="currentColor" strokeDasharray="3 20" opacity=".5"/></g></>;break
    case 'changelog': art=<><path d="M66 28V119M66 57Q66 77 108 77H150" stroke="currentColor" strokeWidth="1.3" opacity=".6"/><g className="space-pulse">{orb(66,32,6)}{orb(66,75,6)}{orb(66,116,6)}</g><g className="space-float"><path d="M139 44H175L184 53V115H139Z" fill={glass} stroke="currentColor"/><path d="M175 44V55H184M147 68H174M147 79H174M147 90H166" stroke="currentColor" opacity=".8"/></g></>;break
    default: art=<>{orb(120,75,31)}<g className="space-orbit"><ellipse cx="120" cy="75" rx="68" ry="25" stroke="currentColor"/>{orb(182,65,5)}</g></>
  }
  return <svg className={`catalog-scene scene-${id}`} viewBox="0 0 240 150" fill="none" aria-hidden="true">
    <defs>
      <radialGradient id={`${uid}-planet`} cx=".3" cy=".25" r=".85"><stop stopColor="#e5f5ff" stopOpacity=".85"/><stop offset=".25" stopColor="currentColor" stopOpacity=".8"/><stop offset=".7" stopColor="currentColor" stopOpacity=".25"/><stop offset="1" stopColor="#080f1f"/></radialGradient>
      <radialGradient id={`${uid}-haze`}><stop stopColor="currentColor" stopOpacity=".25"/><stop offset="1" stopColor="currentColor" stopOpacity="0"/></radialGradient>
      <linearGradient id={`${uid}-glass`} x2="1" y2="1"><stop stopColor="currentColor" stopOpacity=".25"/><stop offset="1" stopColor="currentColor" stopOpacity=".04"/></linearGradient>
    </defs>
    <ellipse cx="120" cy="77" rx="114" ry="71" fill={haze}/>{stars}{art}
  </svg>
}
export default memo(AgentSpaceArt)
