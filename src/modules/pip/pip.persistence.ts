import { request } from '@/shared/api'

const MODULE_KEY = 'module_pip'

interface SavedPip {
  pips: unknown[]
}

export async function savePipState(productionId: string) {
  const { usePipStore } = await import('@/modules/pip/pip.store')
  const { pips } = usePipStore.getState()

  const data: SavedPip = { pips }
  await request(`/api/v1/productions/${productionId}`, {
    method: 'PATCH',
    body: JSON.stringify({ values: { [MODULE_KEY]: JSON.stringify(data) } }),
  }).catch(() => {})
}

export async function loadPipState(productionId: string) {
  try {
    const prod = await request<{ values?: Record<string, string | number | boolean> }>(
      `/api/v1/productions/${productionId}`,
    )
    const raw = prod.values?.[MODULE_KEY]
    if (!raw || typeof raw !== 'string') return

    const data: SavedPip = JSON.parse(raw)
    if (!data.pips || !Array.isArray(data.pips)) return

    const { usePipStore } = await import('@/modules/pip/pip.store')
    usePipStore.getState().applyPipState(null, null, data.pips as any)
  } catch {
    // ignore
  }
}
