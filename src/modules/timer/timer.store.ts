import { create } from 'zustand'

interface TimerState {
  running: boolean
  elapsedMs: number
  setRunning: (running: boolean) => void
  setElapsedMs: (elapsedMs: number) => void
  reset: () => void
}

export const useTimerStore = create<TimerState>((set) => ({
  running: false,
  elapsedMs: 0,
  setRunning: (running) => set({ running }),
  setElapsedMs: (elapsedMs) => set({ elapsedMs }),
  reset: () => set({ running: false, elapsedMs: 0 }),
}))
