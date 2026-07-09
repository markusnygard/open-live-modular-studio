import { AudioModule } from './AudioModule'
import type { SendFn } from '@/studio/types'

/**
 * Standalone pop-up variant: keeps audio strips at the same fixed size as the
 * inline module. Scrollbar appears when strips overflow. Settings remain below.
 */
export function AudioStandalone({ send, productionId }: { send: SendFn; productionId: string | null }) {
  return (
    <div className="h-screen overflow-y-auto bg-[#0b0f14]">
      <AudioModule send={send} productionId={productionId} />
    </div>
  )
}
