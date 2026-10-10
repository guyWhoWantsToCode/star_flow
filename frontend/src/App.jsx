import LandingPage from './components/landing/LandingPage'
import Dashboard from './pages/Dashboard'
import './App.css'

export default function App() {
  return window.location.pathname.replace(/\/$/, '') === '/dashboard'
    ? <Dashboard />
    : <LandingPage />
}
