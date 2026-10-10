import LandingPage from './components/landing/LandingPage'
import Dashboard from './pages/Dashboard'
import GalaxyBackground from './components/landing/GalaxyBackground'
import './App.css'

export default function App() {
  return (
    <>
      <GalaxyBackground />
      {window.location.pathname.replace(/\/$/, '') === '/dashboard'
        ? <Dashboard />
        : <LandingPage />}
    </>
  )
}
