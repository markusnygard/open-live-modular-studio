import { useEffect, useRef, useState } from 'react'
import type { SendFn } from '@/studio/types'

export function PgmModule({ productionId }: { send: SendFn; productionId: string | null }) {
  const [pgmEndpoint, setPgmEndpoint] = useState<string | null>(null)
  const [connectionState, setConnectionState] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected')
  const videoRef = useRef<HTMLVideoElement>(null)
  const clientRef = useRef<{ close: () => void } | null>(null)

  useEffect(() => {
    if (!productionId) {
      setPgmEndpoint(null)
      return
    }
    import('@/shared/api').then(({ request }) => {
      request<{ pgmWhepEndpoint?: string }>(`/api/v1/productions/${productionId}`)
        .then(d => setPgmEndpoint(d.pgmWhepEndpoint || null))
        .catch(() => setPgmEndpoint(null))
    })
  }, [productionId])

  useEffect(() => {
    if (!pgmEndpoint || !videoRef.current) return

    setConnectionState('connecting')
    let cancelled = false

    import('@/lib/webrtc').then(async ({ WhepClient }) => {
      const client = new WhepClient(
        pgmEndpoint,
        {
          onConnected: () => { if (!cancelled) setConnectionState('connected') },
          onError: () => { if (!cancelled) setConnectionState('disconnected') },
          onVideoTrack: (stream) => {
            if (!cancelled && videoRef.current) {
              videoRef.current.srcObject = stream
            }
          },
        },
        {
          iceServersUrl: '/api/v1/ice-servers',
        },
      )
      clientRef.current = client
      await client.connect()
    }).catch(() => {
      if (!cancelled) setConnectionState('disconnected')
    })

    return () => {
      cancelled = true
      clientRef.current?.close()
      clientRef.current = null
    }
  }, [pgmEndpoint])

  return (
    <div className="bg-black rounded w-full h-full flex items-center justify-center relative border border-zinc-800">
      {connectionState === 'connected' ? (
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-contain" />
      ) : connectionState === 'connecting' ? (
        <span className="text-zinc-500 text-xs">connecting...</span>
      ) : (
        <span className="text-zinc-700 text-xs">PGM offline</span>
      )}
    </div>
  )
}
