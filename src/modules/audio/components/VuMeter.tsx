import { useAudioStore } from '../audio.store'
import { DB_MIN, dbToRatio, PPM_GRADIENT, THUMB_CSS_W } from '../audio.constants'
import { useFaderDims } from './Fader'

// ── VU Meter — PPM-style segmented ────────────────────────────────────────────
// One bar per channel with an 80 ms ballistic fill and a latching peak-hold marker.
export function VuMeter({ elementId, numChannels = 1 }: { elementId: string; numChannels?: number }) {
  const { faderH } = useFaderDims()
  const meter = useAudioStore((s) => s.meters[elementId])
  const channels = meter
    ? meter.peak.map((peak, i) => ({ bar: peak, hold: meter.decay?.[i] ?? peak }))
    : Array.from({ length: numChannels }, () => ({ bar: DB_MIN, hold: DB_MIN }))

  return (
    <div style={{ width: channels.length > 1 ? 14 : 7, height: faderH, display: 'flex', gap: 2, flexShrink: 0, marginTop: Math.round(THUMB_CSS_W / 2) }}>
      {channels.map(({ bar, hold }, i) => {
        const barR = dbToRatio(bar)
        const holdR = dbToRatio(hold)
        return (
          <div key={i} style={{ flex: 1, position: 'relative', background: PPM_GRADIENT, border: '1px solid #222' }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0,
              height: `${(1 - barR) * 100}%`,
              background: '#0a0a0a',
              transition: 'height 80ms linear',
            }} />
            <div className="vu-segment-bar" />
            <div style={{
              position: 'absolute',
              bottom: `${holdR * 100}%`,
              left: 0, right: 0, height: 2,
              background: holdR > 0.9 ? '#ff4040' : holdR > 0.7 ? '#ffe050' : '#ffffff88',
            }} />
          </div>
        )
      })}
    </div>
  )
}
