import { useEffect, useRef, useState, type FC } from 'react'
import { WsProvider, useWs } from '@/studio/WsProvider'
import { eventBus } from '@/shared/event-bus'
import { ModuleHeader } from '@/studio/ModuleHeader'
import { getModuleById } from '@/studio/ModuleRegistry'
import { isModuleVisible, setModuleVisible, useVisibilityVersion } from '@/studio/SlotLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { TimerBar } from '@/studio/TimerBar'
import { DskPanel } from '@/studio/DskPanel'
import { Modal } from '@/components/ui/Modal'
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
import { useViewerStore } from '@/store/viewer.store'
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
  const isMuted            = useViewerStore(s => s.isMuted)
  const setMuted           = useViewerStore(s => s.setMuted)
  const mvRef              = useRef<HTMLDivElement>(null)
  const pgmRef             = useRef<HTMLDivElement>(null)
  const [audioOptionsOpen, setAudioOptionsOpen] = useState(false)
  const [controllerOptionsOpen, setControllerOptionsOpen] = useState(false)
  const afvRampUpMs   = useProductionStore((s) => s.afvRampUpMs)
  const afvRampDownMs = useProductionStore((s) => s.afvRampDownMs)
  const [rampUpMsText, setRampUpMsText] = useState(() => String(afvRampUpMs))
  const [rampDownMsText, setRampDownMsText] = useState(() => String(afvRampDownMs))
  useEffect(() => {
    if (audioOptionsOpen) {
      setRampUpMsText(String(afvRampUpMs))
      setRampDownMsText(String(afvRampDownMs))
    }
  }, [audioOptionsOpen, afvRampUpMs, afvRampDownMs])
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
                className={`cursor-pointer transition-colors ${vis(id) ? 'text-orange-500' : 'text-zinc-400'}`}
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
              <div className="flex-1 min-w-0 min-h-0 flex flex-col" ref={mvRef}>
                <ModuleHeader icon={getModuleById('multiviewer')?.icon ?? <></>} label="Multiviewer"
                  onHide={() => setModuleVisible('multiviewer', false)}
                  onPopOut={() => window.open(`/pane/multiviewer?production=${productionId}`, '_blank', 'noopener')}
                  fullscreenRef={mvRef}
                  tooltip="Shows all camera sources in a grid. Use the audio track selector to switch between PGM, monitor, and AUX mixes. Click the speaker to toggle monitor audio. Pop out into a separate window for a dedicated confidence monitor. The position of the multiviewer relative to PGM can be swapped in the production config.">
                  <button title={isMuted ? 'Unmute monitor' : 'Mute monitor'}
                    onClick={() => setMuted(!isMuted)}
                    className="cursor-pointer hover:text-orange-500 transition-colors">
                    {isMuted ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                        <line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
                      </svg>
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                      </svg>
                    )}
                  </button>
                </ModuleHeader>
                <div className="flex-1 min-h-0 overflow-hidden">
                  <ModuleRenderer moduleId="multiviewer" send={send} productionId={productionId} />
                </div>
              </div>
            )}
            {pgmVisible && (
              <div className="flex-1 min-w-0 min-h-0 flex flex-col" ref={pgmRef}>
                <ModuleHeader icon={getModuleById('pgm')?.icon ?? <></>} label="PGM"
                  onHide={() => setModuleVisible('pgm', false)}
                  onPopOut={() => window.open(`/pane/pgm?production=${productionId}`, '_blank', 'noopener')}
                  fullscreenRef={pgmRef}
                  tooltip="Live programme output — exactly what is going to air. Use the audio track selector to monitor PGM, monitor bus, or AUX. Pop out into a separate window for a dedicated programme monitor.">
                  <button title={isMuted ? 'Unmute monitor' : 'Mute monitor'}
                    onClick={() => setMuted(!isMuted)}
                    className="cursor-pointer hover:text-orange-500 transition-colors">
                    {isMuted ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                        <line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
                      </svg>
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                      </svg>
                    )}
                  </button>
                </ModuleHeader>
                <div className="flex-1 min-h-0 overflow-hidden">
                  <ModuleRenderer moduleId="pgm" send={send} productionId={productionId} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Controller + FX + PiP + Media Player + Audio row */}
        {showBottomRow && (
          <div className="flex flex-none pt-2 pb-3 gap-0" style={{ height: 392 }}>
            {controllerVisible && (
              <div className="px-3 flex flex-col gap-2 min-w-0 flex-1 h-full">
                <ModuleHeader icon={getModuleById('controller')?.icon ?? <></>} label="Controller"
                  onHide={() => setModuleVisible('controller', false)}
                  onPopOut={() => window.open(`/pane/controller?production=${productionId}`, '_blank', 'noopener')}
                  onSettings={() => setControllerOptionsOpen(true)}
                  tooltip="Vision mixer controls. Click a source to set it on preview, then press Cut or Auto to take it to programme. Toggle FTB to fade to black. Use DSK to layer graphics over programme. Press the gear icon to set transition types and source timing offsets." />
                <div className="flex-1 min-h-0 overflow-hidden">
                  <ModuleRenderer moduleId="controller" send={send} productionId={productionId} />
                </div>
                {/* DSK strip — directly below the controller, same as existing Studio */}
                <DskPanel send={send} />
              </div>
            )}
            {looksVisible && (
              <div className={`flex flex-col shrink-0 h-full ${controllerVisible ? 'pr-3' : 'px-3'}`} style={{ width: 280 }}>
                <ModuleHeader icon={getModuleById('looks')?.icon ?? <></>} label="Looks"
                  tooltip="Per-source GPU shader effects. Select a source tab, then pick an effect type and adjust its parameters. Changes apply live to the programme output. Requires a GPU node — a note is shown if unavailable."
                  onHide={() => setModuleVisible('looks', false)} />
                <div className="flex-1 min-h-0 overflow-hidden">
                  <ModuleRenderer moduleId="looks" send={send} productionId={productionId} />
                </div>
              </div>
            )}
            {pipVisible && numPips > 0 && (
              <div className={`${controllerVisible || looksVisible ? 'pr-3' : 'px-3'} flex flex-col shrink-0 h-full overflow-hidden`} style={{ width: 540 }}>
                <ModuleHeader icon={getModuleById('pip')?.icon ?? <></>} label="PiP Editor"
                  tooltip="Picture-in-Picture editor. Select a PiP slot, then drag zones on the canvas to position them. Assign sources to zones by clicking the source chips. Use Crop / Zoom to pan and zoom individual sources within a zone. Set a border colour and width per zone. Click Take to bring the PiP to programme."
                  onHide={() => setModuleVisible('pip', false)}
                  onPopOut={() => window.open(`/pane/pip?production=${productionId}`, '_blank', 'noopener')} />
                <div className="flex-1 min-h-0 overflow-hidden">
                  <ModuleRenderer moduleId="pip" send={send} productionId={productionId} />
                </div>
              </div>
            )}
            {mediaplayerVisible && hasMediaPlayers && (
              <div className={`${controllerVisible || looksVisible ? 'pr-3' : 'px-3'} flex flex-col shrink-0 h-full overflow-hidden`} style={{ width: 360 }}>
                <ModuleHeader icon={getModuleById('mediaplayer')?.icon ?? <></>} label="Media Player"
                  tooltip="Media player. Browse and select clips from the media folder to build a playlist. Use transport controls to play, pause, stop and skip clips. The video and audio output is routed to the vision mixer and audio mixer as a regular source."
                  onHide={() => setModuleVisible('mediaplayer', false)}
                  onPopOut={() => window.open(`/pane/mediaplayer?production=${productionId}`, '_blank', 'noopener')} />
                <div className="flex-1 min-h-0 overflow-hidden">
                  <ModuleRenderer moduleId="mediaplayer" send={send} productionId={productionId} />
                </div>
              </div>
            )}
            {audioVisible && (
              <div className={`flex flex-col flex-1 min-w-0 h-full ${controllerVisible || looksVisible ? 'pr-3' : 'px-3'}`}>
                <ModuleHeader icon={getModuleById('audio')?.icon ?? <></>} label="Audio"
                  onHide={() => setModuleVisible('audio', false)}
                  onPopOut={() => window.open(`/pane/audio?production=${productionId}`, '_blank', 'noopener')}
                  onSettings={() => setAudioOptionsOpen(true)}
                  tooltip="Audio mixer. Drag faders or click the level to adjust channel volume. Toggle On/Off to mute a channel. Use AUX sends to route audio to commentary or recording feeds. Group channels together to control them as one. Adjust the monitor level with the master fader. Press the gear icon to set AFV ramp times." />
                <div className="flex-1 min-h-0 overflow-hidden">
                  <ModuleRenderer moduleId="audio" send={send} productionId={productionId} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Audio options modal ──────────────────────────────────────────────── */}
      <Modal open={audioOptionsOpen} title="Audio Options" onClose={() => setAudioOptionsOpen(false)} className="max-w-xs">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 shrink-0" style={{ width: 80 }}>Ramp Up</span>
            <div className="flex items-center gap-1.5 border border-zinc-700 rounded bg-zinc-900 px-2 py-1">
              <input type="number" min={0} max={5000} step={50} value={rampUpMsText}
                onChange={(e) => { setRampUpMsText(e.target.value) }}
                onBlur={() => {
                  const parsed = parseInt(rampUpMsText, 10)
                  const clamped = isNaN(parsed) ? afvRampUpMs : Math.max(0, Math.min(5000, parsed))
                  setRampUpMsText(String(clamped))
                  const down = parseInt(rampDownMsText, 10)
                  send({ type: 'AFV_RAMP_SET', rampUpMs: clamped, rampDownMs: isNaN(down) ? afvRampDownMs : Math.max(0, Math.min(5000, down)) })
                }}
                className="w-16 bg-transparent border-none text-[9px] font-bold text-orange-500 text-right focus:outline-none" />
              <span className="text-[9px] font-bold text-zinc-600 shrink-0">ms</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 shrink-0" style={{ width: 80 }}>Ramp Down</span>
            <div className="flex items-center gap-1.5 border border-zinc-700 rounded bg-zinc-900 px-2 py-1">
              <input type="number" min={0} max={5000} step={50} value={rampDownMsText}
                onChange={(e) => { setRampDownMsText(e.target.value) }}
                onBlur={() => {
                  const parsed = parseInt(rampDownMsText, 10)
                  const clamped = isNaN(parsed) ? afvRampDownMs : Math.max(0, Math.min(5000, parsed))
                  setRampDownMsText(String(clamped))
                  const up = parseInt(rampUpMsText, 10)
                  send({ type: 'AFV_RAMP_SET', rampUpMs: isNaN(up) ? afvRampUpMs : Math.max(0, Math.min(5000, up)), rampDownMs: clamped })
                }}
                className="w-16 bg-transparent border-none text-[9px] font-bold text-orange-500 text-right focus:outline-none" />
              <span className="text-[9px] font-bold text-zinc-600 shrink-0">ms</span>
            </div>
          </div>
        </div>
      </Modal>
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
