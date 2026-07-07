import { useEffect, useRef, useState } from 'react'
import { useControllerStore } from './controller.store'
import { cn } from '@/shared/cn'

// Simple draft offset input — no live WS send, just local string state to
// prevent "0 stuck" on controlled inputs. Parent owns the numeric draft value.
function SourceOffsetInput({
  label,
  draftValue,
  onChange,
}: {
  label: string
  draftValue: number
  onChange: (val: number) => void
}) {
  const [text, setText] = useState(() => String(draftValue))

  // Keep text in sync when the parent resets draft (e.g. modal re-opens)
  // but never clobber what the user is actively typing.
  const isFocusedRef = useRef(false)
  useEffect(() => {
    if (!isFocusedRef.current) setText(String(draftValue))
  }, [draftValue])

  return (
    <input
      type="text"
      inputMode="numeric"
      value={text}
      onFocus={() => { isFocusedRef.current = true }}
      onBlur={() => {
        isFocusedRef.current = false
        const parsed = parseFloat(text)
        if (!Number.isFinite(parsed)) setText(String(draftValue))
      }}
      onChange={(e) => {
        const raw = e.target.value
        setText(raw)
        const val = parseFloat(raw)
        if (Number.isFinite(val)) onChange(val)
      }}
      className="flex-1 min-w-0 text-right text-[9px] font-bold bg-transparent border-none focus:outline-none text-orange-500"
      aria-label={`${label} time offset ms`}
    />
  )
}

interface SourceOffsetPanelProps {
  draftOffsets: Record<string, number>
  draftAudioOffsets: Record<string, number>
  onChangeVideo: (mixerInput: string, val: number) => void
  onChangeAudio: (mixerInput: string, val: number) => void
}

/**
 * Per-source video/audio timing offsets editor. Video (V) delays the video
 * track relative to audio; audio (A) delays audio relative to video — used to
 * fix lip-sync issues per source. Ported from the legacy ControllerPage
 * options modal "Source timing" section.
 */
export function SourceOffsetPanel({ draftOffsets, draftAudioOffsets, onChangeVideo, onChangeAudio }: SourceOffsetPanelProps) {
  const sources = useControllerStore((s) => s.sources)
  const assignments = [...sources].sort((a, b) => a.mixerInput.localeCompare(b.mixerInput))

  if (assignments.length === 0) return null

  const leftColStyle: React.CSSProperties = { width: 96, minWidth: 96, background: '#18181b', borderRight: '1px solid #1e1e1e' }

  return (
    <div className="flex flex-col shrink-0" style={{ width: 300 }}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Source timing</span>
      </div>
      <div className="flex flex-col border border-zinc-800 rounded overflow-hidden">
        {assignments.map((assignment) => {
          const vVal = draftOffsets[assignment.mixerInput] ?? 0
          const aVal = draftAudioOffsets[assignment.mixerInput] ?? 0
          return (
            <div key={assignment.mixerInput} className="flex items-stretch border-b border-zinc-800 last:border-b-0">
              <div className="flex items-center px-3 py-2 shrink-0" style={{ ...leftColStyle, wordBreak: 'break-word', lineHeight: 1.4 }}>
                <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">{assignment.name}</span>
              </div>
              <div className="flex flex-col gap-1 p-2 flex-1">
                <div className={cn('flex items-center gap-1.5 border rounded px-2 py-1 text-[9px] font-bold uppercase tracking-widest', vVal !== 0 ? 'border-orange-500 text-orange-500' : 'border-zinc-700 bg-zinc-900')}>
                  <span className="text-zinc-600 shrink-0">V</span>
                  <SourceOffsetInput label={`${assignment.name} video`} draftValue={vVal} onChange={(val) => onChangeVideo(assignment.mixerInput, val)} />
                  <span className="text-zinc-600 shrink-0">ms</span>
                </div>
                <div className={cn('flex items-center gap-1.5 border rounded px-2 py-1 text-[9px] font-bold uppercase tracking-widest', aVal !== 0 ? 'border-orange-500 text-orange-500' : 'border-zinc-700 bg-zinc-900')}>
                  <span className="text-zinc-600 shrink-0">A</span>
                  <SourceOffsetInput label={`${assignment.name} audio`} draftValue={aVal} onChange={(val) => onChangeAudio(assignment.mixerInput, val)} />
                  <span className="text-zinc-600 shrink-0">ms</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
