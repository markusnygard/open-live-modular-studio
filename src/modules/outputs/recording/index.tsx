import { MODULES } from '@/studio/ModuleRegistry'
import type { StudioModule } from '@/studio/types'
import { RecordingModule } from './RecordingModule'

const recording: StudioModule = {
  id: 'recording',
  slot: 'bottom',
  label: 'Recording',
  icon: '⏺️',
  defaultVisible: false,
  supportsPopout: false,
  component: RecordingModule,
  minWidth: 150,
}

if (!MODULES.some((m) => m.id === recording.id)) {
  MODULES.push(recording)
}
