import { useEffect } from 'react'
import { useWs } from '@/studio/WsProvider'
import type { VideoEffect } from '@/shared/types'
import { useLooksStore } from './looks.store'

/**
 * Registers the inbound FX_STATE WebSocket handler for the Looks module against
 * the shared connection provided by {@link useWs}. Syncs the server-authoritative
 * GPU shader-effect state (availability, per-input effects, master effect) into
 * the looks store. Ported from the FX section of the legacy `useControllerWs`
 * inbound handler.
 */
export function useLooksMessages(): void {
  const { onMessage } = useWs()

  useEffect(() => {
    const a = useLooksStore.getState()
    const offs: Array<() => void> = []

    offs.push(onMessage('FX_STATE', (msg: Record<string, unknown>) => {
      if (
        typeof msg['fxAvailable'] === 'boolean' &&
        Array.isArray(msg['inputEffects']) &&
        msg['masterEffect'] !== null &&
        typeof msg['masterEffect'] === 'object'
      ) {
        a.applyFxState(
          msg['fxAvailable'] as boolean,
          msg['inputEffects'] as VideoEffect[],
          msg['masterEffect'] as VideoEffect,
        )
      }
    }))

    return () => { offs.forEach((off) => off()) }
  }, [onMessage])
}
