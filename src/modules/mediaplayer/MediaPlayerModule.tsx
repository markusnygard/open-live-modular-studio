import { useState, useEffect, useRef } from 'react'
import type { SendFn } from '@/studio/types'
import { request } from '@/shared/api'
import { useMediaPlayerStore, DEFAULT_PLAYER_STATE, type PlayerState } from './mediaplayer.store'
import { mediaplayerMessages as M } from './mediaplayer.messages'

// ── Raw API shapes (subset) ─────────────────────────────────────────────────────
interface RawProduction {
  sources?: Array<{ sourceId: string; mixerInput: string }>
}
interface RawSource {
  id: string
  name: string
  streamType?: string
  playlist?: string[]
}
interface MediaPlayerSource {
  id: string
  name: string
  playlist?: string[]
}

// Stable references so store selectors don't trigger render loops on the fallback.
const EMPTY_PLAYLIST: string[] = []

function fmtTime(ms: number): string {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

function MediaPlayerCard({ mp, send, productionId }: { mp: MediaPlayerSource; send: SendFn; productionId: string | null }) {
  const playerPlaylist = useMediaPlayerStore((s) => s.playlists[mp.id] ?? EMPTY_PLAYLIST)
  const playerState = useMediaPlayerStore((s) => s.playerStates[mp.id] ?? DEFAULT_PLAYER_STATE)
  const loopOn = useMediaPlayerStore((s) => s.loopOn[mp.id] ?? false)
  const initPlaylist = useMediaPlayerStore((s) => s.initPlaylist)
  const setPlaylist = useMediaPlayerStore((s) => s.setPlaylist)
  const setPlayerState = useMediaPlayerStore((s) => s.setPlayerState)
  const setLoop = useMediaPlayerStore((s) => s.setLoop)

  const [showBrowser, setShowBrowser] = useState(false)
  const [browserPath, setBrowserPath] = useState('host/media')
  const [browserParent, setBrowserParent] = useState<string | null>(null)
  const [browserDirs, setBrowserDirs] = useState<string[]>([])
  const [browserFiles, setBrowserFiles] = useState<string[]>([])
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const playlistDirty = useRef(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const markOutSent = useRef(false)

  // Seed the playlist from the source record on first mount.
  useEffect(() => { initPlaylist(mp.id, mp.playlist ?? []) }, [mp.id, mp.playlist, initPlaylist])

  // Keep loop button state in sync with the player (loop is live in Strom).
  useEffect(() => { setLoop(mp.id, playerState.loopPlaylist) }, [mp.id, playerState.loopPlaylist, setLoop])

  const loadBrowser = (p: string) => {
    request<{ dirs: string[]; files: string[]; path: string; parent: string | null }>(`/api/v1/recorder/dirs?path=${encodeURIComponent(p)}&files=1`)
      .then((d) => {
        setBrowserPath(d.path || p)
        setBrowserParent(d.parent)
        setBrowserDirs(d.dirs || [])
        setBrowserFiles(d.files || [])
      }).catch(() => {})
  }

  const marks = playerState.clipMarks ?? null
  const allMarks = playerState.allClipMarks ?? []

  useEffect(() => {
    if (!productionId) return
    const poll = async () => {
      try {
        const data = await request<{ position_ns: number; duration_ns: number; current_file_index: number; total_files: number; loop_playlist: boolean; state: string; clipMarks?: { markIn?: number; markOut?: number } | null; allClipMarks?: Array<{ markIn?: number; markOut?: number } | null> }>(
          `/api/v1/productions/${productionId}/player-state/${encodeURIComponent(mp.id)}`,
        )
        if (data) {
          const next: PlayerState = {
            state: (data.state === 'playing' || data.state === 'paused' || data.state === 'stopped') ? data.state : 'stopped',
            positionMs: Math.floor((data.position_ns || 0) / 1_000_000),
            durationMs: Math.floor((data.duration_ns || 0) / 1_000_000),
            currentFileIndex: data.current_file_index ?? 0,
            loopPlaylist: data.loop_playlist ?? false,
            clipMarks: data.clipMarks ?? null,
            allClipMarks: data.allClipMarks ?? [],
          }
          setPlayerState(mp.id, next)

          // Auto-stop at markOut
          const mk = data.clipMarks
          if (mk?.markOut != null && data.state === 'playing') {
            const markOutMs = mk.markOut * 1000
            const posMs = Math.floor((data.position_ns || 0) / 1_000_000)
            if (posMs >= markOutMs && !markOutSent.current) {
              markOutSent.current = true
              send(M.control(mp.id, 'stop'))
            }
          } else {
            markOutSent.current = false
          }
        }
      } catch {}
    }
    void poll()
    pollRef.current = setInterval(() => { void poll() }, 250)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [productionId, mp.id, setPlayerState, send])

  // Position adjusted for markIn offset
  const displayPosition = marks?.markIn != null
    ? playerState.positionMs - marks.markIn * 1000
    : playerState.positionMs
  const displayDuration = marks?.markOut != null
    ? (marks.markOut - (marks.markIn ?? 0)) * 1000
    : marks?.markIn != null
      ? playerState.durationMs - marks.markIn * 1000
      : playerState.durationMs

  return (
    <div className="bg-[#0b0f14] border border-zinc-800 rounded p-2 text-[11px]">
      {/* Header with name + status dot */}
      <div className="flex items-center gap-1.5 mb-2">
        <span className={`w-2 h-2 rounded-full shrink-0 ${playerState.state === 'playing' ? 'bg-green-500' : playerState.state === 'paused' ? 'bg-amber-500' : 'bg-zinc-500'}`} />
        <span className="font-semibold text-white text-xs truncate">{mp.name}</span>
        {playerState.state === 'playing' && (
          <span className="text-[10px] text-zinc-500 ml-auto tabular-nums">{fmtTime(displayPosition)} / {fmtTime(displayDuration)}</span>
        )}
      </div>

      {/* Transport row: ▶⏸⏹⏭ on left, IN/OUT on right */}
      <div className="flex items-center gap-1 mb-2">
        <div className="flex gap-1">
          <button type="button"
            className={`px-2 py-1 rounded text-[10px] font-semibold text-green-400 border bg-transparent hover:bg-green-950 ${playerState.state === 'playing' ? 'border-green-400' : 'border-zinc-700'}`}
              onClick={() => {
              if (playlistDirty.current && playerPlaylist.length > 0) {
                send(M.setPlaylist(mp.id, playerPlaylist))
                send(M.goto(mp.id, 0))
                playlistDirty.current = false
              } else if (marks?.markIn != null) {
                // Strom bridge applies start_position_ns during init — no more race
                send(M.goto(mp.id, playerState.currentFileIndex))
                setTimeout(() => send(M.control(mp.id, 'play')), 400)
              } else {
                send(M.control(mp.id, 'play'))
              }
            }}>▶</button>
          <button type="button"
            className={`px-2 py-1 rounded text-[10px] font-semibold text-amber-400 border bg-transparent hover:bg-amber-950 ${playerState.state === 'paused' ? 'border-amber-400' : 'border-zinc-700'}`}
            onClick={() => {
              if (playerState.state === 'paused') {
                send(M.control(mp.id, 'play'))
              } else {
                send(M.control(mp.id, 'pause'))
              }
            }}>⏸</button>
          <button type="button"
            className={`px-2 py-1 rounded text-[10px] font-semibold text-red-400 border bg-transparent hover:bg-red-950 ${playerState.state === 'stopped' ? 'border-red-400' : 'border-zinc-700'}`}
            onClick={() => send(M.control(mp.id, 'stop'))}>⏹</button>
          <button type="button"
            className="px-2 py-1 rounded text-[10px] font-semibold text-blue-400 border border-zinc-700 bg-transparent hover:bg-blue-950"
            onClick={() => send(M.control(mp.id, 'next'))}>⏭</button>
        </div>
        <div className="flex gap-1 ml-auto">
          <button type="button" onClick={() => { setLoop(mp.id, !loopOn); send(M.toggleLoop(mp.id, !loopOn)) }}
            className={`px-1.5 py-1 rounded text-[9px] font-semibold border bg-transparent ${loopOn ? 'text-green-400 border-green-400' : 'text-zinc-500 border-zinc-600 hover:text-green-400'}`}
            title="Loop playlist">↺</button>
          <button type="button" onClick={() => { if (!showBrowser) loadBrowser('host/media'); setShowBrowser(!showBrowser) }}
            className={`px-1.5 py-1 rounded text-[9px] font-semibold border bg-transparent ${showBrowser ? 'text-orange-400 border-orange-400' : 'text-zinc-400 border-zinc-600'}`}
            title="Browse files">📁</button>
        </div>
      </div>

      {/* File browser */}
      {showBrowser && (
        <div className="border border-zinc-700 rounded mb-2 p-2 max-h-40 overflow-y-auto bg-[#141a21]">
          <div className="flex gap-1 mb-1">
            {browserParent !== null && (
              <button type="button" className="text-[10px] text-zinc-400 hover:text-white" onClick={() => loadBrowser(browserParent || 'data/media')}>⬆ ..</button>
            )}
            <span className="text-[10px] text-zinc-500 truncate flex-1">/{browserPath}</span>
          </div>
          {browserDirs.map((d) => (
            <button key={d} type="button" className="block w-full text-left text-[10px] text-zinc-300 hover:text-orange-400 px-1"
              onClick={() => loadBrowser(browserPath ? `${browserPath}/${d}` : d)}>📁 {d}</button>
          ))}
          {browserFiles.map((f) => {
            const sel = selectedFiles.has(f)
            return (
              <button key={f} type="button" className={`block w-full text-left text-[10px] px-1 ${sel ? 'text-green-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                onClick={() => {
                  const next = new Set(selectedFiles)
                  if (sel) next.delete(f); else next.add(f)
                  setSelectedFiles(next)
                }}>🎬 {f}</button>
            )
          })}
          {selectedFiles.size > 0 && (
            <button type="button" className="mt-2 w-full px-2 py-1 rounded text-[10px] font-semibold bg-green-600 text-white border border-green-600 hover:bg-green-700"
              onClick={() => {
                const newList = Array.from(selectedFiles)
                setPlaylist(mp.id, newList)
                setSelectedFiles(new Set())
                setShowBrowser(false)
                playlistDirty.current = true
                request(`/api/v1/sources/${mp.id}`, { method: 'PATCH', body: JSON.stringify({ playlist: newList }) }).catch(() => {})
                // Sync playlist to Strom player
                send(M.setPlaylist(mp.id, newList))
              }}>Add {selectedFiles.size} clips to playlist</button>
          )}
        </div>
      )}

      {/* Playlist with progress bar overlay on active clip */}
      {playerPlaylist.length > 0 && (
        <div className="flex flex-col gap-1">
          {playerPlaylist.map((f, i) => {
            const isActive = i === playerState.currentFileIndex
            const itemMarks = allMarks[i] ?? null
            const pct = isActive && playerState.durationMs > 0
              ? Math.min(100, (playerState.positionMs / playerState.durationMs) * 100)
              : 0
            // Mark region positions as percentages
            const dur = playerState.durationMs || 1
            const markInPct = itemMarks?.markIn != null ? (itemMarks.markIn * 1000 / dur) * 100 : null
            const markOutPct = itemMarks?.markOut != null ? (itemMarks.markOut * 1000 / dur) * 100 : null
            return (
              <div key={f} className="relative cursor-pointer" onClick={() => send(M.goto(mp.id, i))}>
                {/* Progress bar bg + fill */}
                <div className="absolute inset-0 rounded border border-zinc-600 overflow-hidden">
                  {isActive && pct > 0 && (
                    <div className="absolute inset-y-0 left-0 bg-orange-500/30" style={{ width: `${pct}%` }} />
                  )}
                  {/* Mark region band */}
                  {isActive && markInPct != null && markOutPct != null && markOutPct > markInPct && (
                    <div className="absolute inset-y-0 bg-green-500/15 border-l border-r border-green-500/40" style={{ left: `${markInPct}%`, width: `${markOutPct - markInPct}%` }} />
                  )}
                  {/* Mark edge indicators for non-active items */}
                  {!isActive && markInPct != null && markOutPct != null && (
                    <>
                      <div className="absolute inset-y-0 w-0.5 bg-green-500/50" style={{ left: `${markInPct}%` }} />
                      <div className="absolute inset-y-0 w-0.5 bg-red-500/50" style={{ left: `${markOutPct}%` }} />
                    </>
                  )}
                </div>
                {/* Text overlay */}
                <div className={`relative z-10 px-1.5 py-0.5 text-[10px] truncate ${isActive ? 'text-white font-semibold' : 'text-zinc-400'}`}>
                  <span className="text-zinc-600 mr-1">{i + 1}.</span>
                  {f}
                  {itemMarks?.markIn != null && itemMarks?.markOut != null && (
                    <span className="ml-1 text-[9px] text-green-500/70">{fmtTime(itemMarks.markIn * 1000)}–{fmtTime(itemMarks.markOut * 1000)}</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function MediaPlayerModule({ send, productionId }: { send: SendFn; productionId: string | null }) {
  const [mediaPlayers, setMediaPlayers] = useState<MediaPlayerSource[]>([])

  useEffect(() => {
    if (!productionId) { setMediaPlayers([]); return }
    let cancelled = false

    void (async () => {
      try {
        const [production, allSources] = await Promise.all([
          request<RawProduction>(`/api/v1/productions/${productionId}`),
          request<RawSource[]>('/api/v1/sources').catch(() => [] as RawSource[]),
        ])
        if (cancelled) return
        const list = (production.sources ?? [])
          .map((a) => allSources.find((s) => s.id === a.sourceId))
          .filter((s): s is RawSource => !!s && s.streamType === 'mediaplayer')
          .map((s) => ({ id: s.id, name: s.name, playlist: s.playlist }))
        setMediaPlayers(list)
      } catch {
        // production not found / server unreachable — leave the module empty
      }
    })()

    return () => { cancelled = true }
  }, [productionId])

  return (
    <div className="flex flex-col h-full min-w-0">
      <div className="flex items-center gap-1.5 text-zinc-500 shrink-0 px-1 py-0.5">
        <span className="text-[10px] font-semibold uppercase tracking-widest">Media Player</span>
        <span className="text-[9px] text-zinc-600">{mediaPlayers.length}</span>
      </div>
      <div className="overflow-y-auto flex-1 min-h-0 p-1">
        {mediaPlayers.length === 0 ? (
          <div className="flex items-center justify-center min-h-[120px] px-4">
            <p className="text-[9px] text-zinc-700 text-center uppercase tracking-widest">NO MEDIA PLAYERS</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 auto-rows-min">
            {mediaPlayers.map((mp) => (
              <MediaPlayerCard key={mp.id} mp={mp} send={send} productionId={productionId} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
