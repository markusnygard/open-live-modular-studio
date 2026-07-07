export type OutputCardStatus = 'stopped' | 'running' | 'error'

/**
 * A compact output card: status dot | name | optional bitrate | start/stop button.
 * Shows an inline error line underneath when the last action failed.
 */
export function OutputCard({ name, status, onStart, onStop, bitrate, error }: {
  name: string
  status: OutputCardStatus
  onStart: () => void
  onStop: () => void
  bitrate?: number
  error?: string
}) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-0.5">
        <span className={`w-2 h-2 rounded-full shrink-0 ${status === 'running' ? 'bg-green-500' : status === 'error' ? 'bg-red-500' : 'bg-zinc-500'}`} />
        <span className="text-zinc-300 text-[10px] truncate">{name}</span>
        {bitrate ? <span className="text-zinc-500 text-[9px]">{bitrate}Mbps</span> : null}
        <button
          type="button"
          onClick={status === 'running' ? onStop : onStart}
          className={`ml-auto text-[9px] px-1 py-0.5 rounded ${status === 'running' ? 'bg-red-800 text-red-300' : 'bg-green-800 text-green-300'}`}
        >
          {status === 'running' ? 'Stop' : 'Start'}
        </button>
      </div>
      {error ? (
        <span className="text-red-400 text-[9px] px-2 truncate" title={error}>{error}</span>
      ) : null}
    </div>
  )
}
