import { useEffect, useState } from 'react'
import type { SendFn } from '@/studio/types'
import { request } from '@/shared/api'

// Lazy-load PgmPreview to avoid bundling it when PGM panel is hidden
let PgmPreviewComp: any = null

export function PgmModule({ productionId }: { send: SendFn; productionId: string | null }) {
  const [pgmEndpoint, setPgmEndpoint] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    import('@/studio/PgmPreview').then(m => {
      PgmPreviewComp = m.PgmPreview
      setLoaded(true)
    })
  }, [])

  useEffect(() => {
    if (!productionId) {
      setPgmEndpoint(null)
      return
    }
    request<{ pgmWhepEndpoint?: string }>(`/api/v1/productions/${productionId}`)
      .then(d => {
        const raw = d.pgmWhepEndpoint || null
        setPgmEndpoint(raw ? raw.replace('localhost', window.location.hostname) : null)
      })
      .catch(() => setPgmEndpoint(null))
  }, [productionId])

  if (!loaded || !pgmEndpoint) {
    return (
      <div className="bg-black rounded w-full h-full flex items-center justify-center relative border border-zinc-800">
        <span className="text-zinc-700 text-xs">{!pgmEndpoint ? 'PGM offline' : 'loading...'}</span>
      </div>
    )
  }

  const P = PgmPreviewComp!
  return <P channels={[{ label: 'PGM', url: pgmEndpoint }]} audioOn={false} onAudioOnChange={() => {}} audioTrack={0} onAudioTrackChange={() => {}} />
}
