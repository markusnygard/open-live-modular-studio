import { useEffect } from 'react'
import type { SendFn } from '@/studio/types'
import { eventBus } from '@/shared/event-bus'
import { usePgmStore } from './pgm.store'

export function PgmModule({ productionId }: { send: SendFn; productionId: string | null }) {
  const connected = usePgmStore(s => s.connected)
  const setConnected = usePgmStore(s => s.setConnected)

  useEffect(() => {
    const offActivated = eventBus.on('PRODUCTION_ACTIVATED', () => setConnected(true))
    const offDeactivated = eventBus.on('PRODUCTION_DEACTIVATED', () => setConnected(false))
    return () => {
      offActivated()
      offDeactivated()
    }
  }, [setConnected])

  return (
    <div className="bg-zinc-900 rounded border border-zinc-700 p-2">
      <span className="text-zinc-400 text-xs">
        PGM {productionId && connected ? '●' : '○'}
      </span>
    </div>
  )
}
