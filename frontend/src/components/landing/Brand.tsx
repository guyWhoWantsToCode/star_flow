import { useMissionNavigation } from '../../mission/navigation'
export function OrbitLogo() {
  return (
    <svg viewBox="0 0 36 36" fill="none" aria-hidden="true">
      <path d="M29 9C33 12 27 21 18 26S2 29 4 24M7 19C10 14 16 9 22 7s10-1 10 2" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <path d="M18 9c0 6-3 9-9 9 6 0 9 3 9 9 0-6 3-9 9-9-6 0-9-3-9-9Z" fill="currentColor" />
      <circle cx="29" cy="9" r="2" fill="currentColor" />
    </svg>
  )
}
export function Brand() { return <a className="brand" href="/" aria-label="StarFlow home"><OrbitLogo/><span>StarFlow</span></a> }
export function LaunchButton({ compact = false }: { compact?: boolean }) { const launch = useMissionNavigation(); return <a className={`button ${compact ? 'button-small' : ''}`} href="/setup" onClick={launch}>Launch Mission <span aria-hidden="true">{compact ? '↗' : '→'}</span></a> }
