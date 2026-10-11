// Browser verification only: mount with an already-received real backend snapshot,
// matching the transition from agent selection into Mission Control.
import { createRoot } from 'react-dom/client'
import { useStarFlow } from '../src/hooks/useStarFlow'
import MissionControl from '../src/mission/MissionControl'
import GalaxyBackground from '../src/components/landing/GalaxyBackground'
import HeroEarth from '../src/components/landing/HeroEarth'
import LunarOrbits from '../src/components/landing/LunarOrbits'
import '../src/index.css'
import '../src/App.css'
import '../src/mission/mission.css'
import '../src/mission/dashboard.css'

export default function Preview() {
  const connection = useStarFlow(true)
  return <><GalaxyBackground/><HeroEarth/><LunarOrbits mission/>{connection.snapshot
    ? <MissionControl connection={connection} onSetup={() => {}}/>
    : <p>Waiting for the real backend snapshot: {connection.status} {connection.error}</p>}</>
}
// Deterministic regression fixture only; production continues to use the backend.
// All four IDs are present before mount, which previously left every path empty.
const fixture = {
  t:0,limit:10,events:[],agents:[['chatbot','Customer chatbot'],['triage','Support triage'],['fraud','Fraud screener'],['tagger','Data tagger']].map(([id,name],index) => ({id,name,share:index<2 ? 3 : 2,tried:0,released:0,rejected:0,rate:{tried:0,released:0,rejected:0}})),
}
const regression = new URLSearchParams(location.search).has('four')
createRoot(document.getElementById('root')).render(regression
  ? <><GalaxyBackground/><HeroEarth/><LunarOrbits mission/><MissionControl connection={{snapshot:fixture,status:'live',error:'',rogue:false,setRogue:() => {},retry:() => {}}} onSetup={() => {}}/></>
  : <Preview/>)
