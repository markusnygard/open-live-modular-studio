import { useEffect } from 'react'
import { WsProvider } from './WsProvider'
import { SlotLayout } from './SlotLayout'
import { ModuleToggleBar } from './ModuleToggleBar'
import { eventBus } from '@/shared/event-bus'
import { useProductionsStore } from '@/studio/productions.store'
import '@/modules/multiviewer'
import '@/modules/pgm'
import '@/modules/timer'
import '@/modules/controller'
import '@/modules/audio'
import '@/modules/looks'
import '@/modules/pip'
import '@/modules/mediaplayer'
import '@/modules/outputs/srt-stream'
import '@/modules/outputs/efp-stream'
import '@/modules/outputs/recording'
import '@/modules/outputs/ndi-output'
import '@/modules/outputs/sdi-output'

export function StudioShell({ productionId }: { productionId: string | null }) {
  const { productions, activeId, fetch, setActive } = useProductionsStore()

  useEffect(() => { fetch() }, [fetch])

  useEffect(() => {
    if (productionId && productionId !== activeId) {
      setActive(productionId)
      eventBus.emit('PRODUCTION_ACTIVATED', { productionId })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productionId])

  const handleSelect = (id: string | null) => {
    setActive(id)
    if (id) eventBus.emit('PRODUCTION_ACTIVATED', { productionId: id })
    else eventBus.emit('PRODUCTION_DEACTIVATED', undefined)
  }

  return (
    <WsProvider productionId={activeId} eventBus={eventBus}>
      <div className="h-screen w-screen bg-black flex flex-col overflow-hidden">
        {/* Header bar */}
        <ModuleToggleBar
          productions={productions}
          productionId={activeId}
          onSelectProduction={handleSelect}
        />

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
