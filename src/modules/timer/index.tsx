import { MODULES } from '@/studio/ModuleRegistry'
import type { StudioModule } from '@/studio/types'
import { TimerModule } from './TimerModule'

const timer: StudioModule = {
  id: 'timer',
  slot: 'bottom',
  label: 'Timer',
  icon: '⏱️',
  defaultVisible: true,
  supportsPopout: true,
  popoutSize: { width: 480, height: 160 },
  component: TimerModule,
}

if (!MODULES.some(m => m.id === timer.id)) {
  MODULES.push(timer)
}
