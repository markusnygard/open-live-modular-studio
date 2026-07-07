import { createBrowserRouter, Navigate, useSearchParams } from 'react-router'
import { Shell } from '@/components/layout/Shell'
import { SetupPage } from '@/pages/SetupPage'
import { ProductionsPage } from '@/pages/ProductionsPage'
import { StudioPage } from '@/pages/StudioPage'
import { PanePage } from '@/pages/PanePage'

function StudioPageWrapper() {
  const [searchParams] = useSearchParams()
  const productionId = searchParams.get('production')
  return productionId
    ? <StudioPage productionId={productionId} />
    : <Navigate to="/productions" replace />
}
import '@/modules/multiviewer'
import '@/modules/pgm'
import '@/modules/timer'
import '@/modules/controller'
import '@/modules/audio'
import '@/modules/looks'
import '@/modules/pip'
import '@/modules/mediaplayer'
import '@/modules/outputs/srt-stream'
import '@/modules/outputs/efp-stream'
import '@/modules/outputs/recording'
import '@/modules/outputs/ndi-output'
import '@/modules/outputs/sdi-output'

export const router = createBrowserRouter([
  {
    // Pop-out module pane — no Shell, no nav
    path: '/pane/:moduleId',
    element: <PanePage productionId={null} />,
  },
  {
    path: '/',
    element: <Shell />,
    children: [
      { index: true, element: <Navigate to="/productions" replace /> },
      { path: 'productions', element: <ProductionsPage /> },
      { path: 'setup/*', element: <SetupPage /> },
    ],
  },
  {
    // Studio (production view) — modular system, full screen, no Shell
    path: '/studio',
    element: <StudioPageWrapper />,
  },
])
