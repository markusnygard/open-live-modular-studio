import { useControllerStore } from './controller.store'
import { cn } from '@/shared/cn'

interface SourceBusProps {
  /** Put a source on preview (PVW bus). */
  onSelectPvw: (mixerInput: string) => void
  /** Hot-cut a source straight to programme (PGM bus). */
  onHotCut: (mixerInput: string) => void
}

/**
 * Dual PGM/PVW source bus — two rows of source buttons. Clicking a PVW button
 * previews that source; clicking a PGM button hot-cuts it straight to air.
 * Ported from the legacy ControllerPage `SourceBusDual`, adapted to the module
 * architecture (button tiles instead of live WebRTC video tiles).
 */
export function SourceBus({ onSelectPvw, onHotCut }: SourceBusProps) {
  const sources = useControllerStore((s) => s.sources)
  const pgmInput = useControllerStore((s) => s.pgmInput)
  const pvwInput = useControllerStore((s) => s.pvwInput)

  const sorted = [...sources].sort((a, b) => a.mixerInput.localeCompare(b.mixerInput))

  return (
    <div className="flex flex-col border border-zinc-800 bg-zinc-950 overflow-hidden min-w-0">
      {/* PGM row */}
      <div className="flex flex-1 items-stretch border-b border-zinc-800" style={{ minHeight: 38 }}>
        <div
          className="flex items-center justify-center px-2 shrink-0 border-r border-zinc-800"
          style={{ width: 40, background: 'rgba(255,0,0,0.12)' }}
        >
          <span className="text-[9px] font-bold uppercase tracking-[0.15em]" style={{ color: '#ff0000' }}>PGM</span>
        </div>
        <div className="flex items-stretch gap-px flex-1 overflow-x-auto p-1">
          {sorted.length === 0 && (
            <span className="text-[9px] text-zinc-600 italic px-1 flex items-center">NO SOURCES</span>
          )}
          {sorted.map((slot) => (
            <button
              key={slot.mixerInput}
              onClick={() => onHotCut(slot.mixerInput)}
              className={cn(
                'btn-hardware flex-1 min-w-14 px-1.5 py-0 text-[10px] font-bold break-words border cursor-pointer select-none flex items-center justify-center tracking-wide transition-all',
                pgmInput === slot.mixerInput
                  ? 'text-white border-white'
                  : 'text-zinc-500 border-zinc-800 bg-zinc-900 hover:text-white hover:border-zinc-500',
              )}
              style={pgmInput === slot.mixerInput ? { background: '#ff0000', borderColor: '#ffffff' } : {}}
            >
              {slot.name.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* PVW row */}
      <div className="flex flex-1 items-stretch" style={{ minHeight: 38 }}>
        <div
          className="flex items-center justify-center px-2 shrink-0 border-r border-zinc-800"
          style={{ width: 40, background: 'rgba(0,204,0,0.10)' }}
        >
          <span className="text-[9px] font-bold uppercase tracking-[0.15em]" style={{ color: '#00cc00' }}>PVW</span>
        </div>
        <div className="flex items-stretch gap-px flex-1 overflow-x-auto p-1">
          {sorted.length === 0 && (
            <span className="text-[9px] text-zinc-600 italic px-1 flex items-center">NO SOURCES</span>
          )}
          {sorted.map((slot) => {
            const isOnPgm = pgmInput === slot.mixerInput
            const isActive = pvwInput === slot.mixerInput
            return (
              <button
                key={slot.mixerInput}
                onClick={() => !isOnPgm && onSelectPvw(slot.mixerInput)}
                disabled={isOnPgm}
                className={cn(
                  'btn-hardware flex-1 min-w-14 px-1.5 py-0 text-[10px] font-bold break-words border transition-all tracking-wide flex items-center justify-center',
                  isActive
                    ? 'text-black border-white'
                    : isOnPgm
                      ? 'text-zinc-700 bg-zinc-900 border-zinc-800 opacity-40 cursor-not-allowed'
                      : 'text-zinc-500 bg-zinc-900 border-zinc-800 hover:text-white hover:border-zinc-500 cursor-pointer',
                )}
                style={isActive ? { background: '#00cc00', borderColor: '#ffffff' } : {}}
              >
                {slot.name.toUpperCase()}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
