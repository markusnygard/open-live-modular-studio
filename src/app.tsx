import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router'
import { StudioShell } from './studio/StudioShell'

function PanePage() {
  const { moduleId } = useParams<{ moduleId: string }>()
  return <div>Pane: {moduleId}</div>
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/studio-modular" element={<StudioShell productionId={null} />} />
        <Route path="/pane/:moduleId" element={<PanePage />} />
        <Route path="*" element={<Navigate to="/studio-modular" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
