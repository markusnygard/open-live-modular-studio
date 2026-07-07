import { useRef, useCallback, useEffect } from 'react'
import { cn } from '@/shared/cn'
import type { SendFn } from '@/studio/types'
import { useAudioStore } from '../audio.store'
import { C_IN, faderToVolume } from '../audio.constants'
import { Fader } from './Fader'
import { VuMeter } from './VuMeter'
import { PeakReadout } from './PeakReadout'

// ── AUX Channel strip ─────────────────────────────────────────────────────────
// Shown in AUX tabs. Fader = send level for this channel to the AUX bus.
// ON/OFF routes or silences the send without losing the fader position.
export function AuxChannelStrip({ elementId, label, auxBus, send, busPre }: {
  elementId: string
  label: string
  auxBus: number
  send: SendFn
  busPre?: boolean
}) {
  const level = useAudioStore((s) => s.auxSend[elementId]?.[auxBus] ?? 0)
  const enabled = useAudioStore((s) => s.auxSendEnabled[elementId]?.[auxBus] ?? false)
  const pre = useAudioStore((s) => s.auxSendPre[elementId]?.[auxBus] ?? true)
  const setAuxSend = useAudioStore((s) => s.setAuxSend)
  const setAuxEnabled = useAudioStore((s) => s.setAuxSendEnabled)

  const throttleRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const enabledRef = useRef(enabled)
  const preRef = useRef(pre)
  useEffect(() => { enabledRef.current = enabled }, [enabled])
  useEffect(() => { preRef.current = pre }, [pre])

  const handleChange = useCallback((faderPos: number) => {
    const pos = faderPos >= 0.995 ? 1 : faderPos <= 0.005 ? 0 : faderPos
    const newLevel = faderToVolume(pos)
    setAuxSend(elementId, auxBus, newLevel)
    if (throttleRef.current !== null) clearTimeout(throttleRef.current)
    throttleRef.current = setTimeout(() => {
      throttleRef.current = null
      send({ type: 'AUX_SEND_SET', elementId, auxBus, level: newLevel, enabled: enabledRef.current, pre: preRef.current })
    }, 80)
  }, [elementId, auxBus, send, setAuxSend])

  const handleOnClick = useCallback(() => {
    const next = !enabled
    setAuxEnabled(elementId, auxBus, next)
    send({ type: 'AUX_SEND_SET', elementId, auxBus, level, enabled: next, pre })
  }, [enabled, pre, level, elementId, auxBus, send, setAuxEnabled])

  const STRIP_W = 92

  return (
    <div
      className="flex flex-col shrink-0 select-none border-r border-zinc-800"
      style={{ width: STRIP_W, background: '#0d0d0d', opacity: enabled ? 1 : 0.55 }}
    >
      {/* Channel label header — blue tint when send is active */}
      <div
        className="px-1 py-0.5 text-center border-b border-zinc-900 shrink-0"
        style={{ background: enabled ? C_IN.active : 'rgba(0,0,0,0.5)' }}
      >
        <span
          className="text-[9px] font-bold tracking-widest uppercase truncate block"
          style={{ color: enabled ? '#ffffff' : '#52525b' }}
        >
          {label}
        </span>
      </div>

      {/* Main body — meter | fader */}
      <div className="flex flex-1 pb-2">
        <div style={{ display: 'flex', alignItems: 'flex-start', padding: '2px 0 2px 8px', flex: 1 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 28, gap: 2 }}>
            <VuMeter elementId={elementId} />
            <PeakReadout elementId={elementId} />
          </div>
          <Fader
            value={level}
            onChange={handleChange}
            ariaLabel={`${label} AUX ${auxBus} send`}
            prePost={busPre === undefined ? undefined : busPre ? 'PRE' : 'POST'}
          />
        </div>
      </div>

      {/* Bottom — ON button */}
      <div className="border-t border-zinc-800 shrink-0 flex overflow-hidden">
        <button
          onClick={handleOnClick}
          title={enabled ? 'Send active — click to remove from mix' : 'Send silent — click to route to mix'}
          className={cn(
            'flex-1 py-1 text-[9px] font-bold uppercase tracking-widest border-0 transition-colors cursor-pointer active:opacity-75',
            enabled ? 'text-white' : 'bg-zinc-900 text-zinc-500 hover:text-zinc-300',
          )}
          style={enabled ? { background: C_IN.active } : {}}
        >
          ON
        </button>
      </div>
    </div>
  )
}
