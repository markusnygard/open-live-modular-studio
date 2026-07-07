import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { devtools } from 'zustand/middleware'

export type ExecutionState = 'idle' | 'running' | 'error' | 'stalled'

interface PipelineState {
  stromJson: string
  parseError: string | null
  executionState: ExecutionState
  uptimeSeconds: number
}

interface PipelineActions {
  setStromJson: (json: string) => void
  setExecutionState: (state: ExecutionState) => void
  tickUptime: () => void
  resetUptime: () => void
}

export const usePipelineStore = create<PipelineState & PipelineActions>()(
  devtools(
    immer((set) => ({
      stromJson: '',
      parseError: null,
      executionState: 'idle',
      uptimeSeconds: 0,

      setStromJson: (json) =>
        set((state) => {
          state.stromJson = json
          try {
            JSON.parse(json)
            state.parseError = null
          } catch (e) {
            state.parseError = e instanceof Error ? e.message : 'Invalid JSON'
          }
        }),

      setExecutionState: (executionState) =>
        set((state) => {
          state.executionState = executionState
        }),

      tickUptime: () =>
        set((state) => {
          if (state.executionState === 'running') state.uptimeSeconds++
        }),

      resetUptime: () =>
        set((state) => {
          state.uptimeSeconds = 0
        }),
    })),
    { name: 'pipeline', enabled: import.meta.env.DEV },
  ),
)
