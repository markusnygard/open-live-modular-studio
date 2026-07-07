const COUNTDOWN_WINDOW_MS = 4  * 60 * 60 * 1000  // 4 h
const PROGRAM_WINDOW_MS   = 20 * 60 * 60 * 1000  // 20 h

// ── Derived helpers ───────────────────────────────────────────────────────────

export type ProgramMode = 'idle' | 'scheduled' | 'countdown' | 'onair' | 'expired'

export function getProgramMode(programStartMs: number | null, nowMs: number): ProgramMode {
  if (programStartMs === null) return 'idle'
  const diff = programStartMs - nowMs
  if (diff > COUNTDOWN_WINDOW_MS) return 'scheduled'
  if (diff > 0) return 'countdown'
  if (-diff <= PROGRAM_WINDOW_MS) return 'onair'
  return 'expired'
}

export { COUNTDOWN_WINDOW_MS, PROGRAM_WINDOW_MS }

// ── Hook ─────────────────────────────────────────────────────────────────────
// Derives programStartMs from the active production's airTime field (stored in DB).
// Ticks every second so callers re-render at the right moment.
import { useEffect, useState } from 'react'
import { useProductionStore } from './production.store'
import { useProductionsStore } from './productions.store'

export function useProgramStartMs(): number | null {
  const activeProductionId = useProductionStore((s) => s.activeProductionId)
  const airTime = useProductionsStore(
    (s) => s.productions.find((p) => p.id === activeProductionId)?.airTime,
  )
  return airTime ? new Date(airTime).getTime() : null
}

export function useIsOnAir(): boolean {
  const programStartMs = useProgramStartMs()
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  return getProgramMode(programStartMs, now) === 'onair'
}
