import { MODULES } from '@/studio/ModuleRegistry'
import type { StudioModule } from '@/studio/types'
import { EfpStreamModule } from './EfpStreamModule'

const efpStream: StudioModule = {
  id: 'efpStream',
  slot: 'bottom',
  label: 'EFP Stream',
  icon: '🛰️',
  defaultVisible: false,
  supportsPopout: false,
  component: EfpStreamModule,
  minWidth: 150,
}

if (!MODULES.some((m) => m.id === efpStream.id)) {
  MODULES.push(efpStream)
}
