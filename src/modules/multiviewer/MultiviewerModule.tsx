import { useEffect, useRef, useState } from 'react'
import type { SendFn } from '@/studio/types'
import { useWebRTC } from '@/hooks/useWebRTC'
import { useViewerStore } from '@/store/viewer.store'
import { request } from '@/shared/api'

export function MultiviewerModule({ productionId }: { send: SendFn; productionId: string | null }) {
  const [whepEndpoint, setWhepEndpoint] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const programStream = useViewerStore(s => s.programStream)
  const connectionState = useViewerStore(s => s.connectionState)

  useEffect(() => {
    if (!productionId) {
      setWhepEndpoint(null)
      return
    }
    request<{ whepEndpoint?: string }>(`/api/v1/productions/${productionId}`)
      .then(d => {
        const raw = d.whepEndpoint || null
        // Replace localhost with browser-accessible hostname
        setWhepEndpoint(raw ? raw.replace('localhost', window.location.hostname) : null)
      })
      .catch(() => setWhepEndpoint(null))
  }, [productionId])

  useWebRTC(whepEndpoint)

  useEffect(() => {
    const video = videoRef.current
    if (video && programStream && video.srcObject !== programStream) {
      video.srcObject = programStream
    }
  }, [programStream])

  return (
    <div className="bg-black rounded w-full h-full flex items-center justify-center relative">
      {connectionState === 'connected' ? (
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-contain" />
      ) : connectionState === 'connecting' ? (
        <span className="text-zinc-500 text-xs">connecting...</span>
      ) : (
        <span className="text-zinc-700 text-xs">offline</span>
      )}
    </div>
  )
}
