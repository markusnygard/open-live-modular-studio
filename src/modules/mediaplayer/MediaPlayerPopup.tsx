import { useState, useEffect, useRef, useCallback } from 'react'
import type { SendFn } from '@/studio/types'
import { request } from '@/shared/api'
import { useMediaPlayerStore, DEFAULT_PLAYER_STATE, type PlayerState } from './mediaplayer.store'
import { mediaplayerMessages as M } from './mediaplayer.messages'
import { WhepClient } from '@/lib/webrtc'

interface RawProduction { sources?: Array<{ sourceId: string; mixerInput: string }> }
interface RawSource { id: string; name: string; streamType?: string; playlist?: string[]; address?: string }
interface MediaPlayerSource { id: string; name: string; playlist?: string[]; address?: string }

const EMPTY_PLAYLIST: string[] = []

function fmtTime(ms: number): string {
  if (ms < 0) ms = 0
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

function MediaPlayerPopupCard({ mp, send, productionId, whepUrl, tally }: { mp: MediaPlayerSource; send: SendFn; productionId: string | null; whepUrl: string | null; tally: 'pgm' | 'pvw' | 'off' }) {
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
  const previewVideoRef = useRef<HTMLVideoElement>(null)
  const [holdOn, setHoldOn] = useState(false)
  const holdPgmTriggered = useRef(false)

  // Hold: auto-play when source goes to PGM
  useEffect(() => {
    if (tally === 'pgm' && holdOn && !holdPgmTriggered.current && playerState.state === 'stopped') {
      holdPgmTriggered.current = true
      handlePlay()
      // Reset trigger when clip stops or tally changes
      setTimeout(() => { holdPgmTriggered.current = false }, 1000)
    }
    if (tally !== 'pgm') {
      holdPgmTriggered.current = false
    }
  }, [tally, holdOn])

  const [mpStream, setMpStream] = useState<MediaStream | null>(null)
  const whepRef = useRef<WhepClient | null>(null)

  useEffect(() => { initPlaylist(mp.id, mp.playlist ?? []) }, [mp.id, mp.playlist, initPlaylist])
  useEffect(() => { setLoop(mp.id, playerState.loopPlaylist) }, [mp.id, playerState.loopPlaylist, setLoop])

  // Per-player WHEP connection
  useEffect(() => {
    if (!whepUrl) return
    const url = whepUrl.replace('localhost', window.location.hostname)
    const client = new WhepClient(url, {
      onVideoTrack: (stream: MediaStream) => setMpStream(stream),
      onConnected: () => {},
      onDisconnected: () => setMpStream(null),
      onError: () => {},
    })
    whepRef.current = client
    client.connect()
    return () => { client.disconnect() }
  }, [whepUrl])

  // Bind stream to preview video
  useEffect(() => {
    const video = previewVideoRef.current
    if (video && mpStream && video.srcObject !== mpStream) {
      video.srcObject = mpStream
    }
  }, [mpStream])

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
          const mk = data.clipMarks
          if (mk?.markOut != null && data.state === 'playing') {
            const markOutMs = mk.markOut * 1000
            const posMs = Math.floor((data.position_ns || 0) / 1_000_000)
            if (posMs >= markOutMs && !markOutSent.current) {
              markOutSent.current = true
              send(M.control(mp.id, 'stop'))
            }
          } else { markOutSent.current = false }
        }
      } catch {}
    }
    void poll()
    pollRef.current = setInterval(() => { void poll() }, 250)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [productionId, mp.id, setPlayerState, send])

  const displayPosition = marks?.markIn != null ? playerState.positionMs - marks.markIn * 1000 : playerState.positionMs
  const displayDuration = marks?.markOut != null
    ? (marks.markOut - (marks.markIn ?? 0)) * 1000
    : marks?.markIn != null ? playerState.durationMs - marks.markIn * 1000 : playerState.durationMs
  const durationSec = displayDuration / 1000

  const tallyRing = tally === 'pgm' ? 'ring-2 ring-red-500' : tally === 'pvw' ? 'ring-2 ring-green-500' : 'ring-1 ring-zinc-700'

  const handlePlay = () => {
    if (playlistDirty.current && playerPlaylist.length > 0) {
      send(M.setPlaylist(mp.id, playerPlaylist))
      send(M.goto(mp.id, 0))
      playlistDirty.current = false
    } else {
      send(M.control(mp.id, 'play'))
      setTimeout(() => {
        const ms = marks?.markIn != null ? marks.markIn * 1000 : 0
        if (ms > 0) send(M.seek(mp.id, ms))
      }, 200)
      return
    }
    send(M.control(mp.id, 'play'))
  }

  return (
    <div className="bg-[#0b0f14] border border-zinc-800 rounded p-2 text-[11px]">
      {/* PGM video window with tally ring */}
      <div className={`relative bg-black rounded overflow-hidden mb-2 ${tallyRing}`}>
        <video ref={previewVideoRef} className="w-full aspect-video object-contain bg-black" autoPlay playsInline muted />
        {tally !== 'off' && (
          <div className={`absolute top-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${tally === 'pgm' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
            {tally}
          </div>
        )}
        {!mpStream && (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-600 text-[10px]">MP preview connecting...</div>
        )}
      </div>

      {/* Scrubber — always visible when clip loaded, pauses during drag */}
      {playerState.durationMs > 0 && (
        <div className="mb-2">
          <input type="range" min={0} max={durationSec * 1000} value={displayPosition}
            onPointerDown={() => {
              // Pause playback during scrub
              if (playerState.state === 'playing') send(M.control(mp.id, 'pause'))
            }}
            onChange={(e) => {
              const pos = Number(e.target.value)
              const realPos = marks?.markIn != null ? pos + marks.markIn * 1000 : pos
              send(M.seek(mp.id, realPos))
            }}
            className="w-full h-1.5 appearance-none bg-zinc-700 rounded-full cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-orange-500
              [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-orange-500 [&::-moz-range-thumb]:border-0" />
        </div>
      )}

      {/* Header with name + time */}
      <div className="flex items-center gap-1.5 mb-2">
        <span className={`w-2 h-2 rounded-full shrink-0 ${playerState.state === 'playing' ? 'bg-green-500' : playerState.state === 'paused' ? 'bg-amber-500' : 'bg-zinc-500'}`} />
        <span className="font-semibold text-white text-xs truncate">{mp.name}</span>
        {playerState.state === 'playing' && (
          <span className="text-[10px] text-zinc-500 ml-auto tabular-nums">{fmtTime(displayPosition)} / {fmtTime(displayDuration)}</span>
        )}
      </div>

      {/* Transport + IN/OUT + loop + browser */}
      <div className="flex items-center gap-1 mb-2 flex-wrap">
        <div className="flex gap-1">
          <button type="button"
            className={`px-2 py-1 rounded text-[10px] font-semibold text-green-400 border bg-transparent hover:bg-green-950 ${playerState.state === 'playing' ? 'border-green-400' : 'border-zinc-700'}`}
            onClick={handlePlay}>▶</button>
          <button type="button"
            className={`px-2 py-1 rounded text-[10px] font-semibold text-amber-400 border bg-transparent hover:bg-amber-950 ${playerState.state === 'paused' ? 'border-amber-400' : 'border-zinc-700'}`}
            onClick={() => { playerState.state === 'paused' ? send(M.control(mp.id, 'play')) : send(M.control(mp.id, 'pause')) }}>⏸</button>
          <button type="button"
            className={`px-2 py-1 rounded text-[10px] font-semibold text-red-400 border bg-transparent hover:bg-red-950 ${playerState.state === 'stopped' ? 'border-red-400' : 'border-zinc-700'}`}
            onClick={() => send(M.control(mp.id, 'stop'))}>⏹</button>
          <button type="button"
            className="px-2 py-1 rounded text-[10px] font-semibold text-blue-400 border border-zinc-700 bg-transparent hover:bg-blue-950"
            onClick={() => send(M.control(mp.id, 'next'))}>⏭</button>
          <button type="button"
            className={`px-2 py-1 rounded text-[10px] font-semibold border ${holdOn ? 'text-orange-400 bg-orange-950/50 border-orange-600' : 'text-zinc-500 border-zinc-700 hover:text-orange-400'}`}
            onClick={() => { const next = !holdOn; setHoldOn(next); send(M.hold(mp.id, next)) }}
            title="Auto-play on PGM with fade">HOLD</button>
        </div>
        <div className="flex gap-1 ml-auto">
          <button type="button"
            className={`px-1.5 py-1 rounded text-[9px] font-semibold border ${marks?.markIn != null ? 'text-green-400 border-green-600 bg-green-950/50' : 'text-zinc-500 border-zinc-700 bg-transparent hover:text-green-400'}`}
            onClick={() => { const nowSec = playerState.positionMs / 1000; send(M.setMarks(mp.id, playerState.currentFileIndex, nowSec, marks?.markOut)) }}
            title="Set Mark IN at current position">IN</button>
          <button type="button"
            className={`px-1.5 py-1 rounded text-[9px] font-semibold border ${marks?.markOut != null ? 'text-red-400 border-red-600 bg-red-950/50' : 'text-zinc-500 border-zinc-700 bg-transparent hover:text-red-400'}`}
            onClick={() => { const nowSec = playerState.positionMs / 1000; send(M.setMarks(mp.id, playerState.currentFileIndex, marks?.markIn, nowSec)) }}
            title="Set Mark OUT at current position">OUT</button>
          {(marks?.markIn != null || marks?.markOut != null) && (
            <button type="button" className="px-1.5 py-1 rounded text-[9px] text-zinc-600 border border-zinc-700 bg-transparent hover:text-white"
              onClick={() => send(M.setMarks(mp.id, playerState.currentFileIndex, undefined, undefined))} title="Clear marks">✕</button>
          )}
          <button type="button" onClick={() => { setLoop(mp.id, !loopOn); send(M.toggleLoop(mp.id, !loopOn)) }}
            className={`px-2 py-1 rounded text-[10px] font-semibold border bg-transparent ${loopOn ? 'text-green-400 border-green-400' : 'text-zinc-500 border-zinc-600 hover:text-green-400'}`}
            title="Loop playlist">↺</button>
          <button type="button" onClick={() => { if (!showBrowser) loadBrowser('host/media'); setShowBrowser(!showBrowser) }}
            className={`px-2 py-1 rounded text-[10px] font-semibold border bg-transparent ${showBrowser ? 'text-orange-400 border-orange-400' : 'text-zinc-400 border-zinc-600'}`}
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
                onClick={() => { const next = new Set(selectedFiles); sel ? next.delete(f) : next.add(f); setSelectedFiles(next) }}>🎬 {f}</button>
            )
          })}
          {selectedFiles.size > 0 && (
            <button type="button" className="mt-2 w-full px-2 py-1 rounded text-[10px] font-semibold bg-green-600 text-white border border-green-600 hover:bg-green-700"
              onClick={() => {
                const newList = Array.from(selectedFiles); setPlaylist(mp.id, newList); setSelectedFiles(new Set()); setShowBrowser(false); playlistDirty.current = true
                request(`/api/v1/sources/${mp.id}`, { method: 'PATCH', body: JSON.stringify({ playlist: newList }) }).catch(() => {})
                send(M.setPlaylist(mp.id, newList))
              }}>Add {selectedFiles.size} clips to playlist</button>
          )}
        </div>
      )}

      {/* Playlist */}
      {playerPlaylist.length > 0 && (
        <div className="flex flex-col gap-1">
          {playerPlaylist.map((f, i) => {
            const isActive = i === playerState.currentFileIndex
            const itemMarks = allMarks[i] ?? null
            const pct = isActive && playerState.durationMs > 0 ? Math.min(100, (playerState.positionMs / playerState.durationMs) * 100) : 0
            const dur = playerState.durationMs || 1
            const markInPct = itemMarks?.markIn != null ? (itemMarks.markIn * 1000 / dur) * 100 : null
            const markOutPct = itemMarks?.markOut != null ? (itemMarks.markOut * 1000 / dur) * 100 : null
            return (
              <div key={f} className="relative cursor-pointer" onClick={() => send(M.goto(mp.id, i))}>
                <div className="absolute inset-0 rounded border border-zinc-600 overflow-hidden">
                  {isActive && pct > 0 && <div className="absolute inset-y-0 left-0 bg-orange-500/30" style={{ width: `${pct}%` }} />}
                  {isActive && markInPct != null && markOutPct != null && markOutPct > markInPct && (
                    <div className="absolute inset-y-0 bg-green-500/15 border-l border-r border-green-500/40" style={{ left: `${markInPct}%`, width: `${markOutPct - markInPct}%` }} />
                  )}
                </div>
                <div className={`relative z-10 px-1.5 py-0.5 text-[10px] truncate ${isActive ? 'text-white font-semibold' : 'text-zinc-400'}`}>
                  <span className="text-zinc-600 mr-1">{i + 1}.</span>{f}
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

export function MediaPlayerPopup({ send, productionId }: { send: SendFn; productionId: string | null }) {
  const [mediaPlayers, setMediaPlayers] = useState<MediaPlayerSource[]>([])
  const [mpWhepUrls, setMpWhepUrls] = useState<Record<string, string>>({})
  const [tallyMap, setTallyMap] = useState<Record<string, 'pgm' | 'pvw' | 'off'>>({})

  // Fetch per-media-player WHEP URLs + tally from production
  useEffect(() => {
    if (!productionId) return
    const poll = () => {
      request<{ whepOutputUrls?: Array<{ outputId: string; url: string }>; tally?: { pgm?: string; pvw?: string }; sources?: Array<{ sourceId: string; mixerInput: string }> }>(`/api/v1/productions/${productionId}`)
        .then(d => {
          const map: Record<string, string> = {}
          for (const entry of d.whepOutputUrls ?? []) {
            if (entry.outputId.startsWith('__mpwhep__')) {
              const sourceId = entry.outputId.replace('__mpwhep__', '')
              map[sourceId] = entry.url
            }
          }
          setMpWhepUrls(map)
          // Build tally from production sources
          const tal: Record<string, 'pgm' | 'pvw' | 'off'> = {}
          const pgm = d.tally?.pgm
          const pvw = d.tally?.pvw
          for (const s of d.sources ?? []) {
            if (s.mixerInput === pgm) tal[s.sourceId] = 'pgm'
            else if (s.mixerInput === pvw) tal[s.sourceId] = 'pvw'
            else tal[s.sourceId] = 'off'
          }
          setTallyMap(tal)
        }).catch(() => {})
    }
    void poll()
    const id = setInterval(poll, 2000)
    return () => clearInterval(id)
  }, [productionId])

  // Fetch media player sources
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
          .map((s) => ({ id: s.id, name: s.name, playlist: s.playlist, address: s.address }))
        setMediaPlayers(list)
      } catch {}
    })()
    return () => { cancelled = true }
  }, [productionId])

  return (
    <div className="flex flex-col h-screen bg-[#0d1117] text-white">
      <div className="flex items-center gap-2 text-zinc-500 shrink-0 px-3 py-2 border-b border-zinc-800">
        <span className="text-[10px] font-semibold uppercase tracking-widest">Media Player</span>
        <span className="text-[9px] text-zinc-600">{mediaPlayers.length}</span>
      </div>
      <div className="overflow-y-auto flex-1 min-h-0 p-3">
        {mediaPlayers.length === 0 ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <p className="text-xs text-zinc-700 uppercase tracking-widest">NO MEDIA PLAYERS</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 max-w-[380px] mx-auto">
            {mediaPlayers.map((mp) => (
              <MediaPlayerPopupCard key={mp.id} mp={mp} send={send} productionId={productionId} whepUrl={mpWhepUrls[mp.id] || null} tally={tallyMap[mp.id] || 'off'} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
