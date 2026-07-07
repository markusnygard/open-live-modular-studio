import type { StudioModule } from './types'

export const MODULES: StudioModule[] = []

export function getModulesForSlot(slot: string): StudioModule[] {
  return MODULES.filter(m => m.slot === slot)
}

export function getModuleById(id: string): StudioModule | undefined {
  return MODULES.find(m => m.id === id)
}
