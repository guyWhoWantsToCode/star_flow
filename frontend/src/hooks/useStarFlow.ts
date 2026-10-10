import { useEffect, useState } from 'react'
import { parseSnapshot, readRogue, socketUrl, type Snapshot, type Connection } from '../services/starflowApi'

export function useStarFlow(enabled: boolean) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [status, setStatus] = useState<Connection>('offline')
  const [error, setError] = useState('')
  const [rogue, setRogue] = useState<boolean | null>(null)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    let socket: WebSocket | null = null
    let retryTimer = 0
    let lastMessage = 0
    let failures = 0
    let connectingSince = Date.now()
    let roguePending = false
    const abort = new AbortController()
    async function syncRogue() {
      if (roguePending || cancelled) return
      roguePending = true
      try { const value = await readRogue(AbortSignal.any([abort.signal, AbortSignal.timeout(5000)])); if (!cancelled) setRogue(value) }
      catch { if (!cancelled) setRogue(null) }
      finally { roguePending = false }
    }
    function connect() {
      if (cancelled) return
      connectingSince = Date.now()
      lastMessage = 0
      setStatus(failures ? 'reconnecting' : 'connecting')
      if (!failures) setError('')
      socket = new WebSocket(socketUrl())
      socket.onmessage = event => {
        try {
          const data = parseSnapshot(JSON.parse(event.data))
          setSnapshot(data)
          lastMessage = Date.now()
          failures = 0
          setStatus('live')
          setError('')
        } catch {
          setStatus('contract error')
          setError('The backend snapshot does not match the supported scheduler contract.')
          if (socket) socket.onclose = null
          socket?.close()
        }
      }
      socket.onerror = () => { if (!cancelled) setError('Cannot reach Mission Control. Check network access to the configured backend.') }
      socket.onclose = () => {
        if (cancelled) return
        failures++
        setStatus(failures > 5 ? 'offline' : 'reconnecting')
        setError('Backend connection lost. Last received values are retained and marked stale.')
        if (failures <= 5) retryTimer = window.setTimeout(connect, Math.min(1000 * 2 ** (failures - 1), 12000))
      }
      void syncRogue()
    }
    connect()
    const monitor = window.setInterval(() => {
      if (socket?.readyState === WebSocket.OPEN && lastMessage && Date.now() - lastMessage > 2500) setStatus('data delayed')
      if (socket && ((lastMessage && Date.now() - lastMessage > 7000) || (!lastMessage && Date.now() - connectingSince > 7000))) socket.close()
    }, 500)
    const roguePoll = window.setInterval(() => { void syncRogue() }, 2000)
    return () => {
      cancelled = true
      abort.abort()
      clearTimeout(retryTimer)
      clearInterval(monitor)
      clearInterval(roguePoll)
      if (socket) { socket.onclose = null; socket.onmessage = null; socket.onerror = null; socket.close() }
    }
  }, [enabled, attempt])
  return { snapshot, status, error, rogue, setRogue, retry: () => setAttempt(value => value + 1) }
}
