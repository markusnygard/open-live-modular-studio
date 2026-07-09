import { useRef, useCallback, useEffect } from 'react'
import { cn } from '@/shared/cn'
import type { SendFn } from '@/studio/types'
import { useAudioStore } from '../audio.store'
import { C_AUX, faderToVolume } from '../audio.constants'
import { Fader } from './Fader'
import { VuMeter } from './VuMeter'
import { PeakReadout } from './PeakReadout'

// ── AUX Master strip ──────────────────────────────────────────────────────────
// Fader = overall AUX bus output level; ON/OFF = mute the entire bus.
// Meter element ID "aux1"/"aux2" matches what the meter relay broadcasts.
export function AuxMasterStrip({ auxBus, label, send, onSelect }: {
  auxBus: number
  label: string
  send: SendFn
  onSelect?: () => void
}) {
  const level = useAudioStore((s) => s.auxMasterLevel[auxBus] ?? 1.0)
  const muted = useAudioStore((s) => s.auxMasterMuted[auxBus] ?? false)
  const setMasterLevel = useAudioStore((s) => s.setAuxMasterLevel)
  const setMasterMuted = useAudioStore((s) => s.setAuxMasterMuted)
  const meterId = `aux${auxBus}`

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
    setMasterLevel(auxBus, volume)
    if (throttleRef.current !== null) clearTimeout(throttleRef.current)
    throttleRef.current = setTimeout(() => {
      throttleRef.current = null
      send({ type: 'AUX_MASTER_SET', auxBus, volume, muted: mutedRef.current })
    }, 80)
  }, [auxBus, send, setMasterLevel])

  const handleFaderDoubleClick = useCallback(() => {
    const volume = 1.0
    setMasterLevel(auxBus, volume)
    if (throttleRef.current !== null) clearTimeout(throttleRef.current)
    send({ type: 'AUX_MASTER_SET', auxBus, volume, muted: mutedRef.current })
  }, [auxBus, send, setMasterLevel])

  const handleOnClick = useCallback(() => {
    const next = !muted
    setMasterMuted(auxBus, next)
    send({ type: 'AUX_MASTER_SET', auxBus, volume: level, muted: next })
  }, [muted, level, auxBus, send, setMasterMuted])

  const isActive = !muted
  const STRIP_W = 92

  return (
    <div
      className="flex flex-col shrink-0 select-none border-r border-zinc-800 relative"
      style={{ width: STRIP_W, background: '#0d0d0d' }}
    >
      {/* Channel label header */}
      <div
        className={cn('px-1 py-0.5 text-center border-b border-zinc-900 shrink-0', onSelect && 'cursor-pointer hover:opacity-80')}
        style={{ background: isActive ? C_AUX.active : 'rgba(0,0,0,0.5)', outline: onSelect ? `1px solid ${C_AUX.hex}66` : undefined }}
        onClick={onSelect}
        title={onSelect ? `Open ${label} sends` : undefined}
      >
        <span
          className="text-[9px] font-bold tracking-widest uppercase truncate block"
          style={{ color: isActive ? '#ffffff' : '#52525b' }}
        >
          {label}
        </span>
      </div>

      {/* Main body — meter | fader */}
      <div style={{ display: 'flex', alignItems: 'flex-start', padding: '2px 0 2px 8px', flex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 28, gap: 2, opacity: isActive ? 1 : 0.25, transition: 'opacity 0.2s' }}>
          <VuMeter elementId={meterId} />
          <PeakReadout elementId={meterId} />
        </div>
        <Fader value={level} onChange={handleChange} onMouseDown={handleFaderMouseDown} onDoubleClick={handleFaderDoubleClick} ariaLabel={`${label} master fader`} disabled={muted} />
      </div>

      {/* Bottom */}
      <div className="border-t border-zinc-800 shrink-0 flex overflow-hidden">
        <button
          onClick={handleOnClick}
          title={muted ? 'AUX bus muted — click to unmute' : 'AUX bus active — click to mute'}
          className={cn(
            'flex-1 py-1 text-[9px] font-bold uppercase tracking-widest border-0 transition-colors cursor-pointer active:opacity-75',
            isActive ? 'text-white' : 'bg-zinc-900 text-zinc-500 hover:text-zinc-300',
          )}
          style={isActive ? { background: C_AUX.active } : {}}
        >
          ON
        </button>
      </div>
    </div>
  )
}
