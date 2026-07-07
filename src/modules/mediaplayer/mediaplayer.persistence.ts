import { request } from '@/shared/api'

const MODULE_KEY = 'module_mediaplayer'

interface SavedMediaPlayer {
  playlists: Record<string, string[]>
}

async function patchValues(productionId: string, key: string, value: string) {
  // Read existing values first to avoid wiping them out with a replacement PATCH
  const prod = await request<{ values?: Record<string, string | number | boolean> }>(
    `/api/v1/productions/${productionId}`,
  ).catch(() => ({ values: {} as Record<string, string | number | boolean> }))
  const merged = { ...(prod.values ?? {}), [key]: value }
  await request(`/api/v1/productions/${productionId}`, {
    method: 'PATCH',
    body: JSON.stringify({ values: merged }),
  }).catch(() => {})
}

export async function saveMediaPlayerState(productionId: string) {
  const { useMediaPlayerStore } = await import('@/modules/mediaplayer/mediaplayer.store')
  const { playlists } = useMediaPlayerStore.getState()
  await patchValues(productionId, MODULE_KEY, JSON.stringify({ playlists } as SavedMediaPlayer))
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
