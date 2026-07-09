import { useRef, useCallback, useEffect } from 'react'
import { cn } from '@/shared/cn'
import type { SendFn } from '@/studio/types'
import { useAudioStore } from '../audio.store'
import { C_MON, faderToVolume } from '../audio.constants'
import { Fader } from './Fader'
import { VuMeter } from './VuMeter'
import { PeakReadout } from './PeakReadout'

// ── Monitor Master strip ──────────────────────────────────────────────────────
// Controls the operator's local listening level on monitor_out.
// Zero effect on the programme mix — purely a local monitoring control.
export function MonitorMasterStrip({ send }: { send: SendFn }) {
  const level = useAudioStore((s) => s.monitorLevel)
  const muted = useAudioStore((s) => s.monitorMuted)
  const setLevel = useAudioStore((s) => s.setMonitorLevel)
  const setMuted = useAudioStore((s) => s.setMonitorMuted)

  const throttleRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mutedRef = useRef(muted)
  useEffect(() => { mutedRef.current = muted }, [muted])

  const handleFaderMouseDown = useCallback(() => {
    document.body.classList.add('fader-dragging')
    const onUp = () => {
      document.body.classList.remove('fader-dragging')
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mouseup', onUp)
  }, [])

  const handleChange = useCallback((faderPos: number) => {
    const pos = faderPos >= 0.995 ? 1 : faderPos <= 0.005 ? 0 : faderPos
    const volume = faderToVolume(pos)
    setLevel(volume)
    if (throttleRef.current !== null) clearTimeout(throttleRef.current)
    throttleRef.current = setTimeout(() => {
      throttleRef.current = null
      send({ type: 'MONITOR_SET', volume, muted: mutedRef.current })
    }, 80)
  }, [send, setLevel])

  const handleFaderDoubleClick = useCallback(() => {
    const volume = 1.0
    setLevel(volume)
    if (throttleRef.current !== null) clearTimeout(throttleRef.current)
    send({ type: 'MONITOR_SET', volume, muted: mutedRef.current })
  }, [send, setLevel])

  const handleOnClick = useCallback(() => {
    const next = !muted
    setMuted(next)
    send({ type: 'MONITOR_SET', volume: level, muted: next })
  }, [muted, level, send, setMuted])

  const isActive = !muted
  const STRIP_W = 92

  return (
    <div
      className="flex flex-col shrink-0 select-none border-r border-zinc-800 relative"
      style={{ width: STRIP_W, background: '#0d0d0d' }}
    >
      <div
        className="px-1 py-0.5 text-center border-b border-zinc-900 shrink-0"
        style={{ background: isActive ? C_MON.active : 'rgba(0,0,0,0.5)' }}
      >
        <span
          className="text-[9px] font-bold tracking-widest uppercase truncate block"
          style={{ color: isActive ? '#ffffff' : '#52525b' }}
        >
          MON
        </span>
      </div>

      {/* VU meter — awaiting monitor_out metering support from Strom (meter:monitor element). */}
      <div style={{ display: 'flex', alignItems: 'flex-start', padding: '2px 0 2px 8px', flex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 28, gap: 2, opacity: isActive ? 1 : 0.25, transition: 'opacity 0.2s' }}>
          <VuMeter elementId="monitor" numChannels={2} />
          <PeakReadout elementId="monitor" />
        </div>
        <Fader value={level} onChange={handleChange} onMouseDown={handleFaderMouseDown} onDoubleClick={handleFaderDoubleClick} ariaLabel="Monitor master fader" disabled={muted} />
      </div>

      <div className="border-t border-zinc-800 shrink-0 flex overflow-hidden">
        <button
          onClick={handleOnClick}
          title={muted ? 'Monitor muted — click to unmute' : 'Monitor active — click to mute'}
          className={cn(
            'flex-1 py-1 text-[9px] font-bold uppercase tracking-widest border-0 transition-colors cursor-pointer active:opacity-75',
            isActive ? 'text-white' : 'bg-zinc-900 text-zinc-500 hover:text-zinc-300',
          )}
          style={isActive ? { background: C_MON.active } : {}}
        >
          ON
        </button>
      </div>
    </div>
  )
}
