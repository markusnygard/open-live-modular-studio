import { useRef, useCallback, useState, useEffect } from 'react'
import { useControllerStore, type TransitionType } from './controller.store'
import { cn } from '@/shared/cn'

const DURATION_PRESETS_MS = [500, 1000, 2000]

export const TRANSITION_LABELS: Record<TransitionType, string> = {
  fade:           'FADE',
  dip_to_black:   'DIP',
  slide_left:     '← SLIDE',
  slide_right:    '→ SLIDE',
  slide_up:       '↑ SLIDE',
  slide_down:     '↓ SLIDE',
  push_left:      '← PUSH',
  push_right:     '→ PUSH',
  push_up:        '↑ PUSH',
  push_down:      '↓ PUSH',
  wipe_left:      '← WIPE',
  wipe_right:     '→ WIPE',
  wipe_up:        '↑ WIPE',
  wipe_down:      '↓ WIPE',
  iris_open:      'IRIS IN',
  iris_close:     'IRIS OUT',
  clock_wipe:     'CLOCK',
  blinds:         'BLINDS',
  checker:        'CHECKER',
  noise_dissolve: 'NOISE',
  luma_wipe:      'LUMA',
  barn_doors:     'BARN',
  star_wipe:      'STAR',
  pinwheel:       'PINWHEEL',
  crosshatch:     'CROSS\nHATCH',
  hex_dissolve:   'HEX',
  warp_wipe:      'WARP',
  melt:           'MELT',
  heart_iris:     'HEART',
  glitch_cut:     'GLITCH',
  flash_dissolve: 'FLASH',
  whip_pan_left:  '← WHIP',
  whip_pan_right: '→ WHIP',
  punch_zoom:     'PUNCH',
  pixelate_take:  'PIXELATE',
  zoom_blur:      'ZOOM',
  spin:           'SPIN',
  tv_roll:        'ROLL',
  negative_flash: 'NEGATIVE',
  ripple:         'RIPPLE',
}

const TRANSITION_TYPES = Object.keys(TRANSITION_LABELS) as TransitionType[]

interface TransitionPanelProps {
  onCut: () => void
  onAuto: () => void
  onFtb: () => void
  onSetOvl: (alpha: number) => void
  className?: string
}

/**
 * Transition controls — TAKE / AUTO / FTB, transition-type chips, duration
 * presets and the OVL T-bar. Ported from the legacy ControllerPage
 * TransitionPanel, store-driven and stripped of the PGM/PVW source rows (those
 * now live in {@link SourceBus}).
 */
export function TransitionPanel({ onCut, onAuto, onFtb, onSetOvl, className }: TransitionPanelProps) {
  const ovlTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const debouncedSetOvl = useCallback((alpha: number) => {
    if (ovlTimerRef.current) clearTimeout(ovlTimerRef.current)
    ovlTimerRef.current = setTimeout(() => onSetOvl(alpha), 150)
  }, [onSetOvl])

  const isFtb = useControllerStore((s) => s.isFtb)
  const transitionType = useControllerStore((s) => s.transitionType)
  const transitionDurationMs = useControllerStore((s) => s.transitionDurationMs)
  const tBarPosition = useControllerStore((s) => s.tBarPosition)
  const setTransitionType = useControllerStore((s) => s.setTransitionType)
  const setTransitionDuration = useControllerStore((s) => s.setTransitionDuration)
  const setTBarPosition = useControllerStore((s) => s.setTBarPosition)
  const visibleTransitions = useControllerStore((s) => s.visibleTransitions)

  // Custom input keeps its own value; presets don't overwrite it
  const [customMs, setCustomMs] = useState(() =>
    DURATION_PRESETS_MS.includes(transitionDurationMs) ? 1500 : transitionDurationMs
  )
  const isCustomActive = !DURATION_PRESETS_MS.includes(transitionDurationMs)
  const [isEditingCustom, setIsEditingCustom] = useState(false)
  const [editValue, setEditValue] = useState('')
  const customInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isCustomActive) setIsEditingCustom(false)
  }, [isCustomActive])

  const handleCustomClick = () => {
    if (!isCustomActive) {
      setTransitionDuration(customMs)
    } else if (!isEditingCustom) {
      setEditValue(String(customMs))
      setIsEditingCustom(true)
      setTimeout(() => { customInputRef.current?.select() }, 0)
    }
  }

  const commitEdit = () => {
    const parsed = parseInt(editValue, 10)
    if (!isNaN(parsed) && parsed >= 100 && parsed <= 10000) {
      setCustomMs(parsed)
      setTransitionDuration(parsed)
    }
    setIsEditingCustom(false)
  }

  const activeTransitions = TRANSITION_TYPES.filter((t) => visibleTransitions.includes(t))
  const numTransitionRows = Math.max(1, Math.ceil(activeTransitions.length / 4))

  return (
    <div className={cn('flex flex-col border border-zinc-800 bg-zinc-950 overflow-hidden', className)} style={{ width: 224 }}>

      {/* TAKE / AUTO / FTB */}
      <div className="flex items-stretch gap-px p-1 border-b border-zinc-800" style={{ flex: 1 }}>
        <button
          onClick={onCut}
          className="btn-hardware flex-1 text-[11px] font-bold uppercase tracking-widest text-white border ring-1 ring-inset ring-white transition-opacity hover:opacity-90 cursor-pointer"
          style={{ background: '#cc0000', borderColor: '#ff0000' }}
        >
          TAKE
        </button>
        <button
          onClick={onAuto}
          className="btn-hardware flex-1 text-[10px] font-bold uppercase tracking-widest text-zinc-300 bg-zinc-800 border border-zinc-600 hover:bg-zinc-700 transition-colors cursor-pointer"
        >
          AUTO
        </button>
        <button
          onClick={onFtb}
          className={cn(
            'btn-hardware flex-1 text-[10px] font-bold uppercase tracking-widest border transition-colors cursor-pointer',
            isFtb
              ? 'text-white border-zinc-400 bg-zinc-700'
              : 'text-zinc-500 bg-zinc-900 border-zinc-700 hover:text-zinc-300',
          )}
        >
          FTB
        </button>
      </div>

      {/* Transition type chips — max 4 per row */}
      <div className="grid p-1 gap-px overflow-hidden" style={{ flex: numTransitionRows, gridTemplateColumns: 'repeat(4, 1fr)', gridAutoRows: '1fr' }}>
        {activeTransitions.map((type) => (
          <button
            key={type}
            onClick={() => setTransitionType(type)}
            className={cn(
              'btn-hardware w-full text-[9px] font-bold uppercase tracking-wide border transition-colors cursor-pointer leading-tight overflow-hidden whitespace-pre-wrap',
              transitionType === type
                ? 'text-black bg-orange-500 border-orange-400'
                : 'text-zinc-500 bg-zinc-900 border-zinc-700 hover:text-zinc-300 hover:bg-zinc-800',
            )}
          >
            {TRANSITION_LABELS[type]}
          </button>
        ))}
      </div>

      {/* Duration presets */}
      <div className="flex items-stretch gap-px p-1 border-t border-zinc-800" style={{ flex: 1 }}>
        {DURATION_PRESETS_MS.map((ms) => (
          <button
            key={ms}
            onClick={() => setTransitionDuration(ms)}
            className={cn(
              'btn-hardware flex items-center justify-center gap-px border transition-colors shrink-0 cursor-pointer',
              transitionDurationMs === ms
                ? 'text-black bg-orange-500 border-orange-400'
                : 'text-zinc-500 bg-zinc-900 border-zinc-700 hover:text-zinc-300',
            )}
            style={{ width: 44 }}
          >
            <span className="text-[11px] font-mono font-bold leading-none">{ms / 1000}</span>
            <span className="text-[8px] font-mono leading-none mt-px">S</span>
          </button>
        ))}
        {/* Custom ms input — single click selects, second click edits */}
        <div
          onClick={handleCustomClick}
          className={cn(
            'flex items-center justify-center flex-1 border gap-0.5 px-1 transition-colors',
            isEditingCustom
              ? 'bg-zinc-800 border-white'
              : isCustomActive
                ? 'bg-orange-500 border-orange-500'
                : 'bg-zinc-900 border-zinc-700 hover:border-zinc-500 cursor-pointer',
          )}
        >
          <input
            ref={customInputRef}
            type="text"
            inputMode="numeric"
            value={isEditingCustom ? editValue : String(customMs)}
            readOnly={!isEditingCustom}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => { if (e.key === 'Enter') customInputRef.current?.blur() }}
            className={cn(
              'w-10 bg-transparent text-[11px] font-mono font-bold text-right focus:outline-none',
              isEditingCustom ? 'text-white cursor-text' : isCustomActive ? 'text-black cursor-pointer' : 'text-zinc-300 cursor-pointer',
            )}
          />
          <span className={cn(
            'text-[8px] font-mono uppercase shrink-0 mt-px pointer-events-none',
            isEditingCustom ? 'text-zinc-400' : isCustomActive ? 'text-black/70' : 'text-zinc-600',
          )}>MS</span>
        </div>
      </div>

      {/* OVL / T-bar row */}
      <div className="flex items-center border-t border-zinc-800 px-3 py-2 gap-3" style={{ flex: 1 }}>
        <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-600 shrink-0">OVL</span>
        <div className="relative flex-1 flex items-center" style={{ height: 24 }}>
          <div
            className="absolute inset-x-0"
            style={{ height: 4, background: '#1a1a1a', border: '1px solid #333333', top: '50%', transform: 'translateY(-50%)' }}
          />
          <div
            className="absolute left-0"
            style={{ height: 4, width: `${tBarPosition * 100}%`, background: '#f97316', top: '50%', transform: 'translateY(-50%)', transition: 'width 40ms linear' }}
          />
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(tBarPosition * 100)}
            onChange={(e) => { const v = Number(e.target.value) / 100; setTBarPosition(v); debouncedSetOvl(v) }}
            className="absolute inset-0 w-full opacity-0 cursor-pointer"
            style={{ zIndex: 2 }}
          />
        </div>
        <span className="text-[10px] font-mono text-zinc-500 w-10 text-right tabular-nums shrink-0">
          {tBarPosition.toFixed(2)}
        </span>
      </div>

    </div>
  )
}
