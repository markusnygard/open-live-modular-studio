import { MODULES } from '@/studio/ModuleRegistry'
import { useWs } from '@/studio/WsProvider'

/** True for any registered module that represents a production output. */
function isOutputModule(id: string): boolean {
  return id.startsWith('srt') || id.startsWith('efp') || id === 'recording' || id.startsWith('ndi') || id.startsWith('sdi')
}

/**
 * Compact row aggregating every registered output module. Renders each output
 * module's component side by side so streaming/recording/NDI/SDI status is
 * visible in a single strip.
 */
export function OutputStatusBar() {
  const { send, productionId } = useWs()
  const outputModules = MODULES.filter((m) => m.slot === 'bottom' && isOutputModule(m.id))

  return (
    <div className="flex items-stretch gap-1">
      {outputModules.map((m) => {
        const Component = m.component
        return <Component key={m.id} send={send} productionId={productionId} />
      })}
    </div>
  )
}
