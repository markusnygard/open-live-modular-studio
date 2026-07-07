import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { devtools } from 'zustand/middleware'
import type { VideoEffect } from '@/shared/types'

interface LooksState {
  /** Whether the GPU FX backend is available (from server FX_STATE message). */
  fxAvailable: boolean
  /** Per-input video effects: input index → VideoEffect. */
  inputEffects: Record<number, VideoEffect>
  /** Master output video effect. */
  masterEffect: VideoEffect
}

interface LooksActions {
  /** Server-authoritative FX state setter — called by the WS handler on FX_STATE. */
  applyFxState: (fxAvailable: boolean, inputEffects: VideoEffect[], masterEffect: VideoEffect) => void
  /** Clear all FX state — called on production change. */
  reset: () => void
}

export const useLooksStore = create<LooksState & LooksActions>()(
  devtools(
    immer((set) => ({
      fxAvailable: false,
      inputEffects: {},
      masterEffect: { type: 'none' as const },

      applyFxState: (fxAvailable, inputEffects, masterEffect) =>
        set((s) => {
          s.fxAvailable = fxAvailable
          const map: Record<number, VideoEffect> = {}
          inputEffects.forEach((e, i) => { map[i] = e })
          s.inputEffects = map
          s.masterEffect = masterEffect
        }),

      reset: () =>
        set((s) => {
          s.fxAvailable = false
          s.inputEffects = {}
          s.masterEffect = { type: 'none' }
        }),
    })),
    { name: 'looks', enabled: import.meta.env.DEV },
  ),
)
