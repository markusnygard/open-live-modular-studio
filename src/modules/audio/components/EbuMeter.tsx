import { useAudioStore } from '../audio.store'
import { EBU_BAR_GRADIENT, LUFS_TARGET, lufsToRatio, THUMB_CSS_W } from '../audio.constants'
import { useFaderDims } from './Fader'

// ── EBU R128 Meter ────────────────────────────────────────────────────────────
// Displays momentary LUFS bar + integrated LUFS readout + latching True Peak indicator.
// Scale: −60 to 0 LUFS. Target: −23 LUFS (EBU R128 broadcast standard).
export function EbuMeter({ elementId, height, tpLatch, onResetLatch }: {
  elementId: string
  height: number
  tpLatch: boolean
  onResetLatch?: () => void
}) {
  const meter = useAudioStore((s) => s.meters[elementId])

  const lufs_m = meter?.lufs_m
  const lufs_i = meter?.lufs_i

  const barRatio = lufs_m !== undefined ? lufsToRatio(lufs_m) : 0
  const targetRatio = lufsToRatio(LUFS_TARGET)

  const iStr = lufs_i !== undefined ? lufs_i.toFixed(1) : '---'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, width: 28, flexShrink: 0, marginTop: Math.round(THUMB_CSS_W / 2) }}>
      {/* EBU bar — same height as VU meter. True Peak latch shown as red border; click to reset. */}
      <div
        title={tpLatch ? 'True Peak exceeded −1 dBTP — click to reset' : 'EBU R128 momentary loudness'}
        onClick={tpLatch ? onResetLatch : undefined}
        style={{
          width: 10, height,
          position: 'relative',
          background: EBU_BAR_GRADIENT,
          border: tpLatch ? '1px solid #ff4040' : '1px solid #222',
          flexShrink: 0,
          cursor: tpLatch ? 'pointer' : 'default',
        }}
      >
        {/* Dark mask — shrinks from top to reveal the gradient up to current level */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: `${(1 - barRatio) * 100}%`,
          background: '#0a0a0a',
          transition: 'height 80ms linear',
          pointerEvents: 'none',
        }} />
        {/* Target line at −23 LUFS */}
        <div style={{
          position: 'absolute', left: 0, right: 0,
          bottom: `${targetRatio * 100}%`,
          height: 1,
          background: '#ffffff44',
          pointerEvents: 'none',
        }} />
      </div>

      {/* Integrated LUFS readout */}
      <div style={{
        fontSize: 8, fontFamily: 'monospace', whiteSpace: 'nowrap', textAlign: 'center',
        width: 28,
        color: lufs_i === undefined ? '#383838'
          : lufs_i > -20 ? '#ff4040'
            : lufs_i >= -26 ? '#00cc55'
              : lufs_i >= -36 ? '#ffaa00'
                : '#ff6666',
      }}>
        {iStr}
      </div>
    </div>
  )
}

// EBU sub-column wrapper used inside the MAIN channel strip.
export function EbuColumn({ elementId, isActive, tpLatch, onReset }: {
  elementId: string
  isActive: boolean
  tpLatch: boolean
  onReset: () => void
}) {
  const { faderH } = useFaderDims()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', borderRight: '1px solid #27272a', flexShrink: 0, opacity: isActive ? 1 : 0.25, transition: 'opacity 0.2s' }}>
      <div style={{ padding: '2px 4px 2px 2px', display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
        <EbuMeter elementId={elementId} height={faderH} tpLatch={tpLatch} onResetLatch={onReset} />
      </div>
    </div>
  )
}
