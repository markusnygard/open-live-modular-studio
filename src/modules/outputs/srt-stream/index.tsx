import { MODULES } from '@/studio/ModuleRegistry'
import type { StudioModule } from '@/studio/types'
import { SrtStreamModule } from './SrtStreamModule'

const srtStream: StudioModule = {
  id: 'srtStream',
  slot: 'bottom',
  label: 'SRT Stream',
  icon: '📡',
  defaultVisible: false,
  supportsPopout: false,
  component: SrtStreamModule,
  minWidth: 150,
}

if (!MODULES.some((m) => m.id === srtStream.id)) {
  MODULES.push(srtStream)
}
