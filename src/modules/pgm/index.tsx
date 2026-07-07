import { MODULES } from '@/studio/ModuleRegistry'
import type { StudioModule } from '@/studio/types'
import { PgmModule } from './PgmModule'

import { MonitorIcon } from '@/studio/icons'
// ...existing imports...

const pgm: StudioModule = {
  id: 'pgm',
  slot: 'pgm',
  label: 'PGM',
  icon: <MonitorIcon />,
  defaultVisible: true,
  supportsPopout: true,
  popoutSize: { width: 1920, height: 1080 },
  component: PgmModule,
}

if (!MODULES.some(m => m.id === pgm.id)) {
  MODULES.push(pgm)
}
