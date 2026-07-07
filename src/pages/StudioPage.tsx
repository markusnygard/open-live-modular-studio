import { useSearchParams } from 'react-router'
import { StudioShell } from '@/studio/StudioShell'

export function StudioPage() {
  const [params] = useSearchParams()
  const productionId = params.get('production')
  return <StudioShell productionId={productionId} />
}
