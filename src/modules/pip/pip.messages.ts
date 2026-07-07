import { useEffect } from 'react'
import { useWs } from '@/studio/WsProvider'
import type { PipConfig } from '@/shared/types'
import { usePipStore } from './pip.store'

/**
 * Registers the inbound PIP_STATE WebSocket handler for the PiP module against
 * the shared connection provided by {@link useWs}. Syncs server-authoritative
 * Picture-in-Picture layer configuration (pgm/pvw selection + per-layer zones)
 * into the pip store. Ported from the PIP section of the legacy `useControllerWs`
 * inbound handler.
 */
export function usePipMessages(): void {
  const { onMessage } = useWs()

  useEffect(() => {
    const a = usePipStore.getState()
    const offs: Array<() => void> = []

    offs.push(onMessage('PIP_STATE', (msg: Record<string, unknown>) => {
      a.applyPipState(
        typeof msg['pgmPip'] === 'number' ? (msg['pgmPip'] as number) : null,
        typeof msg['pvwPip'] === 'number' ? (msg['pvwPip'] as number) : null,
        Array.isArray(msg['pips']) ? (msg['pips'] as PipConfig[]) : [],
      )
    }))

    return () => { offs.forEach((off) => off()) }
  }, [onMessage])
}
