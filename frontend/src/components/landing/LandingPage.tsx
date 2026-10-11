import { memo } from 'react'
import Navbar from './Navbar'
import HeroSection from './HeroSection'
import SystemVisualization from './SystemVisualization'
import Footer from './Footer'
function LandingPage() { return <><a className="skip-link" href="#main">Skip to content</a><Navbar/><main id="main"><HeroSection/><SystemVisualization/></main><Footer/></> }

export default memo(LandingPage)
