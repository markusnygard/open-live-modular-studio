import { useControllerStore } from './controller.store'
import { cn } from '@/shared/cn'

interface SourceBusProps {
  onSelectPvw: (mixerInput: string) => void
  onHotCut: (mixerInput: string) => void
  onSelectPvwPip?: (pip: number) => void
  onHotCutPip?: (pip: number) => void
}

export function SourceBus({ onSelectPvw, onHotCut, onSelectPvwPip, onHotCutPip }: SourceBusProps) {
  const sources = useControllerStore((s) => s.sources)
  const pgmInput = useControllerStore((s) => s.pgmInput)
  const pvwInput = useControllerStore((s) => s.pvwInput)
  const pgmPip   = useControllerStore((s) => s.pgmPip)
  const pvwPip   = useControllerStore((s) => s.pvwPip)
  const pips     = useControllerStore((s) => s.pips)
  const values   = useControllerStore((s) => s.values)
  const numPips  = values.num_pips !== undefined ? parseInt(String(values.num_pips), 10) : 0

  const sorted = [...sources].sort((a, b) => a.mixerInput.localeCompare(b.mixerInput))

  // PiP virtual slots: pip:0 through pip:(numPips-1)
  const pipSlots = Array.from({ length: numPips }, (_, i) => i)

  const pipLabel = (i: number) => `PIP ${i + 1}`

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
          {sorted.length === 0 && pipSlots.length === 0 && (
            <span className="text-[9px] text-zinc-600 italic px-1 flex items-center">NO SOURCES</span>
          )}
          {sorted.map((slot) => (
            <button key={slot.mixerInput} onClick={() => onHotCut(slot.mixerInput)}
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
          {/* PiP buttons */}
          {pipSlots.map((pip) => (
            <button key={`pip:${pip}`} onClick={() => onHotCutPip?.(pip)}
              className={cn(
                'btn-hardware px-1.5 py-0 text-[10px] font-bold break-words border cursor-pointer select-none flex items-center justify-center tracking-wide transition-all',
                pgmPip === pip
                  ? 'text-white border-white'
                  : 'text-amber-600/60 border-zinc-800 bg-zinc-900 hover:text-amber-400 hover:border-zinc-500',
              )}
              style={pgmPip === pip ? { background: '#ff0000', borderColor: '#ffffff' } : {}}
            >
              {pipLabel(pip)}
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
          {sorted.length === 0 && pipSlots.length === 0 && (
            <span className="text-[9px] text-zinc-600 italic px-1 flex items-center">NO SOURCES</span>
          )}
          {sorted.map((slot) => {
            const isOnPgm = pgmInput === slot.mixerInput
            const isActive = pvwInput === slot.mixerInput
            return (
              <button key={slot.mixerInput} onClick={() => !isOnPgm && onSelectPvw(slot.mixerInput)} disabled={isOnPgm}
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
          {/* PiP PVW buttons */}
          {pipSlots.map((pip) => {
            const isOnPgm = pgmPip === pip
            const isActive = pvwPip === pip
            return (
              <button key={`pip:${pip}`} onClick={() => !isOnPgm && onSelectPvwPip?.(pip)} disabled={isOnPgm}
                className={cn(
                  'btn-hardware px-1.5 py-0 text-[10px] font-bold break-words border transition-all tracking-wide flex items-center justify-center',
                  isActive
                    ? 'text-black border-white'
                    : isOnPgm
                      ? 'text-zinc-700 bg-zinc-900 border-zinc-800 opacity-40 cursor-not-allowed'
                      : 'text-amber-600/60 bg-zinc-900 border-zinc-800 hover:text-amber-400 hover:border-zinc-500 cursor-pointer',
                )}
                style={isActive ? { background: '#00cc00', borderColor: '#ffffff' } : {}}
              >
                {pipLabel(pip)}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
