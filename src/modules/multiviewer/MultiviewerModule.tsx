import { useEffect } from 'react'
import type { SendFn } from '@/studio/types'
import { eventBus } from '@/shared/event-bus'
import { useMultiviewerStore } from './multiviewer.store'

export function MultiviewerModule({ productionId }: { send: SendFn; productionId: string | null }) {
  const connected = useMultiviewerStore(s => s.connected)
  const setConnected = useMultiviewerStore(s => s.setConnected)

  useEffect(() => {
    const offActivated = eventBus.on('PRODUCTION_ACTIVATED', () => setConnected(true))
    const offDeactivated = eventBus.on('PRODUCTION_DEACTIVATED', () => setConnected(false))
    return () => {
      offActivated()
      offDeactivated()
    }
  }, [setConnected])

  return (
    <div className="bg-zinc-900 rounded border border-zinc-700 p-4 w-full h-full flex items-center justify-center">
      <span className="text-zinc-400 text-sm">
        Multiviewer {productionId && connected ? '●' : '○'}
      </span>
    </div>
  )
}
