import { useMissionNavigation } from '../../mission/navigation'
import { useState } from 'react'
import { Brand } from './Brand'
import { links } from './navigation'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const launch = useMissionNavigation()
  return (
    <header className="navbar">
      <div className="container nav-inner">
        <div className="nav-identity"><Brand /><span className="nav-descriptor">API traffic control</span></div>
        <nav className="nav-links" aria-label="Main navigation">
          {links.map(([label, id]) => <a key={id} href={`/#${id}`}>{label}</a>)}
        </nav>
        <div className="nav-actions">
          <a className="mission-link" href="/setup" onClick={launch}>
            <span>Launch Mission</span>
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M5 15 15 5M5 5h10v10" stroke="currentColor" strokeWidth="1.3" /></svg>
          </a>
          <button className="menu-button" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen(!open)}><span /><span /></button>
        </div>
      </div>
      {open && <nav id="mobile-navigation" className="mobile-nav" aria-label="Mobile navigation">{links.map(([label, id]) => <a key={id} href={`/#${id}`} onClick={() => setOpen(false)}>{label}</a>)}</nav>}
    </header>
  )
}
