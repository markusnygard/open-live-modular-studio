import { useState } from 'react'
import { WsProvider } from './WsProvider'
import { SlotLayout } from './SlotLayout'
import { ModuleToggleBar } from './ModuleToggleBar'
import { eventBus } from '@/shared/event-bus'
import '@/modules/multiviewer'
import '@/modules/pgm'
import '@/modules/timer'
import '@/modules/controller'
import '@/modules/audio'

export function StudioShell({ productionId: initialProductionId }: { productionId: string | null }) {
  const [productionId, setProductionId] = useState<string | null>(initialProductionId)

  return (
    <WsProvider productionId={productionId} eventBus={eventBus}>
      <div className="h-screen w-screen bg-black flex flex-col overflow-hidden">
        {/* Header bar */}
        <ModuleToggleBar productionId={productionId} onSelectProduction={setProductionId} />

        {/* Top row: multiviewer + pgm */}
        <div className="flex-1 flex min-h-0">
          <SlotLayout slot="top" />
          <SlotLayout slot="pgm" />
        </div>

        {/* Bottom row */}
        <SlotLayout slot="bottom" />
      </div>
    </WsProvider>
  )
}
