import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { StudioShell } from './studio/StudioShell'
import { PanePage } from './pages/PanePage'
import '@/modules/multiviewer'
import '@/modules/pgm'
import '@/modules/timer'
import '@/modules/controller'
import '@/modules/audio'
import '@/modules/looks'
import '@/modules/pip'
import '@/modules/mediaplayer'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/studio-modular" element={<StudioShell productionId={null} />} />
        <Route path="/pane/:moduleId" element={<PanePage productionId={null} />} />
        <Route path="*" element={<Navigate to="/studio-modular" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
