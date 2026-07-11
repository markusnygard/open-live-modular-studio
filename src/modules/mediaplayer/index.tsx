import { MODULES } from '@/studio/ModuleRegistry'
import type { StudioModule } from '@/studio/types'
import { MediaPlayerModule } from './MediaPlayerModule'
import { MediaPlayerPopup } from './MediaPlayerPopup'
import { MediaPlayerIcon } from '@/studio/icons'

const mediaplayer: StudioModule = {
  id: 'mediaplayer',
  slot: 'bottom',
  label: 'Media Player',
  icon: <MediaPlayerIcon />,
  defaultVisible: false,
  supportsPopout: true,
  popoutSize: { width: 480, height: 640 },
  component: MediaPlayerModule,
  standaloneComponent: MediaPlayerPopup as any,
  minWidth: 360,
}

if (!MODULES.some((m) => m.id === mediaplayer.id)) {
  MODULES.push(mediaplayer)
}
