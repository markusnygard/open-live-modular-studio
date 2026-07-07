import { MODULES } from '@/studio/ModuleRegistry'
import type { StudioModule } from '@/studio/types'
import { LooksModule } from './LooksModule'
import { LooksIcon } from '@/studio/icons'

const looks: StudioModule = {
  id: 'looks',
  slot: 'bottom',
  label: 'Looks',
  icon: <LooksIcon />,
  defaultVisible: false,
  supportsPopout: true,
  popoutSize: { width: 600, height: 400 },
  component: LooksModule,
}

if (!MODULES.some((m) => m.id === looks.id)) {
  MODULES.push(looks)
}
