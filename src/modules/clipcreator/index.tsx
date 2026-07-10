import { MODULES } from '@/studio/ModuleRegistry'
import type { StudioModule } from '@/studio/types'
import { ClipCreator } from './ClipCreator'

const clipcreator: StudioModule = {
  id: 'clipcreator',
  slot: 'bottom',
  label: 'Clip Creator',
  icon: '✂️',
  defaultVisible: false,
  component: () => null, // standalone only via popout
  standaloneComponent: ClipCreator as any,
  supportsPopout: true,
  popoutSize: { width: 960, height: 640 },
  minWidth: 480,
}

if (!MODULES.some(m => m.id === clipcreator.id)) {
  MODULES.push(clipcreator)
}
