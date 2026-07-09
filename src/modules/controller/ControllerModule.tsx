import { useCallback, useEffect } from 'react'
import type { SendFn } from '@/studio/types'
import { eventBus } from '@/shared/event-bus'
import { request } from '@/shared/api'
import { useControllerStore, type SourceAssignment, type GraphicAssignment, type ControllerMacro } from './controller.store'
import { useControllerMessages } from './controller.messages'
import { SourceBus } from './SourceBus'
import { TransitionPanel } from './TransitionPanel'
import { MacroBar } from './MacroBar'

const CONTROLLER_OPTIONS_KEY = 'ol-studio-controller-options'

/** Test source display names — backend uses internal IDs ('__test1__', etc.) but the UI shows descriptive labels. */
const VIRTUAL_SOURCE_NAMES: Record<string, string> = { '__test1__': 'PINWHEEL', '__test2__': 'COLORS' }

// ─── Raw API shapes (subset of the backend production/source/graphic/macro docs) ──
interface RawProduction {
  _id: string
  sources?: Array<{ sourceId: string; mixerInput: string }>
  graphicAssignments?: Array<{ graphicId: string; dskInput: string }>
  values?: Record<string, string | number | boolean>
  stromFlowId?: string
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

export function ControllerModule({ send, productionId }: { send: SendFn; productionId: string | null }) {
  const setActiveProduction = useControllerStore((s) => s.setActiveProduction)
  const setProductionData = useControllerStore((s) => s.setProductionData)
  const setMacros = useControllerStore((s) => s.setMacros)
  const setVisibleTransitions = useControllerStore((s) => s.setVisibleTransitions)

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
          name: sources.find((s) => s.id === a.sourceId)?.name ?? VIRTUAL_SOURCE_NAMES[a.sourceId] ?? a.mixerInput,
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

  const doSelectPvwPip = useCallback((pip: number) => {
    useControllerStore.getState().setPvwPip(pip)
    send({ type: 'SELECT_PVW_PIP', pip })
  }, [send])

  const doHotCutPip = useCallback((pip: number) => {
    const store = useControllerStore.getState()
    store.setPvwPip(pip)
    send({ type: 'SELECT_PVW_PIP', pip })
    // Regular TAKE — Strom's transition engine handles PiP swap automatically
    send({ type: 'TAKE' })
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
      {/* Panels — horizontal: SourceBus | TransitionPanel | MacroBar */}
      <div className="flex flex-1 min-h-0 gap-1 overflow-x-auto">
        <div className="flex-1 min-w-0">
          <SourceBus onSelectPvw={doSelectPvw} onHotCut={doHotCut} onSelectPvwPip={doSelectPvwPip} onHotCutPip={doHotCutPip} />
        </div>
        <TransitionPanel onCut={doCut} onAuto={doAuto} onFtb={doFtb} onSetOvl={doSetOvl} className="shrink-0" />
        <MacroBar onExec={doMacroExec} />
      </div>
    </div>
  )
}
