import { useControllerStore } from './controller.store'
import { cn } from '@/shared/cn'

const DSK_LABELS: Record<string, string> = {
  dsk_in_0: 'DSK 1',
  dsk_in_1: 'DSK 2',
}

interface DskPanelProps {
  onToggle: (layer: number, visible: boolean) => void
}

/**
 * Downstream keyer controls — toggle graphic overlays on the programme output.
 * Ported from the legacy ControllerPage DskPanel, driven by the controller
 * store's resolved graphic assignments and server-confirmed DSK state.
 */
export function DskPanel({ onToggle }: DskPanelProps) {
  const dskState = useControllerStore((s) => s.dskState)
  const assignments = useControllerStore((s) => s.graphicAssignments)

  return (
    <div className="flex flex-col border border-zinc-800 bg-zinc-950" style={{ minWidth: 96 }}>
      <div className="flex items-center justify-center border-b border-zinc-800 shrink-0 py-1">
        <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-500">DSK</span>
      </div>
      <div className="flex flex-col gap-px flex-1 p-1">
        {assignments.length === 0 && (
          <span className="text-[9px] text-zinc-600 italic px-1 flex items-center">NO GRAPHICS</span>
        )}
        {assignments.map((a) => {
          const dskMatch = /dsk_in_(\d+)$/.exec(a.dskInput)
          if (!dskMatch) return null
          const layer = parseInt(dskMatch[1] ?? '0', 10)
          const active = dskState[layer] ?? false
          const label = DSK_LABELS[a.dskInput] ?? a.dskInput

          return (
            <button
              key={a.dskInput}
              onClick={() => onToggle(layer, !active)}
              className={cn(
                'btn-hardware flex-1 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border transition-colors flex flex-col items-center gap-0 cursor-pointer',
                active
                  ? 'bg-orange-500 text-black border-orange-400'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-white hover:border-zinc-500',
              )}
            >
              <span>{label}</span>
              {a.graphicName && (
                <span className={cn('text-[8px] font-normal normal-case truncate max-w-full mt-0.5', active ? 'text-black/70' : 'text-zinc-600')}>
                  {a.graphicName}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
