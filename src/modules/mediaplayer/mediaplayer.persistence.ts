import { request } from '@/shared/api'

const MODULE_KEY = 'module_mediaplayer'

interface SavedMediaPlayer {
  playlists: Record<string, string[]>
}

/**
 * Persist mediaplayer playlists to the production document in CouchDB.
 * Called when the user clicks the save icon in the module header.
 */
export async function saveMediaPlayerState(productionId: string) {
  const { useMediaPlayerStore } = await import('@/modules/mediaplayer/mediaplayer.store')
  const { playlists } = useMediaPlayerStore.getState()

  const data: SavedMediaPlayer = { playlists }
  await request(`/api/v1/productions/${productionId}`, {
    method: 'PATCH',
    body: JSON.stringify({ values: { [MODULE_KEY]: JSON.stringify(data) } }),
  }).catch(() => {})
}

/**
 * Load persisted mediaplayer playlists from the production document.
 * Called when a production is activated.
 */
export async function loadMediaPlayerState(productionId: string) {
  try {
    const prod = await request<{ values?: Record<string, string | number | boolean> }>(
      `/api/v1/productions/${productionId}`,
    )
    const raw = prod.values?.[MODULE_KEY]
    if (!raw || typeof raw !== 'string') return

    const data: SavedMediaPlayer = JSON.parse(raw)
    if (!data.playlists) return

    const { useMediaPlayerStore } = await import('@/modules/mediaplayer/mediaplayer.store')
    const store = useMediaPlayerStore.getState()

    for (const [sourceId, files] of Object.entries(data.playlists)) {
      if (Array.isArray(files)) {
        store.setPlaylist(sourceId, files)
      }
    }
  } catch {
    // no saved state or parse error — ignore
  }
}
