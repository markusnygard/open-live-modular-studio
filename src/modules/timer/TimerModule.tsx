import { useEffect } from 'react'
import type { SendFn } from '@/studio/types'
import { eventBus } from '@/shared/event-bus'
import { useTimerStore } from './timer.store'

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0')
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0')
  const s = String(totalSeconds % 60).padStart(2, '0')
  return `${h}:${m}:${s}`
}

export function TimerModule({}: { send: SendFn; productionId: string | null }) {
  const elapsedMs = useTimerStore(s => s.elapsedMs)
  const setRunning = useTimerStore(s => s.setRunning)
  const reset = useTimerStore(s => s.reset)

  useEffect(() => {
    const offActivated = eventBus.on('PRODUCTION_ACTIVATED', () => setRunning(true))
    const offDeactivated = eventBus.on('PRODUCTION_DEACTIVATED', () => reset())
    return () => {
      offActivated()
      offDeactivated()
    }
  }, [setRunning, reset])

  return (
    <div className="bg-zinc-900 rounded border border-zinc-700 px-2 py-1">
      <span className="text-green-400 text-sm font-mono">{formatElapsed(elapsedMs)}</span>
    </div>
  )
}
