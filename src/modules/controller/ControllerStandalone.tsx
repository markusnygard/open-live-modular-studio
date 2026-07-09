import { ControllerModule } from './ControllerModule'
import type { SendFn } from '@/studio/types'

/**
 * Standalone pop-up variant: keeps PGM/PVW buses at top, moves transition
 * and DSK below to avoid covering the source rows. Scrollbar if needed.
 */
export function ControllerStandalone({ send, productionId }: { send: SendFn; productionId: string | null }) {
  return (
    <div className="h-screen overflow-y-auto bg-[#0b0f14]">
      <ControllerModule send={send} productionId={productionId} />
    </div>
  )
}
