import { useRef, useCallback, useState } from 'react'
import { cn } from '@/shared/cn'
import type { SendFn } from '@/studio/types'
import { useAudioStore } from '../audio.store'
import {
  type BusColor,
  C_MAIN, C_GRP,
  EMPTY_RECORD,
  TP_THRESHOLD,
  faderToVolume,
} from '../audio.constants'
import { Fader, useFaderDims } from './Fader'
import { VuMeter } from './VuMeter'
import { PeakReadout } from './PeakReadout'
import { EbuColumn } from './EbuMeter'
import { ProcessingPopup } from './ProcessingPopup'

// ── Channel strip ─────────────────────────────────────────────────────────────
// fader + meter + peak + ON/AFV/PFL/AFL + group assign + H/G/C/E buttons + pan.
export function ChannelStrip({
  elementId,
  label,
  send,
  showAfv = false,
  showPfl = false,
  showAfl = false,
  showEbu = false,
  mixerInput = null,
  isPgm = false,
  isPvw = false,
  busColor = C_MAIN,
  grpBuses = [],
  chNum = 0,
}: {
  elementId: string
  label: string
  send: SendFn
  showAfv?: boolean
  showPfl?: boolean
  showAfl?: boolean
  /** Show EBU R128 meter column — only meaningful when LoudnessData flows for this elementId (i.e. MAIN bus) */
  showEbu?: boolean
  mixerInput?: string | null
  isPgm?: boolean
  isPvw?: boolean
  busColor?: BusColor
  /** Group buses to show assign buttons for (e.g. [1, 2]) */
  grpBuses?: number[]
  /** Channel number (1-indexed) for dynamics processing */
  chNum?: number
}) {
  const level = useAudioStore((s) => s.levels[elementId] ?? 1.0)
  const muted = useAudioStore((s) => s.muted[elementId] ?? false)
  const afv = useAudioStore((s) => s.afv[elementId] ?? false)
  const pfl = useAudioStore((s) => s.pfl[elementId] ?? false)
  const afl = useAudioStore((s) => s.afl[elementId] ?? false)
  const setLevel = useAudioStore((s) => s.setLevel)
  const applyMuted = useAudioStore((s) => s.applyMuted)
  const toggleAfv = useAudioStore((s) => s.toggleAfv)
  const applyPfl = useAudioStore((s) => s.applyPfl)
  const applyAfl = useAudioStore((s) => s.applyAfl)
  const grpSendEnabled = useAudioStore((s) => s.grpSendEnabled[elementId] ?? EMPTY_RECORD)
  const setGrpEnabled = useAudioStore((s) => s.setGrpSendEnabled)
  const truePeak = useAudioStore((s) => (showEbu ? s.meters[elementId]?.true_peak : undefined))
  const tpLatch = showEbu && (truePeak?.length ?? 0) > 0 && truePeak!.some((tp) => tp > TP_THRESHOLD)
  const handleLoudnessReset = useCallback(() => { send({ type: 'LOUDNESS_RESET' }) }, [send])
  const dynamics = useAudioStore((s) => s.dynamics)
  const [showProcessing, setShowProcessing] = useState(false)

  const key = (prop: string) => dynamics[`ch${chNum}_${prop}`]
  const hpfOn = (key('hpf_enabled') as boolean) ?? false
  const gateOn = (key('gate_enabled') as boolean) ?? false
  const compOn = (key('comp_enabled') as boolean) ?? false
  const eqOn = (key('eq_enabled') as boolean) ?? false
  const panVal = (key('pan') as number) ?? 0

  // Derived 3-state mode: afv wins if set, otherwise on/off from mute flag
  const mode: 'off' | 'on' | 'afv' = afv ? 'afv' : muted ? 'off' : 'on'

  const handleFaderMouseDown = useCallback(() => {
    if (mode === 'off') return
    document.body.classList.add('fader-dragging')
    const onUp = () => {
      document.body.classList.remove('fader-dragging')
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mouseup', onUp)
  }, [mode])

  const throttleRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleChange = useCallback((faderPos: number) => {
    const pos = faderPos >= 0.995 ? 1 : faderPos <= 0.005 ? 0 : faderPos
    const volume = faderToVolume(pos)
    setLevel(elementId, volume)
    if (throttleRef.current !== null) clearTimeout(throttleRef.current)
    throttleRef.current = setTimeout(() => {
      throttleRef.current = null
      send({ type: 'AUDIO_SET', elementId, property: 'volume', value: volume })
    }, 80)
  }, [elementId, send, setLevel])

  /**
   * ON button — toggles the channel routing mute.
   * If in AFV mode, disables AFV and returns to ON.
   *
   * Muting targets to_main_vol_N (routing layer), never volume_N, so the
   * fader position is always 100% user-owned and never moved by this button.
   * Strom provides a 10ms anti-click ramp on mute transitions automatically.
   */
  const handleOnClick = useCallback(() => {
    if (mode === 'on') {
      applyMuted(elementId, true)
      send({ type: 'AUDIO_SET', elementId, property: 'mute', value: true })
    } else if (mode === 'off') {
      applyMuted(elementId, false)
      send({ type: 'AUDIO_SET', elementId, property: 'mute', value: false })
    } else {
      // AFV → ON: disable routing follow and explicitly open the routing layer.
      toggleAfv(elementId)
      send({ type: 'AUDIO_SET', elementId, property: 'mute', value: false })
      if (mixerInput !== null) {
        send({ type: 'AFV_SET', mixerInput, enabled: false })
      }
    }
  }, [mode, elementId, mixerInput, send, applyMuted, toggleAfv])

  /**
   * AFV button — enables audio-follows-video routing.
   * Disabling AFV returns to OFF (muted) so the operator must explicitly re-enable.
   */
  const handleAfvClick = useCallback(() => {
    if (mode === 'afv') {
      // AFV → OFF: mute routing and disable AFV.
      toggleAfv(elementId)
      applyMuted(elementId, true)
      send({ type: 'AUDIO_SET', elementId, property: 'mute', value: true })
      if (mixerInput !== null) {
        send({ type: 'AFV_SET', mixerInput, enabled: false })
      }
    } else {
      // ON or OFF → AFV: just enable AFV. The AFV_SET handler on the backend
      // immediately applies the correct routing based on current PGM tally.
      toggleAfv(elementId)
      applyMuted(elementId, false) // local store only — keeps mode='afv' if AFV later disabled via ON
      if (mixerInput !== null) {
        send({ type: 'AFV_SET', mixerInput, enabled: true })
      }
    }
  }, [mode, elementId, mixerInput, send, applyMuted, toggleAfv])

  const handlePflClick = useCallback(() => {
    const next = !pfl
    applyPfl(elementId, next)
    send({ type: 'PFL_SET', elementId, enabled: next, volume: level })
    // Mutually exclusive per strip — enabling PFL cancels AFL on same channel
    if (next && afl) {
      applyAfl(elementId, false)
      send({ type: 'AFL_SET', elementId, enabled: false })
    }
  }, [pfl, afl, elementId, level, send, applyPfl, applyAfl])

  const handleAflClick = useCallback(() => {
    const next = !afl
    applyAfl(elementId, next)
    send({ type: 'AFL_SET', elementId, enabled: next })
    // Mutually exclusive per strip — enabling AFL cancels PFL on same channel
    if (next && pfl) {
      applyPfl(elementId, false)
      send({ type: 'PFL_SET', elementId, enabled: false })
    }
  }, [afl, pfl, elementId, send, applyAfl, applyPfl])

  // Left button column is only rendered when there are groups or PFL/AFL buttons.
  const hasLeftButtons = grpBuses.length > 0 || showPfl || showAfl
  const STRIP_W = showEbu
    ? (hasLeftButtons ? 145 : 124)
    : (hasLeftButtons ? 111 : 92)

  // A strip is "active" — contributing audio to the main mix — when:
  //   • mode is ON (manual, always routes to main), OR
  //   • mode is AFV AND the source is on PGM (routing layer is open)
  const isActive = mode === 'on' || (mode === 'afv' && isPgm)
  void isPvw

  return (
    <div
      className="flex flex-col shrink-0 select-none border-r border-zinc-800 relative"
      style={{ width: STRIP_W, background: '#0d0d0d' }}
    >
      {/* Channel label header */}
      <div
        className="px-1 py-0.5 text-center border-b border-zinc-900 shrink-0"
        style={{ background: isActive ? busColor.active : 'rgba(0,0,0,0.5)' }}
      >
        <span
          className="text-[9px] font-bold tracking-widest uppercase truncate block"
          style={{ color: isActive ? '#ffffff' : '#52525b' }}
        >
          {label}
        </span>
      </div>

      {/* H/G/C/E buttons — toggle processing sections, click to open detail popup */}
      {chNum > 0 && (
        <div className="flex gap-[1px] justify-center py-0.5 bg-[#0a0a0a]">
          {([['H', hpfOn, '#a855f7'], ['G', gateOn, '#22c55e'], ['C', compOn, '#f97316'], ['E', eqOn, '#3b82f6']] as [string, boolean, string][]).map(([letter, active, color]) => (
            <button key={letter} type="button"
              className="border-0 cursor-pointer rounded-sm w-3.5 h-3.5 flex items-center justify-center text-[7px] font-bold"
              style={{ background: active ? color : '#27272a', color: active ? '#fff' : '#52525b' }}
              onClick={(e) => { e.stopPropagation(); setShowProcessing(true) }}
              title={`${letter === 'H' ? 'High-Pass Filter' : letter === 'G' ? 'Gate' : letter === 'C' ? 'Compressor' : 'EQ'}${active ? ' (active)' : ''}`}
            >{letter}</button>
          ))}
        </div>
      )}

      {/* Main body */}
      <div className="flex flex-1 pb-2">

        {/* Left side buttons — G1/G2 + PFL/AFL stacked vertically */}
        {(grpBuses.length > 0 || showPfl || showAfl) && (
          <div className="flex flex-col shrink-0 justify-center" style={{ width: 28, padding: '0 0 0 7px', gap: 8 }}>
            {grpBuses.map((bus) => {
              const assigned = grpSendEnabled[bus] ?? false
              return (
                <button
                  key={bus}
                  onClick={() => {
                    const next = !assigned
                    setGrpEnabled(elementId, bus, next)
                    send({ type: 'GRP_SEND_SET', elementId, grpBus: bus, level: 1, enabled: next })
                  }}
                  title={assigned ? `Remove from Group ${bus}` : `Add to Group ${bus}`}
                  className="border-0 cursor-pointer transition-colors active:opacity-75 flex items-center justify-center shrink-0"
                  style={{ background: assigned ? C_GRP.active : '#27272a', borderRadius: 2, width: '100%', height: 22 }}
                >
                  <span style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.05em', color: assigned ? '#fff' : '#52525b', textTransform: 'uppercase' }}>G{bus}</span>
                </button>
              )
            })}
            {showPfl && (
              <button
                onClick={handlePflClick}
                title={pfl ? 'PFL active — click to cancel' : 'PFL — pre-fader listen on MON'}
                className="border-0 cursor-pointer transition-colors active:opacity-75 flex items-center justify-center shrink-0"
                style={{ background: pfl ? '#ca8a04' : '#27272a', borderRadius: 2, width: '100%', height: 22 }}
              >
                <span style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.05em', color: pfl ? '#fff' : '#52525b', textTransform: 'uppercase' }}>PFL</span>
              </button>
            )}
            {showAfl && (
              <button
                onClick={handleAflClick}
                title={afl ? 'AFL active — click to cancel' : 'AFL — post-fader listen on MON'}
                className="border-0 cursor-pointer transition-colors active:opacity-75 flex items-center justify-center shrink-0"
                style={{ background: afl ? '#ca8a04' : '#27272a', borderRadius: 2, width: '100%', height: 22 }}
              >
                <span style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.05em', color: afl ? '#fff' : '#52525b', textTransform: 'uppercase' }}>AFL</span>
              </button>
            )}
          </div>
        )}

        {/* EBU sub-column — separated by border when visible */}
        {showEbu && <EbuColumn elementId={elementId} isActive={isActive} tpLatch={tpLatch} onReset={handleLoudnessReset} />}

        {/* VU + fader sub-column */}
        <div style={{ display: 'flex', alignItems: 'flex-start', padding: '2px 0 2px 0', flex: 1 }}>

          {/* VU meter + peak readout */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 28, gap: 2, opacity: isActive ? 1 : 0.25, transition: 'opacity 0.2s' }}>
            <VuMeter elementId={elementId} />
            <PeakReadout elementId={elementId} />
          </div>

          {/* Fader + tick marks */}
          <Fader value={level} onChange={handleChange} onMouseDown={handleFaderMouseDown} ariaLabel={`${label} fader`} />
        </div>
      </div>

      {/* Bottom buttons */}
      <div className="border-t border-zinc-800 shrink-0 flex flex-col">
        {/* ON / AFV row */}
        <div className="flex gap-px">
          <button
            onClick={handleOnClick}
            title={
              mode === 'on' ? 'Channel on — click to mute'
                : mode === 'afv' ? 'Click to leave AFV and go ON'
                  : 'Channel muted — click to turn on'
            }
            className={cn(
              'flex-1 py-1 text-[9px] font-bold uppercase tracking-widest border-0 transition-colors cursor-pointer active:opacity-75',
              mode === 'on' ? 'text-white' : 'bg-zinc-900 text-zinc-500 hover:text-zinc-300',
            )}
            style={mode === 'on' ? { background: busColor.active } : {}}
          >
            ON
          </button>
          {showAfv && (
            <button
              onClick={handleAfvClick}
              title={mode === 'afv' ? 'AFV — audio follows video. Click to mute.' : 'Click to enable AFV'}
              className={cn(
                'flex-1 py-1 text-[9px] font-bold uppercase tracking-widest border-0 transition-colors cursor-pointer active:opacity-75',
                mode === 'afv' ? 'text-white' : 'text-zinc-500',
              )}
              style={mode === 'afv' ? { background: '#c86400' } : { background: '#18181b' }}
            >
              AFV
            </button>
          )}
        </div>

        {/* Pan slider — shown for input channels */}
        {chNum > 0 && (
          <div className="flex flex-col items-center gap-0.5 py-1 bg-[#0a0a0a]">
            <span className="text-[7px] text-zinc-500 leading-none">PAN</span>
            <div className="flex items-center gap-1 w-full px-1">
              <span className="text-[7px] text-zinc-600 w-3 text-right">L</span>
              <input type="range" min={-1} max={1} step={0.02} value={panVal}
                className="flex-1 h-1 accent-blue-500 cursor-pointer"
                onChange={(e) => send({ type: 'AUDIO_DYNAMICS_SET', channel: chNum, property: 'pan', value: parseFloat(e.target.value) })} />
              <span className="text-[7px] text-zinc-600 w-3">R</span>
            </div>
          </div>
        )}
      </div>

      {/* Processing popup */}
      {showProcessing && (
        <ProcessingPopup chNum={chNum} channelName={label} send={send} onClose={() => setShowProcessing(false)} />
      )}
    </div>
  )
}
