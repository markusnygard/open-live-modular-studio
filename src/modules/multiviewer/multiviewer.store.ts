import { create } from 'zustand'

interface MultiviewerState {
  whepUrl: string | null
  connected: boolean
  muted: boolean
  setWhepUrl: (url: string | null) => void
  setConnected: (connected: boolean) => void
  setMuted: (muted: boolean) => void
}

export const useMultiviewerStore = create<MultiviewerState>((set) => ({
  whepUrl: null,
  connected: false,
  muted: true,
  setWhepUrl: (whepUrl) => set({ whepUrl }),
  setConnected: (connected) => set({ connected }),
  setMuted: (muted) => set({ muted }),
}))
