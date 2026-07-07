import { useCallback, useEffect, useState } from 'react'
import { request } from '@/shared/api'
import { OutputCard, type OutputCardStatus } from './OutputCard'

/** Logical output family handled by a module. Matches the backend start config `type`. */
export type OutputKind = 'srt' | 'efp' | 'recording' | 'ndi' | 'sdi'

interface KindMeta {
  label: string
  /** Corresponding `OutputDoc.outputType` value on the backend. */
  outputType: string
}

const KIND_META: Record<OutputKind, KindMeta> = {
  srt: { label: 'SRT Stream', outputType: 'mpegtssrt' },
  efp: { label: 'EFP Stream', outputType: 'efpsrt' },
  recording: { label: 'Recording', outputType: 'recorder' },
  ndi: { label: 'NDI Output', outputType: 'ndi' },
  sdi: { label: 'SDI Output', outputType: 'sdi' },
}

interface RawOutput {
  id: string
  name: string
  outputType: string
  url?: string
  outputDir?: string
  container?: string
}

interface RawProduction {
  outputAssignments?: Array<{ outputId: string }>
}

interface OutputStartConfig {
  type: OutputKind
  destination?: string
  bitrate?: number
  deviceNumber?: number
  ndiName?: string
  outputDir?: string
  container?: string
}

function buildStartConfig(kind: OutputKind, output: RawOutput): OutputStartConfig {
  switch (kind) {
    case 'srt':
    case 'efp':
      return { type: kind, destination: output.url }
    case 'recording':
      return { type: kind, outputDir: output.outputDir, container: output.container }
    case 'ndi':
      return { type: kind, ndiName: output.name }
    case 'sdi':
      return { type: kind }
  }
}

/**
 * Shared implementation for every output module. Discovers the outputs of a
 * given `kind` assigned to the active production, polls their flow status, and
 * exposes start/stop via the Task 17 output-flow endpoints.
 */
export function OutputModule({ productionId, kind }: { productionId: string | null; kind: OutputKind }) {
  const meta = KIND_META[kind]
  const [outputs, setOutputs] = useState<RawOutput[]>([])
  const [statuses, setStatuses] = useState<Record<string, OutputCardStatus>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Discover the assigned outputs of this kind for the active production.
  useEffect(() => {
    if (!productionId) { setOutputs([]); return }
    let cancelled = false
    void (async () => {
      try {
        const [prod, all] = await Promise.all([
          request<RawProduction>(`/api/v1/productions/${productionId}`),
          request<RawOutput[]>('/api/v1/outputs').catch(() => [] as RawOutput[]),
        ])
        if (cancelled) return
        const assigned = new Set((prod.outputAssignments ?? []).map((a) => a.outputId))
        setOutputs(all.filter((o) => assigned.has(o.id) && o.outputType === meta.outputType))
      } catch {
        if (!cancelled) setOutputs([])
      }
    })()
    return () => { cancelled = true }
  }, [productionId, meta.outputType])

  // Poll flow status for each discovered output.
  useEffect(() => {
    if (!productionId || outputs.length === 0) return
    let cancelled = false
    const poll = async () => {
      const next: Record<string, OutputCardStatus> = {}
      await Promise.all(outputs.map(async (o) => {
        try {
          const s = await request<{ state?: string }>(`/api/v1/productions/${productionId}/outputs/${o.id}/status`)
          next[o.id] = s.state === 'running' ? 'running' : 'stopped'
        } catch {
          next[o.id] = 'error'
        }
      }))
      if (!cancelled) setStatuses((prev) => ({ ...prev, ...next }))
    }
    void poll()
    const timer = setInterval(() => { void poll() }, 2000)
    return () => { cancelled = true; clearInterval(timer) }
  }, [productionId, outputs])

  const start = useCallback(async (output: RawOutput) => {
    if (!productionId) return
    setStatuses((p) => ({ ...p, [output.id]: 'running' }))
    setErrors((p) => { const n = { ...p }; delete n[output.id]; return n })
    try {
      await request(`/api/v1/productions/${productionId}/outputs/${output.id}/start`, {
        method: 'POST',
        body: JSON.stringify({ config: buildStartConfig(kind, output) }),
      })
    } catch (e) {
      setStatuses((p) => ({ ...p, [output.id]: 'error' }))
      setErrors((p) => ({ ...p, [output.id]: e instanceof Error ? e.message : String(e) }))
    }
  }, [productionId, kind])

  const stop = useCallback(async (output: RawOutput) => {
    if (!productionId) return
    try {
      await request(`/api/v1/productions/${productionId}/outputs/${output.id}/stop`, { method: 'POST' })
      setStatuses((p) => ({ ...p, [output.id]: 'stopped' }))
      setErrors((p) => { const n = { ...p }; delete n[output.id]; return n })
    } catch (e) {
      setStatuses((p) => ({ ...p, [output.id]: 'error' }))
      setErrors((p) => ({ ...p, [output.id]: e instanceof Error ? e.message : String(e) }))
    }
  }, [productionId])

  return (
    <div className="flex flex-col h-full min-w-0">
      <div className="flex items-center gap-1.5 text-zinc-500 shrink-0 px-1 py-0.5">
        <span className="text-[10px] font-semibold uppercase tracking-widest">{meta.label}</span>
        <span className="text-[9px] text-zinc-600">{outputs.length}</span>
      </div>
      <div className="overflow-y-auto flex-1 min-h-0 p-1 flex flex-col gap-1">
        {outputs.length === 0 ? (
          <div className="flex items-center justify-center min-h-[40px] px-2">
            <p className="text-[9px] text-zinc-700 text-center uppercase tracking-widest">NONE</p>
          </div>
        ) : outputs.map((o) => (
          <OutputCard
            key={o.id}
            name={o.name}
            status={statuses[o.id] ?? 'stopped'}
            error={errors[o.id]}
            onStart={() => void start(o)}
            onStop={() => void stop(o)}
          />
        ))}
      </div>
    </div>
  )
}
