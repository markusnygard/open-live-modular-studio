import { useEffect } from 'react'
import { useWs } from '@/studio/WsProvider'
import { useAudioStore } from './audio.store'

/**
 * Registers inbound WebSocket handlers for the audio module against the shared
 * connection provided by {@link useWs}. Syncs server-authoritative mixer state
 * (levels, mutes, AFV/PFL/AFL, aux/group sends and masters, monitor, dynamics)
 * plus the high-rate meter and loudness streams into the audio store.
 *
 * Ported from the audio section of the legacy `useControllerWs` inbound handler.
 */
export function useAudioMessages(): void {
  const { onMessage } = useWs()

  useEffect(() => {
    const a = useAudioStore.getState()
    const offs: Array<() => void> = []

    offs.push(onMessage('AUDIO_STATE', (msg: Record<string, unknown>) => {
      if (typeof msg['elementId'] === 'string') {
        if (msg['property'] === 'volume' && typeof msg['value'] === 'number') {
          a.applyLevel(msg['elementId'] as string, msg['value'] as number)
        } else if (msg['property'] === 'mute' && typeof msg['value'] === 'boolean') {
          a.applyMuted(msg['elementId'] as string, msg['value'] as boolean)
        }
      }
    }))

    offs.push(onMessage('AFV_STATE', (msg: Record<string, unknown>) => {
      if (typeof msg['mixerInput'] === 'string' && typeof msg['enabled'] === 'boolean') {
        a.applyAfvByMixerInput(msg['mixerInput'] as string, msg['enabled'] as boolean)
      }
    }))

    offs.push(onMessage('PFL_STATE', (msg: Record<string, unknown>) => {
      if (typeof msg['elementId'] === 'string' && typeof msg['enabled'] === 'boolean') {
        a.applyPfl(msg['elementId'] as string, msg['enabled'] as boolean)
      }
    }))

    offs.push(onMessage('AFL_STATE', (msg: Record<string, unknown>) => {
      if (typeof msg['elementId'] === 'string' && typeof msg['enabled'] === 'boolean') {
        a.applyAfl(msg['elementId'] as string, msg['enabled'] as boolean)
      }
    }))

    offs.push(onMessage('AUDIO_DYNAMICS_STATE', (msg: Record<string, unknown>) => {
      if (typeof msg['channel'] === 'number' && typeof msg['property'] === 'string') {
        a.applyDynamics(msg['channel'] as number, msg['property'] as string, msg['value'] as number | boolean)
      }
    }))

    offs.push(onMessage('AUX_SEND_STATE', (msg: Record<string, unknown>) => {
      if (typeof msg['elementId'] === 'string' && typeof msg['auxBus'] === 'number' && typeof msg['level'] === 'number' && typeof msg['enabled'] === 'boolean') {
        a.applyAuxSend(msg['elementId'] as string, msg['auxBus'] as number, msg['level'] as number, msg['enabled'] as boolean)
        if (typeof msg['pre'] === 'boolean') {
          a.applyAuxSendPre(msg['elementId'] as string, msg['auxBus'] as number, msg['pre'] as boolean)
        }
      }
    }))

    offs.push(onMessage('AUX_MASTER_STATE', (msg: Record<string, unknown>) => {
      if (typeof msg['auxBus'] === 'number' && typeof msg['volume'] === 'number' && typeof msg['muted'] === 'boolean') {
        a.applyAuxMaster(msg['auxBus'] as number, msg['volume'] as number, msg['muted'] as boolean)
      }
    }))

    offs.push(onMessage('GRP_STATE_RESET', () => {
      a.resetGrpState()
    }))

    offs.push(onMessage('GRP_SEND_STATE', (msg: Record<string, unknown>) => {
      if (typeof msg['elementId'] === 'string' && typeof msg['grpBus'] === 'number' && typeof msg['level'] === 'number' && typeof msg['enabled'] === 'boolean') {
        a.applyGrpSend(msg['elementId'] as string, msg['grpBus'] as number, msg['level'] as number, msg['enabled'] as boolean)
      }
    }))

    offs.push(onMessage('GRP_MASTER_STATE', (msg: Record<string, unknown>) => {
      if (typeof msg['grpBus'] === 'number' && typeof msg['volume'] === 'number' && typeof msg['muted'] === 'boolean') {
        a.applyGrpMaster(msg['grpBus'] as number, msg['volume'] as number, msg['muted'] as boolean)
      }
    }))

    offs.push(onMessage('MONITOR_STATE', (msg: Record<string, unknown>) => {
      if (typeof msg['volume'] === 'number' && typeof msg['muted'] === 'boolean') {
        a.applyMonitorMaster(msg['volume'] as number, msg['muted'] as boolean)
      }
    }))

    offs.push(onMessage('METER_DATA', (msg: Record<string, unknown>) => {
      if (typeof msg['elementId'] === 'string' && Array.isArray(msg['peak']) && Array.isArray(msg['rms'])) {
        a.applyMeter(msg['elementId'] as string, msg['peak'] as number[], msg['rms'] as number[])
      }
    }))

    offs.push(onMessage('LOUDNESS_DATA', (msg: Record<string, unknown>) => {
      if (typeof msg['elementId'] === 'string' && typeof msg['momentary'] === 'number') {
        a.applyLoudness(
          msg['elementId'] as string,
          msg['momentary'] as number,
          typeof msg['shortterm'] === 'number' ? (msg['shortterm'] as number) : null,
          typeof msg['integrated'] === 'number' ? (msg['integrated'] as number) : null,
          Array.isArray(msg['true_peak']) ? (msg['true_peak'] as number[]) : [],
        )
      }
    }))

    return () => { offs.forEach((off) => off()) }
  }, [onMessage])
}
