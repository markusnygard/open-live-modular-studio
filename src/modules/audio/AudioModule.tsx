import { useCallback, useEffect, useMemo, useState } from 'react'
import type { SendFn } from '@/studio/types'
import { eventBus } from '@/shared/event-bus'
import { request } from '@/shared/api'
import { useAudioStore, type ApiAudioElement } from './audio.store'
import { useAudioMessages } from './audio.messages'
import { C_MAIN, C_AUX, C_GRP, C_IN, THUMB_CSS_W } from './audio.constants'
import { ChannelStrip } from './components/ChannelStrip'
import { AuxChannelStrip } from './components/AuxChannelStrip'
import { AuxMasterStrip } from './components/AuxMasterStrip'
import { GrpMasterStrip } from './components/GrpMasterStrip'
import { MonitorMasterStrip } from './components/MonitorMasterStrip'
import { SectionBar } from './components/SectionBar'
import { FaderDimsProvider } from './components/Fader'

// Fader height inside the 392 px bottom slot — sized so the surrounding chrome
// (header, H/G/C/E row, ON/AFV row, pan) still fits without heavy scrolling.
const MODULE_FADER_H = 250

// ── Raw production shape (subset — just the config values we read) ──────────────
interface RawProduction {
  values?: Record<string, string | number | boolean>
}

// ── Section collapse persistence ─────────────────────────────────────────────
const SECTIONS_KEY = 'ol-audio-module-sections'

interface SectionState {
  main: { out: boolean; groups: boolean; in: boolean }
  aux: { out: boolean; in: boolean }
}

const DEFAULT_SECTIONS: SectionState = {
  main: { out: false, groups: false, in: false },
  aux: { out: false, in: false },
}

function loadSections(): SectionState {
  try {
    const raw = localStorage.getItem(SECTIONS_KEY)
    if (raw) {
      const parsed: unknown = JSON.parse(raw)
      if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const p = parsed as Record<string, unknown>
        const main = p['main'] !== null && typeof p['main'] === 'object' && !Array.isArray(p['main'])
          ? (p['main'] as Record<string, unknown>)
          : {}
        const aux = p['aux'] !== null && typeof p['aux'] === 'object' && !Array.isArray(p['aux'])
          ? (p['aux'] as Record<string, unknown>)
          : {}
        return {
          main: {
            out: typeof main['out'] === 'boolean' ? main['out'] : DEFAULT_SECTIONS.main.out,
            groups: typeof main['groups'] === 'boolean' ? main['groups'] : DEFAULT_SECTIONS.main.groups,
            in: typeof main['in'] === 'boolean' ? main['in'] : DEFAULT_SECTIONS.main.in,
          },
          aux: {
            out: typeof aux['out'] === 'boolean' ? aux['out'] : DEFAULT_SECTIONS.aux.out,
            in: typeof aux['in'] === 'boolean' ? aux['in'] : DEFAULT_SECTIONS.aux.in,
          },
        }
      }
    }
  } catch {
    /* ignore malformed persisted state */
  }
  return DEFAULT_SECTIONS
}

function saveSections(s: SectionState) {
  try { localStorage.setItem(SECTIONS_KEY, JSON.stringify(s)) } catch { /* ignore */ }
}

function NoContent({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center px-3" style={{ minWidth: 48 }}>
      <p className="text-[9px] text-zinc-700 text-center uppercase">{label}</p>
    </div>
  )
}

type AudioTab = string // 'main' | 'aux-1' | 'aux-2' | …

export function AudioModule({ send, productionId }: { send: SendFn; productionId: string | null }) {
  useAudioMessages()

  const elements = useAudioStore((s) => s.elements)
  const setElements = useAudioStore((s) => s.setElements)

  // Production-derived audio configuration.
  const [numAuxBuses, setNumAuxBuses] = useState(2)
  const [numGroups, setNumGroups] = useState(2)
  const [showEbuMain, setShowEbuMain] = useState(false)
  const [auxBusPre, setAuxBusPre] = useState<Record<number, boolean>>({})

  // PGM/PVW tally — drives the isPgm/isPvw highlight on input strips.
  const [pgmInput, setPgmInput] = useState<string | null>(null)
  const [pvwInput, setPvwInput] = useState<string | null>(null)

  const [activeTab, setActiveTab] = useState<AudioTab>('main')
  const [sections, setSections] = useState<SectionState>(loadSections)

  const faderDims = useMemo(
    () => ({ faderH: MODULE_FADER_H, faderContainerH: MODULE_FADER_H + THUMB_CSS_W }),
    [],
  )

  // Follow PGM/PVW tally via the shared event bus (AFV routing is server-side).
  useEffect(() => {
    const off1 = eventBus.on('PGM_SOURCE_CHANGED', (e: { sourceId: string }) => setPgmInput(e.sourceId))
    const off2 = eventBus.on('PVW_SOURCE_CHANGED', (e: { sourceId: string }) => setPvwInput(e.sourceId))
    return () => { off1(); off2() }
  }, [])

  // Load audio elements + config whenever the production changes.
  useEffect(() => {
    if (!productionId) return
    let cancelled = false

    void (async () => {
      try {
        const [production, els] = await Promise.all([
          request<RawProduction>(`/api/v1/productions/${productionId}`).catch(() => ({} as RawProduction)),
          request<ApiAudioElement[]>(`/api/v1/productions/${productionId}/audio`).catch(() => [] as ApiAudioElement[]),
        ])
        if (cancelled) return

        const values = production.values ?? {}
        const aux = values['num_aux_buses'] !== undefined ? parseInt(String(values['num_aux_buses']), 10) : 2
        const grp = values['num_groups'] !== undefined ? parseInt(String(values['num_groups']), 10) : 2
        setNumAuxBuses(Number.isFinite(aux) ? aux : 2)
        setNumGroups(Number.isFinite(grp) ? grp : 2)
        setShowEbuMain(values['ebu_main'] === true)
        setAuxBusPre(
          Object.fromEntries(
            Array.from({ length: Number.isFinite(aux) ? aux : 2 }, (_, i) => i + 1)
              .map((bus) => [bus, values[`aux${bus}_pre`] !== false]),
          ),
        )

        setElements(els, productionId)
      } catch {
        /* production not found / server unreachable — leave the module empty */
      }
    })()

    return () => { cancelled = true }
  }, [productionId, setElements])

  const auxBuses = useMemo(() => Array.from({ length: numAuxBuses }, (_, i) => i + 1), [numAuxBuses])
  const grpBuses = useMemo(() => Array.from({ length: numGroups }, (_, i) => i + 1), [numGroups])

  const collapsed = sections.main
  const auxCollapsed = sections.aux

  const toggleSection = useCallback((k: keyof SectionState['main']) => setSections((s) => {
    const next = { ...s, main: { ...s.main, [k]: !s.main[k] } }
    saveSections(next)
    return next
  }), [])
  const toggleAuxSection = useCallback((k: keyof SectionState['aux']) => setSections((s) => {
    const next = { ...s, aux: { ...s.aux, [k]: !s.aux[k] } }
    saveSections(next)
    return next
  }), [])

  const mainElement = elements.find((e) => e.elementId === 'main')
  const inputElements = elements.filter((e) => e.elementId !== 'main' && e.mixerInput !== null)
  const hasContent = elements.length > 0

  const TABS: Array<{ id: AudioTab; label: string; color: string }> = [
    { id: 'main', label: 'MAIN', color: C_MAIN.hex },
    ...auxBuses.map((bus) => ({ id: `aux-${bus}`, label: `AUX ${bus}`, color: C_AUX.hex })),
  ]

  const activeAuxBus = activeTab.startsWith('aux-') ? parseInt(activeTab.slice(4), 10) : null

  return (
    <FaderDimsProvider value={faderDims}>
      <div className="flex flex-col h-full min-w-0">
        {/* Header */}
        <div className="flex items-center gap-1.5 text-zinc-500 shrink-0 px-1 py-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest">Audio</span>
          <span className="text-[9px] text-zinc-600">{inputElements.length} ch</span>
        </div>

        <div
          className="border border-zinc-800 overflow-auto flex items-stretch flex-1 min-h-0"
          style={{ background: '#0d0d0d' }}
        >
          {/* Tab selector — vertical, left edge */}
          <div className="flex flex-col shrink-0 border-r border-zinc-800" style={{ width: 20 }}>
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                title={tab.label}
                className="flex-1 flex items-center justify-center transition-colors border-b border-zinc-800 last:border-b-0"
                style={{
                  background: activeTab === tab.id ? `${tab.color}1f` : 'transparent',
                  cursor: 'pointer',
                }}
              >
                <span
                  className="text-[7px] font-bold tracking-widest uppercase whitespace-nowrap"
                  style={{
                    writingMode: 'vertical-rl',
                    transform: 'rotate(180deg)',
                    color: activeTab === tab.id ? tab.color : '#52525b',
                  }}
                >
                  {tab.label}
                </span>
              </button>
            ))}
          </div>

          {!hasContent ? (
            <div className="flex items-center justify-center min-h-[160px] px-4 flex-1">
              <p className="text-[9px] text-zinc-700 text-center uppercase tracking-widest">NO CHANNELS</p>
            </div>
          ) : (
            <>
              {/* ── MAIN tab ─────────────────────────────────────────────────── */}
              {activeTab === 'main' && (
                <>
                  {/* OUT section */}
                  <SectionBar label="OUT" collapsed={collapsed.out} onToggle={() => toggleSection('out')} color={C_MAIN.hex} />
                  {!collapsed.out && (
                    <div className="flex items-stretch shrink-0">
                      {mainElement ? (
                        <ChannelStrip elementId="main" label="MAIN" send={send} showAfv={false} showEbu={showEbuMain} busColor={C_MAIN} />
                      ) : (
                        <NoContent label="NO OUT" />
                      )}
                      <MonitorMasterStrip send={send} />
                    </div>
                  )}

                  {/* GROUPS section */}
                  {grpBuses.length > 0 && (
                    <>
                      <SectionBar label="GRP" collapsed={collapsed.groups} onToggle={() => toggleSection('groups')} color={C_GRP.hex} />
                      {!collapsed.groups && (
                        <div className="flex items-stretch shrink-0">
                          {grpBuses.map((bus) => (
                            <GrpMasterStrip key={bus} grpBus={bus} label={`GRP ${bus}`} send={send} />
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {/* IN section */}
                  <SectionBar label="IN" collapsed={collapsed.in} onToggle={() => toggleSection('in')} color={C_IN.hex} />
                  {!collapsed.in && (
                    <div className="flex items-stretch overflow-x-auto scrollbar-hide">
                      <div className="flex">
                        {inputElements.length === 0 ? (
                          <NoContent label="NO IN" />
                        ) : (
                          inputElements.map((el) => (
                            <ChannelStrip
                              key={el.elementId}
                              elementId={el.elementId}
                              label={el.label}
                              send={send}
                              showAfv
                              showPfl
                              showAfl
                              mixerInput={el.mixerInput}
                              isPgm={!!pgmInput && el.mixerInput === pgmInput}
                              isPvw={!!pvwInput && el.mixerInput === pvwInput}
                              busColor={C_IN}
                              grpBuses={grpBuses}
                              chNum={parseInt(el.elementId.replace('ch', ''), 10) || 0}
                            />
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ── AUX tabs — one per bus, direct send view ── */}
              {activeAuxBus !== null && (
                <div className="flex items-stretch overflow-x-auto scrollbar-hide">
                  {/* OUT section — AUX bus master */}
                  <SectionBar label="OUT" collapsed={auxCollapsed.out} onToggle={() => toggleAuxSection('out')} color={C_AUX.hex} />
                  {!auxCollapsed.out && (
                    <AuxMasterStrip auxBus={activeAuxBus} label={`AUX ${activeAuxBus}`} send={send} />
                  )}
                  {/* IN section — per-channel send strips */}
                  <SectionBar label="IN" collapsed={auxCollapsed.in} onToggle={() => toggleAuxSection('in')} color={C_IN.hex} />
                  {!auxCollapsed.in && (
                    <div className="flex">
                      {inputElements.length === 0 ? (
                        <NoContent label="NO INPUTS" />
                      ) : (
                        inputElements.map((el) => (
                          <AuxChannelStrip
                            key={el.elementId}
                            elementId={el.elementId}
                            label={el.label}
                            auxBus={activeAuxBus}
                            send={send}
                            busPre={auxBusPre[activeAuxBus]}
                          />
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </FaderDimsProvider>
  )
}
