import { useAudioStore } from '../audio.store'
import { DB_MIN } from '../audio.constants'

// ── Peak readout ────────────────────────────────────────────────────────────────
// Numeric dB peak below the meter, colour-coded by broadcast headroom zones.
export function PeakReadout({ elementId }: { elementId: string }) {
  const meter = useAudioStore((s) => s.meters[elementId])
  const peakDb = meter ? Math.max(...meter.peak) : null
  const silent = peakDb === null || !isFinite(peakDb) || peakDb < DB_MIN
  const peakStr = silent ? '−∞' : peakDb!.toFixed(1)
  const peakColor = silent
    ? '#383838'
    : peakDb! > -6
      ? '#ff4040'
      : peakDb! > -18
        ? '#ffaa00'
        : '#00cc55'
  return (
    <div style={{ fontSize: 8, fontFamily: 'monospace', whiteSpace: 'nowrap', textAlign: 'center', color: peakColor }}>
      {peakStr}
    </div>
  )
}
