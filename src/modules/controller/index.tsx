import { MODULES } from '@/studio/ModuleRegistry'
import type { StudioModule } from '@/studio/types'
import { ControllerModule } from './ControllerModule'
import { ControllerIcon } from '@/studio/icons'

const controller: StudioModule = {
  id: 'controller',
  slot: 'bottom',
  label: 'Controller',
  icon: <ControllerIcon />,
  defaultVisible: true,
  supportsPopout: true,
  popoutSize: { width: 800, height: 392 },
  component: ControllerModule,
  minWidth: 400,
}

if (!MODULES.some(m => m.id === controller.id)) {
  MODULES.push(controller)
}
