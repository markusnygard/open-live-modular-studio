import { useState, useEffect, useRef } from 'react'
import { request } from '@/shared/api'

interface RecorderFile {
  outputId: string
  name: string
  folder: string
  file: string
  startTime: string
  preset: string
}

function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function ClipCreator({ productionId, send: _send }: { productionId: string; send?: any }) {
  const [recorders, setRecorders] = useState<RecorderFile[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [markIn, setMarkIn] = useState<number | null>(null)
  const [markOut, setMarkOut] = useState<number | null>(null)
  const [downloading, setDownloading] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Poll active MPEG-TS recorders
  useEffect(() => {
    const poll = async () => {
      try {
        const outputs = await request<Array<{ id: string; name: string; outputType: string; outputDir: string; preset?: string; container?: string }>>('/api/v1/outputs')
        const statuses = await Promise.all(
          outputs.filter(o => o.outputType === 'recorder' && (o.preset || o.container)?.includes('mpegts'))
            .map(async o => {
              try {
                const s = await request<{ state: string }>(`/api/v1/productions/${productionId}/outputs/${o.id}/status`)
                if (s.state !== 'running') return null
                // List files in the output directory
                const dirs = await request<{ dirs: string[]; files: string[] }>(`/api/v1/recorder/dirs?path=/host/media/${encodeURIComponent(o.outputDir || 'recordings')}&files=1`)
                const tsFiles = (dirs.files || []).filter(f => f.endsWith('.mp4') || f.endsWith('.mpegts') || f.endsWith('.ts'))
                if (tsFiles.length === 0) return null
                // Use the most recent file
                const latest = tsFiles.sort().reverse()[0]
                return {
                  outputId: o.id,
                  name: o.name,
                  folder: o.outputDir || 'recordings',
                  file: latest,
                  startTime: '',
                  preset: o.preset || o.container || 'mpegts',
                } as RecorderFile
              } catch { return null }
            })
        )
        setRecorders(statuses.filter(Boolean) as RecorderFile[])
      } catch {}
    }
    void poll()
    const id = setInterval(poll, 5000)
    return () => clearInterval(id)
  }, [productionId])

  const selectedRec = recorders.find(r => r.outputId === selected)

  const handleDownload = async () => {
    if (!selectedRec || markIn == null || markOut == null) return
    setDownloading(true)
    try {
      const url = `/api/v1/recorder/file?folder=${encodeURIComponent(selectedRec.folder)}&file=${encodeURIComponent(selectedRec.file)}`
      const resp = await fetch(url)
      const blob = await resp.blob()
      // Create a downloadable link
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
      a.download = `clip_${ts}_${fmtTime(markIn)?.replace(':', '-')}_${fmtTime(markOut)?.replace(':', '-')}.ts`
      a.click()
      URL.revokeObjectURL(a.href)
    } catch (e) {
      console.error('Download failed', e)
    }
    setDownloading(false)
  }

  return (
    <div className="flex h-full bg-[#0b0f14] text-white">
      {/* Sidebar */}
      <div className="w-56 border-r border-zinc-800 flex flex-col shrink-0">
        <div className="px-3 py-2 text-[10px] text-zinc-500 uppercase tracking-wider border-b border-zinc-800">Recorders</div>
        <div className="flex-1 overflow-y-auto">
          {recorders.length === 0 && (
            <div className="px-3 py-4 text-[10px] text-zinc-600 text-center">No active MPEG-TS recorders</div>
          )}
          {recorders.map(r => (
            <button key={r.outputId}
              className={`w-full text-left px-3 py-2 text-[11px] border-b border-zinc-800/50 transition-colors ${selected === r.outputId ? 'bg-orange-500/20 text-orange-400 border-l-2 border-l-orange-500' : 'text-zinc-300 hover:bg-zinc-800/50'}`}
              onClick={() => { setSelected(r.outputId); setMarkIn(null); setMarkOut(null) }}>
              <div className="font-medium truncate">{r.name}</div>
              <div className="text-[9px] text-zinc-500 truncate">{r.file}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {!selectedRec ? (
          <div className="flex-1 flex items-center justify-center text-zinc-600 text-xs">Select a recorder to view</div>
        ) : (
          <>
            {/* Video player */}
            <div className="flex-1 bg-black flex items-center justify-center min-h-0">
              <video
                ref={videoRef}
                className="max-w-full max-h-full"
                src={`/api/v1/recorder/file?folder=${encodeURIComponent(selectedRec.folder)}&file=${encodeURIComponent(selectedRec.file)}`}
                controls
                autoPlay
                onTimeUpdate={() => {
                  if (videoRef.current) {
                    // Refresh to check for new content every 10s
                    const t = videoRef.current.currentTime
                    const d = videoRef.current.duration
                    if (d > 0 && t > d - 1) {
                      videoRef.current.load()
                    }
                  }
                }}
              />
            </div>

            {/* Controls */}
            <div className="border-t border-zinc-800 px-4 py-3 flex items-center gap-3">
              <div className="flex items-center gap-2">
                <button
                  className={`px-3 py-1.5 rounded text-xs font-semibold border ${markIn != null ? 'bg-green-600/30 text-green-400 border-green-700' : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-green-400'}`}
                  onClick={() => setMarkIn(videoRef.current?.currentTime ?? null)}>
                  IN {markIn != null ? fmtTime(markIn) : ''}
                </button>
                <button
                  className={`px-3 py-1.5 rounded text-xs font-semibold border ${markOut != null ? 'bg-red-600/30 text-red-400 border-red-700' : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-red-400'}`}
                  onClick={() => setMarkOut(videoRef.current?.currentTime ?? null)}>
                  OUT {markOut != null ? fmtTime(markOut) : ''}
                </button>
                {(markIn != null || markOut != null) && (
                  <button className="px-2 py-1.5 rounded text-xs text-zinc-500 hover:text-white border border-zinc-700 bg-zinc-800"
                    onClick={() => { setMarkIn(null); setMarkOut(null) }}>✕</button>
                )}
              </div>

              {markIn != null && markOut != null && (
                <>
                  <span className="text-[10px] text-zinc-500 ml-auto">
                    {fmtTime(markIn)} – {fmtTime(markOut)} ({fmtTime(markOut - markIn)})
                  </span>
                  <button
                    className="px-4 py-1.5 rounded text-xs font-semibold bg-orange-600 text-white hover:bg-orange-500 disabled:opacity-40"
                    disabled={downloading}
                    onClick={handleDownload}>
                    {downloading ? 'Downloading...' : 'Download Clip'}
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
