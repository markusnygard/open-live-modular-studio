import { MODULES } from '@/studio/ModuleRegistry'
import type { StudioModule } from '@/studio/types'
import { MultiviewerModule } from './MultiviewerModule'

const multiviewer: StudioModule = {
  id: 'multiviewer',
  slot: 'top',
  label: 'Multiviewer',
  icon: '📺',
  defaultVisible: true,
  supportsPopout: true,
  popoutSize: { width: 1920, height: 1080 },
  component: MultiviewerModule,
}

if (!MODULES.some(m => m.id === multiviewer.id)) {
  MODULES.push(multiviewer)
}
