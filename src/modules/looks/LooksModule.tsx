import { useEffect, useRef, useState } from 'react'
import type { SendFn } from '@/studio/types'
import { cn } from '@/shared/cn'
import { request } from '@/shared/api'
import type { VideoEffect, EffectTarget } from '@/shared/types'
import { useLooksStore } from './looks.store'
import { useLooksMessages } from './looks.messages'

// ── Raw API shapes (subset — just what we read to build the source list) ────────
interface RawProduction {
  sources?: Array<{ sourceId: string; mixerInput: string }>
}
interface RawSource { id: string; name: string }

function padToIndex(mixerInput: string): number | null {
  const m = /video_in_(\d+)$/.exec(mixerInput ?? '')
  return m?.[1] !== undefined ? parseInt(m[1], 10) : null
}

const EFFECT_OPTIONS: { value: string; label: string }[] = [
  { value: 'none',          label: 'None' },
  { value: 'color_correct', label: 'Color Correct' },
  { value: 'chroma_key',    label: 'Chroma Key' },
  { value: 'vignette',      label: 'Vignette' },
  { value: 'duotone',       label: 'Duotone' },
  { value: 'blur',          label: 'Blur' },
  { value: 'pixelate',      label: 'Pixelate' },
  { value: 'vhs',           label: 'VHS' },
  { value: 'old_film',      label: 'Old Film' },
  { value: 'edge_glow',     label: 'Edge Glow' },
  { value: 'crt',           label: 'CRT' },
  { value: 'halftone',      label: 'Halftone' },
  { value: 'thermal',       label: 'Thermal' },
  { value: 'night_vision',  label: 'Night Vision' },
  { value: 'posterize',     label: 'Posterize' },
  { value: 'underwater',    label: 'Underwater' },
]

function defaultEffect(type: string): VideoEffect {
  switch (type) {
    case 'none':          return { type: 'none' }
    case 'chroma_key':    return { type: 'chroma_key', key_color: '#00B140', similarity: 0.35, smoothness: 0.1, spill: 0.5 }
    case 'pixelate':      return { type: 'pixelate', block_size: 24 }
    case 'blur':          return { type: 'blur', radius: 6 }
    case 'duotone':       return { type: 'duotone', low: '#000000', high: '#FFFFFF', mix: 1 }
    case 'vignette':      return { type: 'vignette', amount: 0.5, softness: 0.5 }
    case 'vhs':           return { type: 'vhs', intensity: 0.5 }
    case 'old_film':      return { type: 'old_film', intensity: 0.5 }
    case 'edge_glow':     return { type: 'edge_glow', color: '#00FFD0', intensity: 0.5 }
    case 'crt':           return { type: 'crt', intensity: 0.5 }
    case 'halftone':      return { type: 'halftone', dot_size: 8 }
    case 'thermal':       return { type: 'thermal', intensity: 1 }
    case 'night_vision':  return { type: 'night_vision', intensity: 1 }
    case 'posterize':     return { type: 'posterize', levels: 5 }
    case 'underwater':    return { type: 'underwater', intensity: 0.5 }
    case 'color_correct': return { type: 'color_correct', brightness: 0, contrast: 1, saturation: 1, hue: 0, gamma: 1, temperature: 0, tint: 0 }
    default:              return { type: 'none' }
  }
}

function Slider({ label, field, min, max, step = 0.01, effect, onChange }: {
  label: string; field: string; min: number; max: number; step?: number
  effect: Record<string, unknown>; onChange: (k: string, v: number) => void
}) {
  const val = typeof effect[field] === 'number' ? (effect[field] as number) : 0
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] text-zinc-500 w-20 shrink-0">{label}</span>
      <input
        type="range" min={min} max={max} step={step} value={val}
        onChange={(e) => onChange(field, Number(e.target.value))}
        className="flex-1 accent-orange-500 h-1 cursor-pointer"
      />
      <span className="text-[10px] text-zinc-400 w-10 text-right tabular-nums font-mono">{val.toFixed(2)}</span>
    </div>
  )
}

function ColorField({ label, field, effect, onChange }: {
  label: string; field: string
  effect: Record<string, unknown>; onChange: (k: string, v: string) => void
}) {
  const serverVal = typeof effect[field] === 'string' ? (effect[field] as string) : '#000000'
  const [localVal, setLocalVal] = useState(serverVal)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setLocalVal(serverVal) }, [serverVal])

  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] text-zinc-500 shrink-0 w-20">{label}</span>
      <div
        className="w-4 h-4 rounded border border-zinc-600 shrink-0 cursor-pointer"
        style={{ background: localVal }}
        onClick={() => inputRef.current?.click()}
      />
      <span className="text-[9px] text-zinc-500 font-mono flex-1 tabular-nums">{localVal}</span>
      <input
        ref={inputRef}
        type="color"
        defaultValue={serverVal}
        className="sr-only"
        onChange={(e) => { setLocalVal(e.target.value); onChange(field, e.target.value) }}
      />
    </div>
  )
}

function EffectParams({ effect, onChange }: {
  effect: VideoEffect
  onChange: (k: string, v: number | string) => void
}) {
  const e = effect as Record<string, unknown>
  // Use direct JSX — never define component shortcuts inside a render function,
  // because the new function reference on every render causes React to unmount
  // and remount the child (losing refs and local state, closing the colour picker).
  switch (effect.type) {
    case 'chroma_key':    return <><ColorField field="key_color" label="Key color" effect={e} onChange={onChange} /><Slider field="similarity" min={0} max={1} label="Similarity" effect={e} onChange={onChange} /><Slider field="smoothness" min={0} max={1} label="Smoothness" effect={e} onChange={onChange} /><Slider field="spill" min={0} max={1} label="Spill" effect={e} onChange={onChange} /></>
    case 'pixelate':      return <Slider field="block_size" min={2} max={200} step={1} label="Block size" effect={e} onChange={onChange} />
    case 'blur':          return <Slider field="radius" min={0} max={40} step={0.5} label="Radius" effect={e} onChange={onChange} />
    case 'duotone':       return <><ColorField field="low" label="Shadow" effect={e} onChange={onChange} /><ColorField field="high" label="Highlight" effect={e} onChange={onChange} /><Slider field="mix" min={0} max={1} label="Mix" effect={e} onChange={onChange} /></>
    case 'vignette':      return <><Slider field="amount" min={0} max={1} label="Amount" effect={e} onChange={onChange} /><Slider field="softness" min={0.01} max={1} label="Softness" effect={e} onChange={onChange} /></>
    case 'edge_glow':     return <><ColorField field="color" label="Glow color" effect={e} onChange={onChange} /><Slider field="intensity" min={0} max={1} label="Intensity" effect={e} onChange={onChange} /></>
    case 'halftone':      return <Slider field="dot_size" min={3} max={40} step={0.5} label="Dot size" effect={e} onChange={onChange} />
    case 'posterize':     return <Slider field="levels" min={2} max={16} step={1} label="Levels" effect={e} onChange={onChange} />
    case 'color_correct': return <>
      <Slider field="brightness"  min={-1}  max={1} label="Brightness"  effect={e} onChange={onChange} />
      <Slider field="contrast"    min={0}   max={2} label="Contrast"    effect={e} onChange={onChange} />
      <Slider field="saturation"  min={0}   max={2} label="Saturation"  effect={e} onChange={onChange} />
      <Slider field="hue"         min={-1}  max={1} label="Hue"         effect={e} onChange={onChange} />
      <Slider field="gamma"       min={0.1} max={3} label="Gamma"       effect={e} onChange={onChange} />
      <Slider field="temperature" min={-1}  max={1} label="Temperature" effect={e} onChange={onChange} />
      <Slider field="tint"        min={-1}  max={1} label="Tint"        effect={e} onChange={onChange} />
    </>
    default: return <Slider field="intensity" min={0} max={1} label="Intensity" effect={e} onChange={onChange} />
  }
}

function SourceCard({ name, isMaster, effect, onSend }: {
  name: string
  isMaster?: boolean
  effect: VideoEffect
  onSend: (e: VideoEffect) => void
}) {
  const isActive = effect.type !== 'none'
  const [open, setOpen] = useState(false)

  function handleTypeChange(newType: string) {
    onSend(defaultEffect(newType))
    setOpen(newType !== 'none')
  }

  function handleParamChange(k: string, v: number | string) {
    onSend({ ...effect, [k]: v } as VideoEffect)
  }

  return (
    <div className={cn(
      'border rounded overflow-hidden transition-colors',
      isActive ? 'border-orange-500/40 bg-zinc-900' : 'border-zinc-800 bg-zinc-950',
    )}>
      {/* Single header row: name + dropdown + expand toggle */}
      <div className="flex items-center gap-1.5 px-2 py-1.5">
        <span className={cn(
          'text-[10px] font-bold uppercase tracking-widest flex-1 truncate min-w-0',
          isMaster ? 'text-zinc-400' : isActive ? 'text-orange-400' : 'text-zinc-400',
        )}>
          {name}
        </span>
        <select
          value={effect.type}
          onChange={(e) => handleTypeChange(e.target.value)}
          className="w-40 shrink-0 text-[10px] bg-zinc-900 border border-zinc-700 text-zinc-300 rounded pl-1.5 pr-6 py-0.5 focus:outline-none focus:border-orange-500 cursor-pointer"
        >
          {EFFECT_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        {isActive && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="text-[11px] leading-none text-zinc-400 hover:text-zinc-100 w-5 h-5 flex items-center justify-center border border-zinc-700 rounded hover:border-zinc-500 cursor-pointer shrink-0"
          >
            {open ? '−' : '+'}
          </button>
        )}
      </div>

      {isActive && open && (
        <div className="flex flex-col gap-1.5 px-2 pb-2 pt-1 border-t border-zinc-800">
          <EffectParams effect={effect} onChange={handleParamChange} />
        </div>
      )}
    </div>
  )
}

export function LooksModule({ send, productionId }: { send: SendFn; productionId: string | null }) {
  useLooksMessages()

  const fxAvailable = useLooksStore((s) => s.fxAvailable)
  const inputEffects = useLooksStore((s) => s.inputEffects)
  const masterEffect = useLooksStore((s) => s.masterEffect)

  const [sources, setSources] = useState<Array<{ mixerInput: string; name: string }>>([])

  // Load the source list (mixer input → display name) whenever the production changes.
  useEffect(() => {
    if (!productionId) { setSources([]); return }
    let cancelled = false

    void (async () => {
      try {
        const [production, allSources] = await Promise.all([
          request<RawProduction>(`/api/v1/productions/${productionId}`),
          request<RawSource[]>('/api/v1/sources').catch(() => [] as RawSource[]),
        ])
        if (cancelled) return
        const list = [...(production.sources ?? [])]
          .sort((a, b) => a.mixerInput.localeCompare(b.mixerInput))
          .map((a) => ({
            mixerInput: a.mixerInput,
            name: allSources.find((s) => s.id === a.sourceId)?.name ?? a.mixerInput,
          }))
        setSources(list)
      } catch {
        // production not found / server unreachable — leave the module empty
      }
    })()

    return () => { cancelled = true }
  }, [productionId])

  function sendEffect(target: EffectTarget, effect: VideoEffect) {
    send({ type: 'SET_EFFECT', target, effect })
  }

  return (
    <div className="flex flex-col h-full min-w-0">
      <div className="flex items-center gap-1.5 text-zinc-500 shrink-0 px-1 py-0.5">
        <span className="text-[10px] font-semibold uppercase tracking-widest">Looks</span>
        <span className="text-[9px] text-zinc-600">{sources.length} src</span>
      </div>

      <div className="border border-zinc-800 overflow-y-auto flex-1 min-h-0 p-1.5" style={{ background: '#0d0d0d' }}>
        <div className="flex flex-col gap-1.5">
          {sources.map((src) => {
            const idx = padToIndex(src.mixerInput)
            if (idx === null) return null
            const effect = inputEffects[idx] ?? { type: 'none' as const }
            return (
              <SourceCard
                key={src.mixerInput}
                name={src.name || `CH${idx + 1}`}
                effect={effect}
                onSend={(e) => sendEffect({ input: idx }, e)}
              />
            )
          })}
          <div className="border-t border-zinc-800 mt-1 pt-1.5">
            <SourceCard
              name="MASTER"
              isMaster
              effect={masterEffect}
              onSend={(e) => sendEffect('master', e)}
            />
          </div>
          {!fxAvailable && (
            <p className="text-[9px] text-zinc-600 pt-1">Shader effects require GPU backend — applies on supported nodes only</p>
          )}
        </div>
      </div>
    </div>
  )
}
