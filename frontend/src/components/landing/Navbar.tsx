import { useState } from 'react'
import { Brand, LaunchButton } from './Brand'
import { links } from './navigation'
export default function Navbar() {
  const [open, setOpen] = useState(false)
  return <header className="navbar"><div className="container nav-inner"><Brand/><nav className={open ? 'nav-links is-open' : 'nav-links'} aria-label="Main navigation">{links.map(([label, id]) => <a key={id} href={`/#${id}`} onClick={() => setOpen(false)}>{label}</a>)}</nav><div className="nav-actions"><LaunchButton compact/><button className="menu-button" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen(!open)}><span/><span/></button></div></div>{open && <nav id="mobile-navigation" className="mobile-nav" aria-label="Mobile navigation">{links.map(([label, id]) => <a key={id} href={`/#${id}`} onClick={() => setOpen(false)}>{label}</a>)}</nav>}</header>
}
