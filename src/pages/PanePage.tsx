import { useParams, useSearchParams } from 'react-router'
import { getModuleById } from '@/studio/ModuleRegistry'
import { WsProvider, useWs } from '@/studio/WsProvider'
import { eventBus } from '@/shared/event-bus'
import { useMemo, useEffect } from 'react'

function PaneInner({ moduleId }: { moduleId: string }) {
  const mod = getModuleById(moduleId)
  const { send } = useWs()

  useEffect(() => {
    if (mod?.popoutSize) {
      window.resizeTo(mod.popoutSize.width, mod.popoutSize.height)
    }
  }, [mod])

  if (!mod || !mod.supportsPopout) {
    return <div className="p-4 text-white bg-black h-screen">Unknown module: {moduleId}</div>
  }

  const Component = mod.standaloneComponent ?? mod.component

  return <Component send={send} productionId={null} />
}

export function PanePage() {
  const { moduleId } = useParams<{ moduleId: string }>()
  const [searchParams] = useSearchParams()
  const productionId = searchParams.get('production') || null
  const bus = useMemo(() => eventBus, [])

  if (!moduleId) {
    return <div className="p-4 text-white bg-black h-screen">No module specified</div>
  }

  return (
    <WsProvider productionId={productionId} eventBus={bus}>
      <PaneInner moduleId={moduleId} />
    </WsProvider>
  )
}
