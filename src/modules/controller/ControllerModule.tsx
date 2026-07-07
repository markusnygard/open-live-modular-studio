import { useCallback, useEffect } from 'react'
import type { SendFn } from '@/studio/types'
import { eventBus } from '@/shared/event-bus'
import { request } from '@/shared/api'
import { useControllerStore, type SourceAssignment, type GraphicAssignment, type ControllerMacro } from './controller.store'
import { useControllerMessages } from './controller.messages'
import { SourceBus } from './SourceBus'
import { TransitionPanel } from './TransitionPanel'
import { DskPanel } from './DskPanel'
import { MacroBar } from './MacroBar'
import { ControllerOptionsModal } from './ControllerOptionsModal'

const CONTROLLER_OPTIONS_KEY = 'ol-studio-controller-options'

// ─── Raw API shapes (subset of the backend production/source/graphic/macro docs) ──
interface RawProduction {
  _id: string
  sources?: Array<{ sourceId: string; mixerInput: string }>
  graphicAssignments?: Array<{ graphicId: string; dskInput: string }>
  values?: Record<string, string | number | boolean>
}
interface RawSource { id: string; name: string }
interface RawGraphic { id: string; name: string }
interface RawMacro { id: string; slot: number; label: string; color: string }

function loadVisibleTransitions(): string[] | null {
  try {
    const raw = localStorage.getItem(CONTROLLER_OPTIONS_KEY)
    if (raw) {
      const parsed: unknown = JSON.parse(raw)
      if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const p = parsed as Record<string, unknown>
        if (Array.isArray(p['visibleTransitions'])) {
          const vt = (p['visibleTransitions'] as unknown[]).filter((t): t is string => typeof t === 'string')
          if (vt.length > 0) return vt
        }
      }
    }
  } catch {}
  return null
}

function GearIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
      <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  )
}

export function ControllerModule({ send, productionId }: { send: SendFn; productionId: string | null }) {
  const setActiveProduction = useControllerStore((s) => s.setActiveProduction)
  const setProductionData = useControllerStore((s) => s.setProductionData)
  const setMacros = useControllerStore((s) => s.setMacros)
  const setVisibleTransitions = useControllerStore((s) => s.setVisibleTransitions)
  const setOptionsOpen = useControllerStore((s) => s.setOptionsOpen)

  // Register inbound WS handlers (tally, OVL, DSK, source offsets) against the shared connection.
  useControllerMessages()

  // Restore persisted transition selection on mount.
  useEffect(() => {
    const persisted = loadVisibleTransitions()
    if (persisted) setVisibleTransitions(persisted)
  }, [setVisibleTransitions])

  // Emit PGM/PVW change events whenever the busses change (user action or server tally).
  useEffect(() => {
    return useControllerStore.subscribe((state, prev) => {
      if (state.pgmInput !== prev.pgmInput && state.pgmInput) {
        eventBus.emit('PGM_SOURCE_CHANGED', { sourceId: state.pgmInput })
      }
      if (state.pvwInput !== prev.pvwInput && state.pvwInput) {
        eventBus.emit('PVW_SOURCE_CHANGED', { sourceId: state.pvwInput })
      }
    })
  }, [])

  // Load production data (sources, graphics, macros) when the production changes.
  useEffect(() => {
    setActiveProduction(productionId)
    if (!productionId) return
    let cancelled = false

    void (async () => {
      try {
        const [production, sources, graphics, macros] = await Promise.all([
          request<RawProduction>(`/api/v1/productions/${productionId}`),
          request<RawSource[]>('/api/v1/sources').catch(() => [] as RawSource[]),
          request<RawGraphic[]>('/api/v1/graphics').catch(() => [] as RawGraphic[]),
          request<RawMacro[]>(`/api/v1/productions/${productionId}/macros`).catch(() => [] as RawMacro[]),
        ])
        if (cancelled) return

        const sourceAssignments: SourceAssignment[] = (production.sources ?? []).map((a) => ({
          mixerInput: a.mixerInput,
          sourceId: a.sourceId,
          name: sources.find((s) => s.id === a.sourceId)?.name ?? a.mixerInput,
        }))
        const graphicAssignments: GraphicAssignment[] = (production.graphicAssignments ?? []).map((g) => ({
          dskInput: g.dskInput,
          graphicId: g.graphicId,
          graphicName: graphics.find((x) => x.id === g.graphicId)?.name ?? '',
        }))
        const controllerMacros: ControllerMacro[] = macros.map((m) => ({
          id: m.id, slot: m.slot, label: m.label, color: m.color,
        }))

        setProductionData({ sources: sourceAssignments, graphicAssignments, values: production.values ?? {} })
        setMacros(controllerMacros)
      } catch {
        // production not found / server unreachable — leave the module in its empty state
      }
    })()

    return () => { cancelled = true }
  }, [productionId, setActiveProduction, setProductionData, setMacros])

  // ─── Action handlers ─────────────────────────────────────────────────────────
  const doCut = useCallback(() => {
    const { pvwInput, cut } = useControllerStore.getState()
    cut()
    send({ type: 'CUT', mixerInput: pvwInput ?? '' })
  }, [send])

  const doAuto = useCallback(() => {
    const { pvwInput, transitionType, transitionDurationMs, auto } = useControllerStore.getState()
    auto()
    send({ type: 'TRANSITION', mixerInput: pvwInput ?? '', transitionType, durationMs: transitionDurationMs })
  }, [send])

  const doFtb = useCallback(() => {
    const { ftb, transitionDurationMs } = useControllerStore.getState()
    ftb()
    send({ type: 'FTB', durationMs: transitionDurationMs })
  }, [send])

  const doSetOvl = useCallback((alpha: number) => {
    send({ type: 'SET_OVL', alpha })
  }, [send])

  const doSelectPvw = useCallback((mixerInput: string) => {
    useControllerStore.getState().setPvw(mixerInput)
    send({ type: 'SET_PVW', mixerInput })
  }, [send])

  const doHotCut = useCallback((mixerInput: string) => {
    const { setPvw, cut } = useControllerStore.getState()
    setPvw(mixerInput)
    cut()
    send({ type: 'CUT', mixerInput })
  }, [send])

  const doDskToggle = useCallback((layer: number, visible: boolean) => {
    send({ type: 'DSK_TOGGLE', layer, visible })
  }, [send])

  const doMacroExec = useCallback((macroId: string) => {
    send({ type: 'MACRO_EXEC', macroId })
  }, [send])

  // ─── Keyboard shortcuts ────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.code === 'Space') { e.preventDefault(); doCut(); return }
      if (e.code === 'Enter') { e.preventDefault(); doAuto(); return }
      if (e.code === 'KeyF')  { e.preventDefault(); doFtb(); return }
      if (e.code === 'KeyK') {
        e.preventDefault()
        const next = !(useControllerStore.getState().dskState[0] ?? false)
        send({ type: 'DSK_TOGGLE', layer: 0, visible: next })
        return
      }
      // 1–9: select PVW source; Shift+1–9: hot-cut to PGM
      const digit = e.code.startsWith('Digit') ? parseInt(e.code.slice(5), 10) : NaN
      if (!isNaN(digit) && digit >= 1 && digit <= 9) {
        e.preventDefault()
        const { sources, pgmInput } = useControllerStore.getState()
        const sorted = [...sources].sort((a, b) => a.mixerInput.localeCompare(b.mixerInput))
        const source = sorted[digit - 1]
        if (!source) return
        if (pgmInput === source.mixerInput) return
        if (e.shiftKey) doHotCut(source.mixerInput)
        else doSelectPvw(source.mixerInput)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [doCut, doAuto, doFtb, doHotCut, doSelectPvw, send])

  return (
    <div className="flex flex-col h-full min-w-0 gap-1 p-1">
      {/* Header — label + options */}
      <div className="flex items-center gap-1.5 text-zinc-500 shrink-0">
        <span className="text-[10px] font-semibold uppercase tracking-widest">Controller</span>
        <button
          type="button"
          onClick={() => setOptionsOpen(true)}
          title="Controller options"
          className="cursor-pointer hover:text-zinc-200 transition-colors"
        >
          <GearIcon />
        </button>
      </div>

      {/* Panels — horizontal: SourceBus | TransitionPanel | DskPanel | MacroBar */}
      <div className="flex flex-1 min-h-0 gap-1 overflow-x-auto">
        <div className="flex-1 min-w-0">
          <SourceBus onSelectPvw={doSelectPvw} onHotCut={doHotCut} />
        </div>
        <TransitionPanel onCut={doCut} onAuto={doAuto} onFtb={doFtb} onSetOvl={doSetOvl} className="shrink-0" />
        <DskPanel onToggle={doDskToggle} />
        <MacroBar onExec={doMacroExec} />
      </div>

      <ControllerOptionsModal send={send} />
    </div>
  )
}
