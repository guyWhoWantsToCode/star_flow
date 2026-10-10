import type { CSSProperties } from 'react'
import type { AgentId } from '../services/starflowApi'
export const agents = [
  { id: 'chatbot', name: 'Chatbot', color: '#27d9f5', description: 'Handles conversational requests and user questions.' },
  { id: 'summarizer', name: 'Summarizer', color: '#b47aff', description: 'Processes text and produces concise summaries.' },
  { id: 'tagger', name: 'Tagger', color: '#3997ff', description: 'Classifies content and assigns relevant labels.' },
] as const
export function agentColor(id: AgentId) { return agents.find(agent => agent.id === id)?.color ?? '#80c4e9' }
export function agentStyle(id: AgentId): CSSProperties { return { '--agent-color': agentColor(id) } as CSSProperties }
