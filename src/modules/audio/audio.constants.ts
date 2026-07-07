// ── Audio panel shared constants & math ─────────────────────────────────────────
// Numeric constants, colour palette, meter scales and the broadcast fader taper.
// Kept free of React so both the pure meter maths and the strip components can
// import from a single source of truth.

// ── Bus-type accent colours ────────────────────────────────────────────────────
// Follows broadcast console convention (Calrec / SSL language):
//   MAIN = red    — program output, "on air"
//   AUX  = amber  — independent monitor buses (IFB, recording feeds, etc.)
//   GRP  = green  — subgroup submixes that feed into main
//   IN   = blue   — individual source input channels
//   MON  = violet — operator's local monitoring output
export interface BusColor {
  hex: string
  active: string
  dim: string
}

export const C_MAIN: BusColor = { hex: '#dc2626', active: 'rgba(220,38,38,0.90)', dim: 'rgba(220,38,38,0.08)' }
export const C_AUX: BusColor = { hex: '#d97706', active: 'rgba(217,119,6,0.85)', dim: 'rgba(217,119,6,0.08)' }
export const C_GRP: BusColor = { hex: '#16a34a', active: 'rgba(22,163,74,0.85)', dim: 'rgba(22,163,74,0.08)' }
export const C_IN: BusColor = { hex: '#2563eb', active: 'rgba(37,99,235,0.85)', dim: 'rgba(37,99,235,0.08)' }
export const C_MON: BusColor = { hex: '#a855f7', active: 'rgba(168,85,247,0.85)', dim: 'rgba(168,85,247,0.08)' }

// ── VU Meter — PPM-style ────────────────────────────────────────────────────────
export const DB_MIN = -60
export const DB_MAX = 0

export function dbToRatio(db: number): number {
  return Math.max(0, Math.min(1, (db - DB_MIN) / (DB_MAX - DB_MIN)))
}

// Fixed PPM gradient: green 0→−18 dB (70%), amber −18→−6 dB (70→90%), red −6→0 dB (90→100%).
export const PPM_GRADIENT =
  'linear-gradient(to top, #00bb44 0%, #00bb44 70%, #ffcc00 70%, #ffcc00 90%, #ff2020 90%, #ff2020 100%)'

// ── EBU R128 loudness ────────────────────────────────────────────────────────────
export const LUFS_MIN = -60
export const LUFS_MAX = 0
export const LUFS_TARGET = -23

export function lufsToRatio(lufs: number): number {
  return Math.max(0, Math.min(1, (lufs - LUFS_MIN) / (LUFS_MAX - LUFS_MIN)))
}

// EBU R128 compliance zone gradient — bottom to top: red → amber → green → amber → red.
const EBU_GRADIENT = [
  '#ff2020 0%', '#ff2020 40%', // red:   −60 to −36 LUFS (below threshold)
  '#ffcc00 40%', '#ffcc00 56.7%', // amber: −36 to −26 LUFS (below target)
  '#00bb44 56.7%', '#00bb44 66.7%', // green: −26 to −20 LUFS (target zone)
  '#ffcc00 66.7%', '#ffcc00 85%', // amber: −20 to  −9 LUFS (above target)
  '#ff2020 85%', '#ff2020 100%', // red:    −9 to   0 LUFS (too loud)
].join(', ')
export const EBU_BAR_GRADIENT = `linear-gradient(to top, ${EBU_GRADIENT})`

// TP_THRESHOLD: −1 dBTP expressed as linear amplitude (10^(−1/20) ≈ 0.891).
// Strom sends true_peak in linear amplitude (0.0–1.0+), not dBTP despite the ADR.
export const TP_THRESHOLD = 0.891

// ── Fader geometry ────────────────────────────────────────────────────────────
export const FADER_H = 260
// Width of the fader container. The range input CSS height is set to this value so that
// after rotate(-90deg) it fills the container exactly — this is what centres the handle.
export const FADER_W = 36

// CSS `width` of the handle-a thumb (= visual height on screen after rotate(-90deg)).
// WebKit keeps the thumb fully inside the track, so its centre travels from
// THUMB_CSS_W/2 to FADER_H − THUMB_CSS_W/2, not the full 0…FADER_H.
export const THUMB_CSS_W = 23
export const FADER_CONTAINER_H = FADER_H + THUMB_CSS_W

// ── Fader taper ───────────────────────────────────────────────────────────────
// Broadcast log taper with +20 dB headroom (Strom volume_N range: 0–10).
// UNITY_POS (0.875) is the 0 dB position — just below the top of travel.
export const MAX_VOL = 10.0
export const UNITY_POS = 0.875 // fader position that maps to 0 dB (1.0 amplitude)

// dB-calibrated tick marks; pixel y = (1 − pos) × FADER_H.
export const FADER_TICKS: Array<{ pos: number; db: string; major?: boolean; infinity?: boolean }> = [
  { pos: 1.0, db: '+20', major: true },
  { pos: 0.9375, db: '+10' },
  { pos: UNITY_POS, db: '0', major: true },
  { pos: 0.656, db: '-10' },
  { pos: 0.438, db: '-20' },
  { pos: 0.219, db: '-30' },
  { pos: 0, db: '-∞', major: true, infinity: true },
]

export function faderToVolume(pos: number): number {
  if (pos <= 0) return 0
  if (pos >= 1.0) return MAX_VOL
  if (pos >= UNITY_POS) {
    // Log-in-dB taper above unity: 0 dB (1.0) → +20 dB (10.0)
    return Math.pow(10, (pos - UNITY_POS) / (1.0 - UNITY_POS))
  }
  // Log taper below unity, scaled to [0, UNITY_POS]
  const normalPos = pos / UNITY_POS
  return Math.min(Math.pow(0.01, 1 - normalPos), 0.9999)
}

export function volumeToFader(vol: number): number {
  if (vol <= 0) return 0
  if (vol >= MAX_VOL) return 1.0
  if (vol >= 1.0) {
    // Log inverse above unity: vol ∈ [1, 10] → pos ∈ [UNITY_POS, 1.0]
    return UNITY_POS + Math.log10(vol) * (1.0 - UNITY_POS)
  }
  const normalPos = Math.max(0, 1 + Math.log10(vol) / 2)
  return normalPos * UNITY_POS
}

// Stable empty fallback for store selectors that return Record types.
// Must be defined outside components — inline `?? {}` creates a new reference
// on every render, causing Zustand to trigger an infinite rerender loop.
export const EMPTY_RECORD: Record<number, boolean> = {}
