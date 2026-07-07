import { useEffect, useState } from 'react'
import type { SendFn } from '@/studio/types'
import { useControllerStore } from './controller.store'
import { TRANSITION_LABELS } from './TransitionPanel'
import { SourceOffsetPanel } from './SourceOffsetPanel'
import { cn } from '@/shared/cn'

const CONTROLLER_OPTIONS_KEY = 'ol-studio-controller-options'

const TRANSITION_GROUPS: { label: string; gpu?: boolean; types: string[] }[] = [
  { label: 'Mix',      types: ['fade', 'dip_to_black'] },
  { label: 'Slide',    types: ['slide_left', 'slide_right', 'slide_up', 'slide_down'] },
  { label: 'Push',     types: ['push_left', 'push_right', 'push_up', 'push_down'] },
  { label: 'Wipe',     gpu: true, types: ['wipe_left', 'wipe_right', 'wipe_up', 'wipe_down', 'iris_open', 'iris_close', 'clock_wipe', 'blinds', 'checker', 'noise_dissolve', 'luma_wipe', 'barn_doors', 'star_wipe', 'pinwheel', 'crosshatch', 'hex_dissolve', 'warp_wipe', 'melt', 'heart_iris'] },
  { label: 'FX Takes', gpu: true, types: ['glitch_cut', 'flash_dissolve', 'whip_pan_left', 'whip_pan_right', 'punch_zoom', 'pixelate_take', 'zoom_blur', 'spin', 'tv_roll', 'negative_flash', 'ripple'] },
]

interface ControllerOptionsModalProps {
  send: SendFn
}

/**
 * Controller options modal — pick which transition chips are visible and set
 * per-source video/audio timing offsets. Ported from the legacy ControllerPage
 * ControllerOptionsContent; modal visibility and transition selection live in
 * the controller store. Uses a self-contained overlay (no shared Modal here).
 */
export function ControllerOptionsModal({ send }: ControllerOptionsModalProps) {
  const open = useControllerStore((s) => s.optionsOpen)
  const setOptionsOpen = useControllerStore((s) => s.setOptionsOpen)
  const visibleTransitions = useControllerStore((s) => s.visibleTransitions)
  const setVisibleTransitions = useControllerStore((s) => s.setVisibleTransitions)
  const sourceOffsets = useControllerStore((s) => s.sourceOffsets)
  const sourceAudioOffsets = useControllerStore((s) => s.sourceAudioOffsets)
  const sources = useControllerStore((s) => s.sources)

  // All edits are local until Done is pressed.
  const [draftTransitions, setDraftTransitions] = useState<string[]>(visibleTransitions)
  const [draftOffsets, setDraftOffsets] = useState<Record<string, number>>({ ...sourceOffsets })
  const [draftAudioOffsets, setDraftAudioOffsets] = useState<Record<string, number>>({ ...sourceAudioOffsets })

  // Reset drafts whenever the modal opens so it reflects current state.
  useEffect(() => {
    if (open) {
      setDraftTransitions(visibleTransitions)
      setDraftOffsets({ ...sourceOffsets })
      setDraftAudioOffsets({ ...sourceAudioOffsets })
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null

  const assignments = [...sources].sort((a, b) => a.mixerInput.localeCompare(b.mixerInput))

  function handleDone() {
    // Commit transitions
    setVisibleTransitions(draftTransitions)
    try { localStorage.setItem(CONTROLLER_OPTIONS_KEY, JSON.stringify({ visibleTransitions: draftTransitions })) } catch {}

    // Send changed offsets via WS
    for (const { mixerInput } of assignments) {
      const current = sourceOffsets[mixerInput] ?? 0
      const draft   = draftOffsets[mixerInput] ?? 0
      if (draft !== current) {
        send({ type: 'SOURCE_OFFSET_SET', mixerInput, offsetMs: draft })
      }
      const currentAudio = sourceAudioOffsets[mixerInput] ?? 0
      const draftAudio   = draftAudioOffsets[mixerInput] ?? 0
      if (draftAudio !== currentAudio) {
        send({ type: 'SOURCE_AUDIO_OFFSET_SET', mixerInput, offsetMs: draftAudio })
      }
    }

    setOptionsOpen(false)
  }

  const leftColStyle: React.CSSProperties = { width: 96, minWidth: 96, background: '#18181b', borderRight: '1px solid #1e1e1e' }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={() => setOptionsOpen(false)}
    >
      <div
        className="bg-zinc-950 border border-zinc-800 rounded-lg p-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-300">Controller Options</span>
          <button
            type="button"
            onClick={() => setOptionsOpen(false)}
            className="text-zinc-500 hover:text-zinc-200 cursor-pointer text-sm"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-4" style={{ minWidth: 640 }}>
          <div className="flex gap-4 items-start">

            {/* ── Transitions ─────────────────────────────────────────────────── */}
            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Visible transitions</span>
                <span className="text-[9px] font-mono font-bold tabular-nums text-orange-500">{draftTransitions.length}/16</span>
              </div>
              <div className="flex flex-col border border-zinc-800 rounded overflow-hidden">
                {TRANSITION_GROUPS.map((group) => (
                  <div key={group.label} className="flex items-stretch border-b border-zinc-800 last:border-b-0">
                    <div className="flex items-center gap-1.5 px-3 py-2 shrink-0" style={leftColStyle}>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 whitespace-nowrap">{group.label}</span>
                      {group.gpu && <span className="text-[8px] text-zinc-600 border border-zinc-700 px-1 rounded leading-none shrink-0">GPU</span>}
                    </div>
                    <div className="flex flex-wrap gap-1 p-2">
                      {group.types.map((t) => {
                        const active = draftTransitions.includes(t)
                        const isLast = draftTransitions.length === 1 && active
                        const atMax  = draftTransitions.length >= 16 && !active
                        return (
                          <button
                            key={t}
                            type="button"
                            disabled={isLast || atMax}
                            onClick={() => setDraftTransitions(active
                              ? draftTransitions.filter((x) => x !== t)
                              : [...draftTransitions, t])}
                            className={cn(
                              'btn-hardware px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest border transition-colors cursor-pointer whitespace-nowrap',
                              active
                                ? 'text-black bg-orange-500 border-orange-400'
                                : 'text-zinc-500 bg-zinc-900 border-zinc-700 hover:text-zinc-200 hover:border-zinc-500',
                              (isLast || atMax) && 'opacity-40 cursor-not-allowed',
                            )}
                          >
                            {TRANSITION_LABELS[t as keyof typeof TRANSITION_LABELS] ?? t}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Source timing ───────────────────────────────────────────────── */}
            <SourceOffsetPanel
              draftOffsets={draftOffsets}
              draftAudioOffsets={draftAudioOffsets}
              onChangeVideo={(mixerInput, val) => setDraftOffsets((prev) => ({ ...prev, [mixerInput]: val }))}
              onChangeAudio={(mixerInput, val) => setDraftAudioOffsets((prev) => ({ ...prev, [mixerInput]: val }))}
            />

          </div>

          <div className="flex justify-end pt-3">
            <button
              type="button"
              onClick={handleDone}
              className="px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest bg-orange-500 text-black border border-orange-400 rounded hover:bg-orange-400 transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
