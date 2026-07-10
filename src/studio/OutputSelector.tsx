import { useState, useCallback, useEffect, useRef } from 'react'
import { request } from '@/shared/api'
import type { OutputType } from '@/lib/api'

interface OutputInfo {
  id: string
  name: string
  url?: string
  running: boolean
  error?: string
  health?: string
}

interface OutputTypeGroup {
  type: OutputType
  label: string
  color: string
  outputs: OutputInfo[]
}

const TYPE_LABELS: Record<string, string> = {
  mpegtssrt: 'SRT',
  efpsrt: 'EFP',
  ndi: 'NDI',
  sdi: 'SDI',
  recorder: 'REC',
}

const TYPE_COLORS: Record<string, string> = {
  mpegtssrt: '#4ade80',
  efpsrt: '#60a5fa',
  ndi: '#f97316',
  sdi: '#c084fc',
  recorder: '#facc15',
}

function OutputDropdown({ group, productionId, onStatusChange }: {
  group: OutputTypeGroup
  productionId: string
  onStatusChange: () => void
}) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [starting, setStarting] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  // Auto-select running outputs
  const runningIds = group.outputs.filter(o => o.running).map(o => o.id)
  const hasRunning = runningIds.length > 0
  const hasError = group.outputs.some(o => o.error)
  const allRunning = group.outputs.length > 0 && group.outputs.every(o => o.running)

  // Button color
  const btnColor = hasRunning ? 'bg-red-700 border-red-600 text-white'
    : hasError ? 'bg-amber-700 border-amber-600 text-white'
    : 'bg-zinc-800 border-zinc-600 text-zinc-400'

  const isInline = new Set(['whep']).has(group.type)

  const toggleOutput = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleStartStop = useCallback(async () => {
    const toToggle = selected.size > 0
      ? group.outputs.filter(o => selected.has(o.id))
      : group.outputs  // if nothing selected, toggle all

    setStarting(true)
    for (const o of toToggle) {
      try {
        if (o.running) {
          await request(`/api/v1/productions/${productionId}/outputs/${o.id}/stop`, { method: 'POST' })
        } else {
          await request(`/api/v1/productions/${productionId}/outputs/${o.id}/start`, {
            method: 'POST',
            body: JSON.stringify({
              config: {
                type: group.type === 'mpegtssrt' ? 'srt'
                  : group.type === 'efpsrt' ? 'efp'
                  : group.type === 'recorder' ? 'recording'
                  : group.type as any,
                destination: o.url,
                deviceNumber: group.type === 'sdi' ? parseInt(o.url ?? '0', 10) : undefined,
                ndiName: group.type === 'ndi' ? o.name : undefined,
              },
            }),
          })
        }
      } catch {}
    }
    setStarting(false)
    setOpen(false)
    setTimeout(onStatusChange, 500)
  }, [selected, group, productionId, onStatusChange])

  if (group.outputs.length === 0) return null

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-colors ${btnColor}`}
        disabled={starting}
      >
        {group.label} {starting ? '...' : ''}
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-zinc-900 border border-zinc-700 rounded shadow-lg z-50 min-w-[180px]">
          <div className="max-h-48 overflow-y-auto">
            {group.outputs.map(o => (
              <label key={o.id} className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-zinc-800 text-[10px]" style={{ cursor: isInline ? 'default' : 'pointer' }}>
                {!isInline && <input
                  type="checkbox"
                  checked={selected.size > 0 ? selected.has(o.id) : o.running}
                  onChange={() => toggleOutput(o.id)}
                  className="accent-orange-500"
                />}
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${o.running ? 'bg-green-400' : o.error ? 'bg-amber-400' : 'bg-zinc-500'}`} />
                <span className="text-zinc-300 truncate">{o.name}</span>
              </label>
            ))}
          </div>
          {!isInline && (
          <div className="border-t border-zinc-700 p-1.5 flex gap-1.5">
            <button
              onClick={handleStartStop}
              className="flex-1 py-1 rounded text-[9px] font-bold bg-green-700 text-white hover:bg-green-600 disabled:opacity-40"
              disabled={starting}
            >
              {selected.size > 0
                ? group.outputs.some(o => selected.has(o.id) && o.running) ? 'Stop' : 'Start'
                : hasRunning ? 'Stop All' : 'Start All'}
            </button>
            <button onClick={() => setOpen(false)} className="px-2 py-1 rounded text-[9px] text-zinc-400 hover:text-white">✕</button>
          </div>
          )}
          {/* Clip Creator link for running MPEG-TS recorders */}
          {group.type === 'recorder' && group.outputs.some(o => o.running) && (
          <div className="border-t border-zinc-700 px-2 py-1.5">
            <a href={`/pane/clipcreator?production=${productionId}`} target="_blank"
              className="text-[9px] text-orange-400 hover:text-orange-300 flex items-center gap-1">
              <span>✂️</span> Create Clips
            </a>
          </div>
          )}
          {isInline && (
          <div className="border-t border-zinc-700 p-1.5 flex gap-1.5">
            <button onClick={() => setOpen(false)} className="flex-1 py-1 rounded text-[9px] text-zinc-500">auto (inline)</button>
          </div>
          )}
        </div>
      )}
    </div>
  )
}

export function OutputSelector({ productionId }: { productionId: string | null }) {
  const [groups, setGroups] = useState<OutputTypeGroup[]>([])
  const [refreshKey, setRefreshKey] = useState(0)

  const refresh = useCallback(() => setRefreshKey(k => k + 1), [])

  useEffect(() => {
    if (!productionId) { setGroups([]); return }
    let cancelled = false

    void (async () => {
      try {
        const [production, allOutputs] = await Promise.all([
          request<{ outputAssignments?: Array<{ outputId: string }> }>(`/api/v1/productions/${productionId}`),
          request<Array<{ id: string; name: string; outputType: string; url?: string }>>('/api/v1/outputs').catch(() => []),
        ])
        if (cancelled) return

        const assignedIds = new Set((production.outputAssignments ?? []).map(a => a.outputId))
        const assigned = allOutputs.filter(o => assignedIds.has(o.id) && o.outputType !== 'whep')

        // Inline output types (auto-started with production, no separate flow)
        const INLINE_TYPES = new Set(['whep'])

        // Check running status for each
        const withStatus = await Promise.all(assigned.map(async o => {
          if (INLINE_TYPES.has(o.outputType)) {
            // Inline outputs are always "running" when production is active
            return { ...o, running: true, error: undefined as string | undefined, health: 'inline' as string }
          }
          try {
            const s = await request<{ state: string; health?: string }>(`/api/v1/productions/${productionId}/outputs/${o.id}/status`)
            const errorMsg = s.health === 'error' ? 'Pipeline failed'
              : s.health === 'no_clients' ? 'No SRT client'
              : undefined
            return { ...o, running: s.state === 'running', error: errorMsg, health: s.health }
          } catch {
            return { ...o, running: false, error: undefined as string | undefined }
          }
        }))

        // Group by output type
        const grouped = new Map<string, OutputInfo[]>()
        for (const o of withStatus) {
          const t = o.outputType as string
          if (!grouped.has(t)) grouped.set(t, [])
          grouped.get(t)!.push(o)
        }

        const result: OutputTypeGroup[] = []
        for (const [type, outputs] of grouped) {
          result.push({
            type: type as OutputType,
            label: TYPE_LABELS[type] ?? type.toUpperCase(),
            color: TYPE_COLORS[type] ?? '#888',
            outputs,
          })
        }
        if (!cancelled) setGroups(result)
      } catch { /* server unreachable */ }
    })()

    return () => { cancelled = true }
  }, [productionId, refreshKey])

  if (groups.length === 0) return null

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-zinc-600 text-[10px] font-semibold uppercase tracking-wider">OUTPUT</span>
      <span className="text-zinc-700 text-[9px]">►</span>
      {groups.map(g => (
        <OutputDropdown key={g.type} group={g} productionId={productionId!} onStatusChange={refresh} />
      ))}
    </div>
  )
}
