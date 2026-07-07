import { useCallback, useEffect } from 'react'
import { useControllerStore, type ControllerMacro } from './controller.store'

const SLOTS = [0, 1, 2, 3, 4, 5, 6, 7] as const

interface MacroBarProps {
  onExec: (macroId: string) => void
}

function MacroSlot({ slot, macro, onExec }: { slot: number; macro: ControllerMacro | undefined; onExec: () => void }) {
  if (!macro) {
    return (
      <div
        className="flex-1 min-w-[64px] h-10 rounded-lg border border-dashed border-zinc-700 text-zinc-600 text-xs flex items-center justify-center gap-1"
        title={`F${slot + 1} — empty slot`}
      >
        <span className="text-[9px] text-zinc-600 mr-0.5">F{slot + 1}</span>
      </div>
    )
  }

  return (
    <button
      onClick={onExec}
      className="flex-1 min-w-[64px] h-10 rounded-lg text-white text-xs font-bold uppercase tracking-wide border border-transparent transition-all active:scale-95 flex flex-col items-center justify-center px-1 cursor-pointer"
      style={{ backgroundColor: macro.color }}
      title={`F${slot + 1} — ${macro.label}`}
    >
      <span className="text-[8px] opacity-60">F{slot + 1}</span>
      <span className="truncate max-w-full leading-none">{macro.label}</span>
    </button>
  )
}

/**
 * Macro execute bar — eight numbered slots (F1-F8) mapped to the active
 * production's macros. Ported from the legacy ControllerPage MacroBar; the
 * create/edit modal is omitted (macros are configured via the API).
 */
export function MacroBar({ onExec }: MacroBarProps) {
  const macros = useControllerStore((s) => s.macros)

  const macroBySlot = (slot: number) => macros.find((m) => m.slot === slot)

  // F1-F8 keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      const fKeyMatch = e.code.match(/^F([1-8])$/)
      if (!fKeyMatch) return
      e.preventDefault()
      const slot = parseInt(fKeyMatch[1] ?? '1', 10) - 1
      const macro = macros.find((m) => m.slot === slot)
      if (macro) onExec(macro.id)
    },
    [macros, onExec],
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div className="flex flex-col gap-1.5 p-2 bg-zinc-950 rounded border border-zinc-800">
      <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Macros</span>
      <div className="flex flex-col gap-1 flex-1">
        {SLOTS.map((slot) => (
          <MacroSlot
            key={slot}
            slot={slot}
            macro={macroBySlot(slot)}
            onExec={() => { const m = macroBySlot(slot); if (m) onExec(m.id) }}
          />
        ))}
      </div>
    </div>
  )
}
