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

function Preview() {
  const connection = useStarFlow(true)
  return <><GalaxyBackground/><HeroEarth/><LunarOrbits mission/>{connection.snapshot
    ? <MissionControl connection={connection} onSetup={() => {}}/>
    : <p>Waiting for the real backend snapshot: {connection.status} {connection.error}</p>}</>
}
createRoot(document.getElementById('root')).render(<Preview/>)
