import type { SendFn } from '@/studio/types'
import { OutputModule } from '../OutputModule'

export function RecordingModule({ productionId }: { send: SendFn; productionId: string | null }) {
  return <OutputModule productionId={productionId} kind="recording" />
}
