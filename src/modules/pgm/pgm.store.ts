import { create } from 'zustand'

interface PgmState {
  whepUrl: string | null
  connected: boolean
  fullscreen: boolean
  setWhepUrl: (url: string | null) => void
  setConnected: (connected: boolean) => void
  setFullscreen: (fullscreen: boolean) => void
}

export const usePgmStore = create<PgmState>((set) => ({
  whepUrl: null,
  connected: false,
  fullscreen: false,
  setWhepUrl: (whepUrl) => set({ whepUrl }),
  setConnected: (connected) => set({ connected }),
  setFullscreen: (fullscreen) => set({ fullscreen }),
}))
