import { useEffect, useRef, useState } from 'react'
import { statusApi, type ApiStatus } from '@/lib/api'

type Level = 'green' | 'orange' | 'red' | 'unknown'

interface State {
  openLive: boolean | null
  db: boolean | null
  strom: boolean | null
}

function deriveLevel(s: State): Level {
  if (s.openLive === null) return 'unknown'
  if (!s.openLive) return 'red'
  if (!s.db || !s.strom) return 'orange'
  return 'green'
}

const ICON_COLOR: Record<Level, string> = {
  green:   'text-emerald-400',
  orange:  'text-orange-500',
  red:     'text-red-500',
  unknown: 'text-zinc-500',
}

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5a17.919 17.919 0 0 1-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
    </svg>
  )
}

function StatusRow({ label, ok }: { label: string; ok: boolean | null }) {
  const color = ok === null ? 'text-zinc-500' : ok ? 'text-emerald-400' : 'text-red-400'
  return (
    <div className="flex items-center gap-2.5 text-xs">
      <span className={`${color} text-[8px] leading-none`}>●</span>
      <span className="text-zinc-300">{label}</span>
    </div>
  )
}

export function ConnectionStatus() {
  const [state, setState] = useState<State>({ openLive: null, db: null, strom: null })
  const [hover, setHover] = useState(false)
  const lastFetchedAt = useRef<number>(0)

  async function fetchStatus() {
    if (Date.now() - lastFetchedAt.current < 5000) return
    lastFetchedAt.current = Date.now()
    try {
      const data: ApiStatus = await statusApi.get()
      setState({ openLive: true, db: data.db, strom: data.strom })
    } catch {
      setState({ openLive: false, db: null, strom: null })
    }
  }

  useEffect(() => { void fetchStatus() }, [])

  function handleMouseEnter() {
    setHover(true)
    void fetchStatus()
  }

  const level = deriveLevel(state)

  return (
    <div
      className="relative flex justify-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setHover(false)}
    >
      <GlobeIcon className={`w-7 h-7 transition-colors ${ICON_COLOR[level]}`} />

      {hover && (
        <div className="absolute bottom-0 left-full ml-3 z-50 w-40 bg-zinc-900 border border-zinc-700 rounded shadow-xl p-3 flex flex-col gap-2 pointer-events-none">
          <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-0.5">Connections</div>
          <StatusRow label="Open Live" ok={state.openLive} />
          <StatusRow label="Strom"     ok={state.strom}    />
          <StatusRow label="Database"  ok={state.db}       />
        </div>
      )}
    </div>
  )
}
