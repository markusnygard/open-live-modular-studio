import { MODULES } from '@/studio/ModuleRegistry'
import type { StudioModule } from '@/studio/types'
import { NdiOutputModule } from './NdiOutputModule'

const ndiOutput: StudioModule = {
  id: 'ndiOutput',
  slot: 'bottom',
  label: 'NDI Output',
  icon: '🌐',
  defaultVisible: false,
  supportsPopout: false,
  component: NdiOutputModule,
  minWidth: 150,
}

if (!MODULES.some((m) => m.id === ndiOutput.id)) {
  MODULES.push(ndiOutput)
}
