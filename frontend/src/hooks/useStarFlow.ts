import { useEffect, useState } from 'react'
import { parseSnapshot, readSnapshot, socketUrl, type Snapshot, type Connection } from '../services/starflowApi'

export function useStarFlow(enabled: boolean) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [status, setStatus] = useState<Connection>('offline')
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    let socket: WebSocket | null = null
    let retryTimer = 0
    let lastMessage = 0
    let failures = 0
    let connectingSince = Date.now()
    let snapshotPending = false
    const abort = new AbortController()
    async function syncSnapshot() {
      if (cancelled || snapshotPending || (socket?.readyState === WebSocket.OPEN && lastMessage)) return
      snapshotPending = true
      const requestedAt = Date.now()
      try {
        const data = await readSnapshot(AbortSignal.any([abort.signal, AbortSignal.timeout(5000)]))
        if (!cancelled && lastMessage <= requestedAt) {
          setSnapshot(data); setStatus('live'); setError('')
        }
      } catch {
        if (!cancelled && socket?.readyState !== WebSocket.OPEN) {
          setStatus('offline'); setError('Cannot reach the backend snapshot. Last received values are retained and marked stale.')
        }
      } finally { snapshotPending = false }
    }
    function connect() {
      if (cancelled) return
      connectingSince = Date.now()
      lastMessage = 0
      setStatus(failures ? 'reconnecting' : 'connecting')
      if (!failures) setError('')
      try { socket = new WebSocket(socketUrl()) }
      catch (failure) {
        setStatus('offline')
        setError(`Cannot open the secure backend connection: ${failure instanceof Error ? failure.message : 'WebSocket initialization failed'}`)
        return
      }
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

    }
    connect()
    void syncSnapshot()
    const snapshotPoll = window.setInterval(() => { void syncSnapshot() }, 2000)
    const monitor = window.setInterval(() => {
      if (socket?.readyState === WebSocket.OPEN && lastMessage && Date.now() - lastMessage > 2500) setStatus('data delayed')
      if (socket && ((lastMessage && Date.now() - lastMessage > 7000) || (!lastMessage && Date.now() - connectingSince > 7000))) socket.close()
    }, 500)
    return () => {
      cancelled = true
      abort.abort()
      clearTimeout(retryTimer)
      clearInterval(monitor)
      clearInterval(snapshotPoll)
      if (socket) { socket.onclose = null; socket.onmessage = null; socket.onerror = null; socket.close() }
    }
  }, [enabled, attempt])
  return { snapshot, status, error, retry: () => setAttempt(value => value + 1) }
}
