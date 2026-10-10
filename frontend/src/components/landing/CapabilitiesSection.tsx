type VisualType = 'allocation' | 'sharing' | 'queue'
const capabilities: [string, string, string, VisualType][] = [
  ['Guaranteed Access', 'Every AI service receives a protected share of available API capacity, preventing one service from taking everything.', 'Protected shares', 'allocation'],
  ['Dynamic Capacity Sharing', 'When a service doesn’t use its allocated capacity, StarFlow makes that capacity available to services that need it.', 'Capacity, put to work', 'sharing'],
  ['Overload Protection', 'Excess requests wait in dedicated queues. When a queue reaches its limit, new requests are rejected to keep the system stable.', 'Bounded queues', 'queue'],
]
function CapabilityVisual({ type }: { type: VisualType }) {
  if (type === 'queue') return <div className="mini-visual queue-visual" aria-hidden="true"><div className="queue-slots">{[0,1,2,3].map(i => <span key={i}/>)}</div><div className="queue-limit"/><span className="rejected">×</span><span className="mini-label">QUEUE LIMIT</span></div>
  return <div className={`mini-visual ${type}`} aria-hidden="true"><div className="allocation-bars">{[0,1,2,3].map(i => <div key={i}><span/><span/><span/><span/></div>)}</div>{type === 'sharing' && <span className="transfer-arrow">⤴</span>}<span className="mini-label">{type === 'sharing' ? 'UNUSED → AVAILABLE' : 'A SHARE FOR EVERY SERVICE'}</span></div>
}
export default function CapabilitiesSection() {
  return <section className="section container capabilities" id="capabilities"><div className="section-heading"><p className="section-index">02 <span>CORE CAPABILITIES</span></p><h2>Built for shared capacity.<br/>Designed for fairness.</h2></div><div className="capability-grid">{capabilities.map(([title, description, caption, type],i) => <article className="capability-card" key={title}><div className="card-top"><span>0{i+1}</span><span>{caption}</span></div><CapabilityVisual type={type}/><h3>{title}</h3><p>{description}</p></article>)}</div></section>
}
