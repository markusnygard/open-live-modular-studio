import { useParams } from 'react-router'
import { getModuleById } from '@/studio/ModuleRegistry'
import { WsProvider } from '@/studio/WsProvider'
import { eventBus } from '@/shared/event-bus'
import { useMemo, useEffect } from 'react'

export function PanePage({ productionId }: { productionId: string | null }) {
  const { moduleId } = useParams<{ moduleId: string }>()
  const bus = useMemo(() => eventBus, [])
  const mod = moduleId ? getModuleById(moduleId) : undefined

  useEffect(() => {
    if (mod?.popoutSize) {
      window.resizeTo(mod.popoutSize.width, mod.popoutSize.height)
    }
  }, [mod])

  if (!mod || !mod.supportsPopout) {
    return <div className="p-4 text-white bg-black h-screen">Unknown module: {moduleId}</div>
  }

  const Component = mod.standaloneComponent ?? mod.component

  return (
    <WsProvider productionId={productionId} eventBus={bus}>
      <Component send={() => {}} productionId={productionId} />
    </WsProvider>
  )
}
