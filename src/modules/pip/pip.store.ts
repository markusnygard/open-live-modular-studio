import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { devtools } from 'zustand/middleware'
import type { PipConfig } from '@/shared/types'

interface PipState {
  /** Index of the PiP layer currently on programme, or null. */
  pgmPip: number | null
  /** Index of the PiP layer currently on preview, or null. */
  pvwPip: number | null
  /** Configuration for each PiP layer in the active flow. */
  pips: PipConfig[]
}

interface PipActions {
  /** Server-authoritative PiP state setter — called by the WS handler on PIP_STATE. */
  applyPipState: (pgmPip: number | null, pvwPip: number | null, pips: PipConfig[]) => void
  /** Update a single PiP layer's configuration (optimistic local echo). */
  applyPipConfig: (pipIdx: number, config: PipConfig) => void
  setPvwPip: (pip: number | null) => void
  /** Clear all PiP state — called on production change. */
  reset: () => void
}

export const usePipStore = create<PipState & PipActions>()(
  devtools(
    immer((set) => ({
      pgmPip: null,
      pvwPip: null,
      pips: [],

      applyPipState: (pgmPip, pvwPip, pips) =>
        set((s) => {
          s.pgmPip = pgmPip
          s.pvwPip = pvwPip
          // Normalise incoming pips to always have transforms (older Strom omits it).
          s.pips = pips.map((p) => ({ ...p, transforms: p.transforms ?? {} }))
        }),

      applyPipConfig: (pipIdx, config) =>
        set((s) => {
          s.pips[pipIdx] = { ...config, transforms: config.transforms ?? {} }
        }),

      setPvwPip: (pip) =>
        set((s) => {
          s.pvwPip = pip
        }),

      reset: () =>
        set((s) => {
          s.pgmPip = null
          s.pvwPip = null
          s.pips = []
        }),
    })),
    { name: 'pip', enabled: import.meta.env.DEV },
  ),
)
