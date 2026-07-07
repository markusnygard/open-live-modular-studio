import { MODULES } from '@/studio/ModuleRegistry'
import type { StudioModule } from '@/studio/types'
import { PipModule } from './PipModule'

const pip: StudioModule = {
  id: 'pip',
  slot: 'bottom',
  label: 'PiP',
  icon: '🖼️',
  defaultVisible: false,
  supportsPopout: true,
  popoutSize: { width: 600, height: 400 },
  component: PipModule,
  minWidth: 400,
}

if (!MODULES.some((m) => m.id === pip.id)) {
  MODULES.push(pip)
}
