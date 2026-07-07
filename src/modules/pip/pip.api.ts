import type { PipConfig } from '@/shared/types'

const STROM_URL = `http://${window.location.hostname}:8080`

async function stromGet<T>(path: string): Promise<T> {
  const res = await fetch(`${STROM_URL}${path}`, {
    headers: { 'Authorization': 'Bearer dev-key-local' },
  })
  if (!res.ok) throw new Error(`Strom API ${res.status}`)
  return res.json()
}

/**
 * Fetch PiP state from Strom's vision mixer for every configured PiP layer.
 * Called when the production is activated to populate the PiP store.
 * Uses the direct Strom URL (port 8080) since PiP data lives in Strom, not the backend.
 */
export async function fetchPipState(
  flowId: string,
  mixerBlockId: string,
  numPips: number,
): Promise<PipConfig[]> {
  const pips: PipConfig[] = []
  for (let i = 0; i < numPips; i++) {
    try {
      const state = await stromGet<PipConfig>(
        `/api/flows/${flowId}/blocks/${mixerBlockId}/pip/${i}`,
      )
      pips.push(state)
    } catch {
      pips.push({ bg: null, zones: [], transforms: {} })
    }
  }
  return pips
}

/**
 * Get the vision mixer block ID from the Strom flow.
 */
export async function fetchMixerBlockId(flowId: string): Promise<string | null> {
  try {
    const flow = await stromGet<{ blocks?: Array<{ id: string; block_definition_id: string }> }>(
      `/api/flows/${flowId}`,
    )
    const mixer = flow.blocks?.find(b => b.block_definition_id === 'builtin.vision_mixer')
    return mixer?.id ?? null
  } catch {
    return null
  }
}
