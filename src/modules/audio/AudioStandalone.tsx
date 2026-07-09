import { AudioModule } from './AudioModule'
import type { SendFn } from '@/studio/types'

export function AudioStandalone({ send, productionId }: { send: SendFn; productionId: string | null }) {
  return (
    <div className="bg-[#0b0f14]">
      <AudioModule send={send} productionId={productionId} />
    </div>
  )
}