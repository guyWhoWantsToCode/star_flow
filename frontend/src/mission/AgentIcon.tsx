import type { AgentId } from '../services/starflowApi'
export function AgentIcon({ id }: { id: AgentId }) {
  return <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {id === 'chatbot' && <><rect x="5" y="9" width="22" height="17" rx="6"/><path d="M16 4v5M2 15v5m28-5v5M12 22h8"/><circle cx="12" cy="16" r="1"/><circle cx="20" cy="16" r="1"/><circle cx="16" cy="3" r="1"/></>}
    {id === 'summarizer' && <><path d="M8 3h11l6 6v20H8V3Z"/><path d="M19 3v7h6M12 15h9m-9 5h9m-9 5h6"/></>}
    {id === 'tagger' && <><path d="m3 17 13-13h12v12L15 29 3 17Z"/><circle cx="22" cy="10" r="2"/></>}
  </svg>
}
