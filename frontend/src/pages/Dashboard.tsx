import { Brand, OrbitLogo } from '../components/landing/Brand'
export default function Dashboard() {
  return <div className="dashboard-placeholder container"><header><Brand/><a className="text-link" href="/">← Back to overview</a></header><main><OrbitLogo/><p className="eyebrow">StarFlow / Mission Control</p><h1>Your mission<br/>starts here.</h1><p>Mission Control is coming next. This is a placeholder for the dashboard where you’ll choose AI services and simulate shared API traffic.</p><a className="button" href="/">Return to StarFlow <span aria-hidden="true">→</span></a></main></div>
}
