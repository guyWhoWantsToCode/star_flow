import { Brand } from './Brand'
import { links } from './navigation'
export default function Footer() { return <footer className="container footer"><div className="footer-main"><div><Brand/><p>Fair access for every AI agent.</p></div><nav aria-label="Footer navigation">{links.map(([label,id]) => <a key={id} href={`/#${id}`}>{label}</a>)}</nav></div><div className="footer-bottom"><span>© 2026 StarFlow</span><span>Built around balance.</span></div></footer> }
