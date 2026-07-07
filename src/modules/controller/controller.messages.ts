import { useEffect } from 'react'
import { useWs } from '@/studio/WsProvider'
import { useControllerStore } from './controller.store'

/**
 * Registers inbound WebSocket handlers for the controller module against the
 * shared connection provided by {@link useWs}. Syncs server-authoritative
 * vision-mixer state (tally, OVL alpha, DSK visibility, source offsets) into the
 * controller store. Ported from the inbound handler section of the legacy
 * `useControllerWs` hook.
 */
export function useControllerMessages(): void {
  const { onMessage } = useWs()

  const setPgm = useControllerStore((s) => s.setPgm)
  const setPvw = useControllerStore((s) => s.setPvw)
  const setTBarPosition = useControllerStore((s) => s.setTBarPosition)
  const setDskState = useControllerStore((s) => s.setDskState)
  const applySourceOffset = useControllerStore((s) => s.applySourceOffset)
  const applySourceAudioOffset = useControllerStore((s) => s.applySourceAudioOffset)
  const resetSourceOffsets = useControllerStore((s) => s.resetSourceOffsets)
  const setDeactivatedExternally = useControllerStore((s) => s.setDeactivatedExternally)
  const applyPipState = useControllerStore((s) => s.applyPipState)

  useEffect(() => {
    const offs: Array<() => void> = []

    offs.push(onMessage('TALLY', (msg: Record<string, unknown>) => {
      if (typeof msg['pgm'] === 'string' || msg['pgm'] === null) {
        setPgm(msg['pgm'] as string)
      }
      if (typeof msg['pvw'] === 'string' || msg['pvw'] === null) {
        setPvw(msg['pvw'] as string)
      }
    }))

    offs.push(onMessage('OVL_STATE', (msg: Record<string, unknown>) => {
      if (typeof msg['alpha'] === 'number') {
        setTBarPosition(msg['alpha'] as number)
      }
    }))

    offs.push(onMessage('DSK_STATE', (msg: Record<string, unknown>) => {
      if (typeof msg['layer'] === 'number' && typeof msg['visible'] === 'boolean') {
        setDskState(msg['layer'] as number, msg['visible'] as boolean)
      }
    }))

    offs.push(onMessage('SOURCE_OFFSET_STATE', (msg: Record<string, unknown>) => {
      if (typeof msg['mixerInput'] === 'string' && typeof msg['offsetMs'] === 'number') {
        applySourceOffset(msg['mixerInput'] as string, msg['offsetMs'] as number)
      }
    }))

    offs.push(onMessage('SOURCE_AUDIO_OFFSET_STATE', (msg: Record<string, unknown>) => {
      if (typeof msg['mixerInput'] === 'string' && typeof msg['offsetMs'] === 'number') {
        applySourceAudioOffset(msg['mixerInput'] as string, msg['offsetMs'] as number)
      }
    }))

    offs.push(onMessage('PRODUCTION_DEACTIVATED', () => {
      resetSourceOffsets()
      setDeactivatedExternally(true)
    }))

    offs.push(onMessage('PIP_STATE', (msg: Record<string, unknown>) => {
      applyPipState(
        typeof msg['pgmPip'] === 'number' ? (msg['pgmPip'] as number) : null,
        typeof msg['pvwPip'] === 'number' ? (msg['pvwPip'] as number) : null,
        Array.isArray(msg['pips']) ? (msg['pips'] as any[]) : [],
      )
    }))

    return () => { offs.forEach((off) => off()) }
  }, [
    onMessage,
    setPgm,
    setPvw,
    setTBarPosition,
    setDskState,
    applySourceOffset,
    applySourceAudioOffset,
    resetSourceOffsets,
    setDeactivatedExternally,
    applyPipState,
  ])
}
