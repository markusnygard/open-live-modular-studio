import { useProductionStore } from '@/store/production.store'
import { useProductionsStore } from '@/store/productions.store'

export type TallyState = 'pgm' | 'pvw' | 'off'

/**
 * Returns the tally state for a given source ID.
 * Maps the source to all its mixer inputs, then checks if any of those
 * inputs are currently on PGM or PVW. Handles the case where the same
 * source is assigned to multiple mixer inputs correctly.
 */
export function useTallyLight(sourceId: string): TallyState {
  const pgmInput = useProductionStore((s) => s.pgmInput)
  const pvwInput = useProductionStore((s) => s.pvwInput)
  const activeProductionId = useProductionStore((s) => s.activeProductionId)
  const production = useProductionsStore((s) => s.productions.find((p) => p.id === activeProductionId))

  const myInputs = (production?.sources ?? [])
    .filter((a) => a.sourceId === sourceId)
    .map((a) => a.mixerInput)

  if (pgmInput && myInputs.includes(pgmInput)) return 'pgm'
  if (pvwInput && myInputs.includes(pvwInput)) return 'pvw'
  return 'off'
}
