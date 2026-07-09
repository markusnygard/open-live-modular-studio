import { MODULES } from '@/studio/ModuleRegistry'
import type { StudioModule } from '@/studio/types'
import { ControllerModule } from './ControllerModule'
import { ControllerStandalone } from './ControllerStandalone'
import { ControllerIcon } from '@/studio/icons'

const controller: StudioModule = {
  id: 'controller',
  slot: 'bottom',
  label: 'Controller',
  icon: <ControllerIcon />,
  defaultVisible: true,
  supportsPopout: true,
  popoutSize: { width: 800, height: 500 },
  component: ControllerModule,
  standaloneComponent: ControllerStandalone,
  minWidth: 400,
}

if (!MODULES.some(m => m.id === controller.id)) {
  MODULES.push(controller)
}
