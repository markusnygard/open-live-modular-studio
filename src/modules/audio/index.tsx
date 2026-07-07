import { MODULES } from '@/studio/ModuleRegistry'
import type { StudioModule } from '@/studio/types'
import { AudioModule } from './AudioModule'
import { AudioIcon } from '@/studio/icons'

const audio: StudioModule = {
  id: 'audio',
  slot: 'bottom',
  label: 'Audio',
  icon: <AudioIcon />,
  defaultVisible: true,
  supportsPopout: true,
  popoutSize: { width: 900, height: 500 },
  component: AudioModule,
  minWidth: 600,
}

if (!MODULES.some((m) => m.id === audio.id)) {
  MODULES.push(audio)
}
