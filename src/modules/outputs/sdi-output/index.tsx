import { MODULES } from '@/studio/ModuleRegistry'
import type { StudioModule } from '@/studio/types'
import { SdiOutputModule } from './SdiOutputModule'

const sdiOutput: StudioModule = {
  id: 'sdiOutput',
  slot: 'bottom',
  label: 'SDI Output',
  icon: '🎞️',
  defaultVisible: false,
  supportsPopout: false,
  component: SdiOutputModule,
  minWidth: 150,
}

if (!MODULES.some((m) => m.id === sdiOutput.id)) {
  MODULES.push(sdiOutput)
}
