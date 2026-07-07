import { MODULES } from '@/studio/ModuleRegistry'
import type { StudioModule } from '@/studio/types'

const TestModule: StudioModule = {
  id: 'test',
  slot: 'top',
  label: 'Test',
  icon: '🧪',
  defaultVisible: true,
  supportsPopout: false,
  component: () => <div className="text-white p-4">Test Module Works</div>,
}

if (!MODULES.some(m => m.id === TestModule.id)) {
  MODULES.push(TestModule)
}
