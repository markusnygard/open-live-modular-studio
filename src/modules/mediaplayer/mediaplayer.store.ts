import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { devtools } from 'zustand/middleware'

export interface PlayerState {
  state: 'playing' | 'paused' | 'stopped'
  positionMs: number
  durationMs: number
  currentFileIndex: number
  loopPlaylist: boolean
}

export const DEFAULT_PLAYER_STATE: PlayerState = {
  state: 'stopped',
  positionMs: 0,
  durationMs: 0,
  currentFileIndex: 0,
  loopPlaylist: false,
}

interface MediaPlayerState {
  /** sourceId → ordered clip file list. */
  playlists: Record<string, string[]>
  /** sourceId → polled transport state. */
  playerStates: Record<string, PlayerState>
  /** sourceId → loop button state (mirrors playerState.loopPlaylist, live in Strom). */
  loopOn: Record<string, boolean>
}

interface MediaPlayerActions {
  setPlaylist: (sourceId: string, files: string[]) => void
  /** Initialise a source's playlist only if not already present. */
  initPlaylist: (sourceId: string, files: string[]) => void
  setPlayerState: (sourceId: string, state: PlayerState) => void
  setLoop: (sourceId: string, on: boolean) => void
}

export const useMediaPlayerStore = create<MediaPlayerState & MediaPlayerActions>()(
  devtools(
    immer((set, get) => ({
      playlists: {},
      playerStates: {},
      loopOn: {},

      setPlaylist: (sourceId, files) =>
        set((s) => {
          s.playlists[sourceId] = files
        }),

      initPlaylist: (sourceId, files) => {
        if (get().playlists[sourceId] === undefined) {
          set((s) => {
            s.playlists[sourceId] = files
          })
        }
      },

      setPlayerState: (sourceId, state) =>
        set((s) => {
          s.playerStates[sourceId] = state
        }),

      setLoop: (sourceId, on) =>
        set((s) => {
          s.loopOn[sourceId] = on
        }),
    })),
    { name: 'mediaplayer', enabled: import.meta.env.DEV },
  ),
)
