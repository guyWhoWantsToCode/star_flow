export function OrbitLogo() {
  return <svg viewBox="0 0 36 36" fill="none" aria-hidden="true"><ellipse cx="18" cy="18" rx="16" ry="6" transform="rotate(-35 18 18)" stroke="currentColor" strokeWidth="1.4"/><ellipse cx="18" cy="18" rx="12" ry="6" transform="rotate(45 18 18)" stroke="currentColor" strokeWidth="1.4"/><circle cx="18" cy="18" r="3" fill="currentColor"/></svg>
}
export function Brand() { return <a className="brand" href="/" aria-label="StarFlow home"><OrbitLogo/><span>StarFlow</span></a> }
export function LaunchButton({ compact = false }: { compact?: boolean }) { return <a className={`button ${compact ? 'button-small' : ''}`} href="/dashboard">Launch Mission <span aria-hidden="true">{compact ? '↗' : '→'}</span></a> }
