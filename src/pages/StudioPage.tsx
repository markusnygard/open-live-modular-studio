import { useEffect, type FC } from 'react'
import { WsProvider, useWs } from '@/studio/WsProvider'
import { eventBus } from '@/shared/event-bus'
import { getModuleById } from '@/studio/ModuleRegistry'
import { isModuleVisible, setModuleVisible, useVisibilityVersion } from '@/studio/SlotLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { TimerBar } from '@/studio/TimerBar'
import { DskPanel } from '@/studio/DskPanel'
import { useIsOnAir } from '@/studio/useIsOnAir'
import type { SendFn } from '@/studio/types'
import {
  MultiviewerIcon, MonitorIcon, ControllerIcon, AudioIcon, LooksIcon, PipIcon, MediaPlayerIcon,
  SrtStreamIcon, EfpStreamIcon, RecorderIcon, NdiIcon, SdiIcon,
} from '@/studio/icons'
import { useProductionStore } from '@/store/production.store'
import { useProductionsStore } from '@/store/productions.store'
import { useSourcesStore } from '@/store/sources.store'
import { useOutputsStore } from '@/store/outputs.store'
import type { OutputType } from '@/lib/api'

// Ensure every module registers itself in the shared registry regardless of
// which entry point loaded this page.
import '@/modules/multiviewer'
import '@/modules/pgm'
import '@/modules/controller'
import '@/modules/audio'
import '@/modules/looks'
import '@/modules/pip'
import '@/modules/mediaplayer'
import '@/modules/outputs/srt-stream'
import '@/modules/outputs/efp-stream'
import '@/modules/outputs/recording'
import '@/modules/outputs/ndi-output'
import '@/modules/outputs/sdi-output'

// ─── Module renderer ────────────────────────────────────────────────────────────
// Looks a module up by id, runs its onRegister lifecycle against the shared WS +
// event bus, and renders its component within the surrounding StudioPage layout.

function ModuleRenderer({ moduleId, send, productionId }: { moduleId: string; send: SendFn; productionId: string | null }) {
  const mod = getModuleById(moduleId)
  const Component = mod?.component

  useEffect(() => {
    if (!mod?.onRegister) return
    return mod.onRegister({ send, eventBus, productionId })
  }, [mod, send, productionId])

  if (!Component) return null
  return <Component send={send} productionId={productionId} />
}

// ─── Header icon groups ─────────────────────────────────────────────────────────

const OUTPUT_ICONS: { type: OutputType; Icon: FC }[] = [
  { type: 'mpegtssrt', Icon: SrtStreamIcon },
  { type: 'efpsrt',    Icon: EfpStreamIcon },
  { type: 'recorder',  Icon: RecorderIcon  },
  { type: 'ndi',       Icon: NdiIcon        },
  { type: 'sdi',       Icon: SdiIcon        },
]

// ─── Inner (inside WsProvider) ────────────────────────────────────────────────────

function StudioPageInner({ productionId }: { productionId: string }) {
  const { send } = useWs()

  // Re-render when any module's persisted visibility flips.
  useVisibilityVersion()

  const activeProduction = useProductionsStore((s) => s.productions.find((p) => p.id === productionId))
  const sources = useSourcesStore((s) => s.sources)
  const outputs = useOutputsStore((s) => s.outputs)
  const isOnAir = useIsOnAir()

  const numPips = activeProduction?.values?.num_pips !== undefined
    ? parseInt(String(activeProduction.values.num_pips), 10)
    : 0

  const mediaPlayers = (activeProduction?.sources ?? [])
    .map((s) => sources.find((src) => src.id === s.sourceId))
    .filter((s) => s?.streamType === 'mediaplayer')
  const hasMediaPlayers = mediaPlayers.length > 0

  // Output types actually assigned to this production.
  const assignedOutputTypes = new Set(
    (activeProduction?.outputAssignments ?? [])
      .map((a) => outputs.find((o) => o.id === a.outputId)?.outputType)
      .filter((t): t is OutputType => t !== undefined),
  )

  // Module toggle icons — id must match a registered module.
  const PANEL_ICONS: { id: string; Icon: FC }[] = [
    { id: 'multiviewer', Icon: MultiviewerIcon },
    { id: 'pgm',         Icon: MonitorIcon     },
    { id: 'controller',  Icon: ControllerIcon  },
    ...(numPips > 0 ? [{ id: 'pip', Icon: PipIcon }] : []),
    { id: 'audio',       Icon: AudioIcon        },
    { id: 'looks',       Icon: LooksIcon        },
    ...(hasMediaPlayers ? [{ id: 'mediaplayer', Icon: MediaPlayerIcon }] : []),
  ]

  const vis = (id: string) => {
    const mod = getModuleById(id)
    return mod ? isModuleVisible(mod) : false
  }
  const toggle = (id: string) => setModuleVisible(id, !vis(id))

  const mvVisible          = vis('multiviewer')
  const pgmVisible         = vis('pgm')
  const controllerVisible  = vis('controller')
  const audioVisible       = vis('audio')
  const looksVisible       = vis('looks')
  const pipVisible         = vis('pip')
  const mediaplayerVisible = vis('mediaplayer')

  const showBottomRow =
    controllerVisible || audioVisible || looksVisible ||
    (pipVisible && numPips > 0) || (mediaplayerVisible && hasMediaPlayers)

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden" style={{ background: '#000000' }}>
      <PageHeader
        title={
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-white">
              {activeProduction?.name ?? 'Studio'}
            </span>
            {/* Module toggle icons */}
            {PANEL_ICONS.map(({ id, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => toggle(id)}
                className={`cursor-pointer transition-colors ${vis(id) ? 'text-orange-500' : 'text-zinc-600'}`}
              >
                <Icon />
              </button>
            ))}
          </div>
        }
        actions={
          <div className="flex items-stretch gap-3">
            {/* Output group — only shown for output types configured for this production */}
            {assignedOutputTypes.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-zinc-600 text-[10px] font-semibold uppercase tracking-wider">OUTPUT</span>
                {OUTPUT_ICONS.map(({ type, Icon }) => (
                  assignedOutputTypes.has(type) && (
                    <span key={type} className="text-zinc-600">
                      <Icon />
                    </span>
                  )
                ))}
              </div>
            )}

            {/* Timer bar + LIVE button — flush together, same height */}
            <div className="flex items-stretch">
              <TimerBar />
              <div
                className={[
                  'px-4 flex items-center text-[11px] font-bold uppercase tracking-widest border select-none',
                  isOnAir
                    ? 'text-white border-red-600'
                    : 'text-zinc-500 bg-zinc-950 border-l-0 border-zinc-800',
                ].join(' ')}
                style={isOnAir ? { background: 'rgba(160,0,0,0.20)', borderColor: '#cc0000' } : {}}
              >
                <span className="flex items-center gap-1.5">
                  <span style={isOnAir ? { color: '#ff2222' } : {}}>●</span>
                  LIVE
                </span>
              </div>
            </div>
          </div>
        }
      />

      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {/* Video monitors row — Multiviewer + PGM side by side */}
        {(mvVisible || pgmVisible) && (
          <div className="flex-1 min-h-0 px-4 pt-2 pb-2 overflow-hidden flex flex-row items-stretch gap-6">
            {mvVisible && (
              <div className="flex-1 min-w-0 min-h-0 flex flex-col">
                <ModuleRenderer moduleId="multiviewer" send={send} productionId={productionId} />
              </div>
            )}
            {pgmVisible && (
              <div className="flex-1 min-w-0 min-h-0 flex flex-col">
                <ModuleRenderer moduleId="pgm" send={send} productionId={productionId} />
              </div>
            )}
          </div>
        )}

        {/* Controller + FX + PiP + Media Player + Audio row */}
        {showBottomRow && (
          <div className="flex flex-none pt-2 pb-3 gap-0" style={{ height: 392 }}>
            {controllerVisible && (
              <div className="px-3 flex flex-col gap-2 min-w-0 flex-1 h-full">
                <div className="flex-1 min-h-0 overflow-hidden">
                  <ModuleRenderer moduleId="controller" send={send} productionId={productionId} />
                </div>
                {/* DSK strip — directly below the controller, same as existing Studio */}
                <DskPanel send={send} />
              </div>
            )}
            {looksVisible && (
              <div className={`flex flex-col shrink-0 h-full ${controllerVisible ? 'pr-3' : 'px-3'}`} style={{ width: 280 }}>
                <ModuleRenderer moduleId="looks" send={send} productionId={productionId} />
              </div>
            )}
            {pipVisible && numPips > 0 && (
              <div className={`${controllerVisible || looksVisible ? 'pr-3' : 'px-3'} flex flex-col shrink-0 h-full overflow-hidden`} style={{ width: 540 }}>
                <ModuleRenderer moduleId="pip" send={send} productionId={productionId} />
              </div>
            )}
            {mediaplayerVisible && hasMediaPlayers && (
              <div className={`${controllerVisible || looksVisible ? 'pr-3' : 'px-3'} flex flex-col shrink-0 h-full overflow-hidden`} style={{ width: 360 }}>
                <ModuleRenderer moduleId="mediaplayer" send={send} productionId={productionId} />
              </div>
            )}
            {audioVisible && (
              <div className={`flex flex-col flex-1 min-w-0 h-full ${controllerVisible || looksVisible ? 'pr-3' : 'px-3'}`}>
                <ModuleRenderer moduleId="audio" send={send} productionId={productionId} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Outer (data + WsProvider) ────────────────────────────────────────────────────

export function StudioPage({ productionId }: { productionId: string }) {
  const fetchProductions = useProductionsStore((s) => s.fetchAll)
  const fetchSources = useSourcesStore((s) => s.fetchAll)
  const fetchOutputs = useOutputsStore((s) => s.fetchAll)
  const setActiveProduction = useProductionStore((s) => s.setActiveProduction)
  const activeProductionId = useProductionStore((s) => s.activeProductionId)

  useEffect(() => {
    void fetchProductions()
    void fetchSources()
    void fetchOutputs()
  }, [fetchProductions, fetchSources, fetchOutputs])

  useEffect(() => {
    if (productionId !== activeProductionId) setActiveProduction(productionId)
    eventBus.emit('PRODUCTION_ACTIVATED', { productionId })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productionId])

  return (
    <WsProvider productionId={productionId} eventBus={eventBus}>
      <StudioPageInner productionId={productionId} />
    </WsProvider>
  )
}
