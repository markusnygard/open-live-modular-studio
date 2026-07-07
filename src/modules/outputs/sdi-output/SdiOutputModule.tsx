import type { SendFn } from '@/studio/types'
import { OutputModule } from '../OutputModule'

export function SdiOutputModule({ productionId }: { send: SendFn; productionId: string | null }) {
  return <OutputModule productionId={productionId} kind="sdi" />
}
