import { MODULES } from './ModuleRegistry'
import { isModuleVisible, setModuleVisible, useVisibilityVersion } from './SlotLayout'
import { cn } from '@/shared/cn'

interface Production {
  _id: string
  name?: string
}

export function ModuleToggleBar({ productions = [], productionId, onSelectProduction }: {
  productions?: Production[]
  productionId: string | null
  onSelectProduction?: (id: string | null) => void
}) {
  useVisibilityVersion()

  return (
    <header className="flex items-center gap-3 px-3 h-11 shrink-0 bg-neutral-900 border-b border-neutral-800">
      <span className="text-white font-semibold text-sm whitespace-nowrap">
        OpenLive Studio
      </span>

      <select
        className="bg-neutral-800 text-white text-sm rounded px-2 py-1 outline-none"
        value={productionId ?? ''}
        onChange={e => onSelectProduction?.(e.target.value || null)}
      >
        <option value="">Select production…</option>
        {productions.map(p => (
          <option key={p._id} value={p._id}>{p.name ?? p._id}</option>
        ))}
      </select>

      <div className="flex items-center gap-1 ml-auto">
        {MODULES.map(m => {
          const visible = isModuleVisible(m)
          return (
            <button
              key={m.id}
              type="button"
              title={m.label}
              aria-pressed={visible}
              onClick={() => setModuleVisible(m.id, !visible)}
              className={cn(
                'flex items-center justify-center h-8 min-w-8 px-2 rounded text-sm transition-colors',
                visible
                  ? 'bg-blue-600 text-white'
                  : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700',
              )}
            >
              {m.icon}
            </button>
          )
        })}
      </div>
    </header>
  )
}
