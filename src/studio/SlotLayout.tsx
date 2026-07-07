import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { getModulesForSlot } from './ModuleRegistry'
import { useWs } from './WsProvider'
import { eventBus } from '@/shared/event-bus'
import type { StudioModule } from './types'

const VISIBILITY_EVENT = 'ol-module-visibility-changed'

export function isModuleVisible(module: StudioModule): boolean {
  if (typeof localStorage === 'undefined') return module.defaultVisible
  const stored = localStorage.getItem(`ol-module-${module.id}-visible`)
  return stored !== null ? stored === 'true' : module.defaultVisible
}

export function setModuleVisible(id: string, visible: boolean): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(`ol-module-${id}-visible`, String(visible))
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(VISIBILITY_EVENT))
  }
}

/** Subscribe to visibility changes so slots and toggles re-render in sync. */
export function useVisibilityVersion(): number {
  const [version, setVersion] = useState(0)
  useEffect(() => {
    const handler = () => setVersion(v => v + 1)
    window.addEventListener(VISIBILITY_EVENT, handler)
    return () => window.removeEventListener(VISIBILITY_EVENT, handler)
  }, [])
  return version
}

function ModuleRenderer({ module }: { module: StudioModule }) {
  const { send, productionId } = useWs()
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (module.onRegister) {
      cleanupRef.current = module.onRegister({ send, eventBus, productionId })
    }
    return () => {
      cleanupRef.current?.()
      cleanupRef.current = null
    }
  }, [module, send, productionId])

  const Component = module.component
  return (
    <div
      className="flex-1 min-w-0 h-full overflow-hidden"
      style={{ minWidth: module.minWidth, maxWidth: module.maxWidth }}
    >
      <Component send={send} productionId={productionId} />
    </div>
  )
}

export function SlotLayout({ slot }: { slot: 'top' | 'pgm' | 'bottom' }) {
  useVisibilityVersion()

  const modules = getModulesForSlot(slot)
  const visibleModules = modules.filter(isModuleVisible)

  const style: CSSProperties = slot === 'bottom'
    ? { height: 392, overflow: 'auto' }
    : { flex: 1, minHeight: 0 }

  return (
    <div style={style} className="flex gap-1">
      {visibleModules.map(m => (
        <ModuleRenderer key={m.id} module={m} />
      ))}
    </div>
  )
}
