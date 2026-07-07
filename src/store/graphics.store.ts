import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { devtools } from 'zustand/middleware'
import { graphicsApi, type ApiGraphic } from '@/lib/api'

export type { ApiGraphic as Graphic }

interface GraphicsState {
  graphics: ApiGraphic[]
  lastFetchedAt: number
  isLoading: boolean
}

interface GraphicsActions {
  fetchAll: () => Promise<void>
  addGraphic: (body: { name: string; url: string }) => Promise<void>
  updateGraphic: (id: string, body: { name?: string; url?: string }) => Promise<void>
  removeGraphic: (id: string) => Promise<void>
}

export const useGraphicsStore = create<GraphicsState & GraphicsActions>()(
  devtools(
    immer((set) => ({
      graphics: [],
      lastFetchedAt: Date.now(),
      isLoading: false,

      fetchAll: async () => {
        set((state) => { state.isLoading = true })
        try {
          const data = await graphicsApi.list()
          set((state) => {
            state.graphics = data
            state.isLoading = false
            state.lastFetchedAt = Date.now()
          })
        } catch {
          set((state) => { state.isLoading = false })
        }
      },

      addGraphic: async (body) => {
        const created = await graphicsApi.create(body)
        set((state) => { state.graphics.push(created) })
      },

      updateGraphic: async (id, body) => {
        const updated = await graphicsApi.update(id, body)
        set((state) => {
          const idx = state.graphics.findIndex((g) => g.id === id)
          if (idx >= 0) state.graphics[idx] = updated
        })
      },

      removeGraphic: async (id) => {
        await graphicsApi.remove(id)
        set((state) => { state.graphics = state.graphics.filter((g) => g.id !== id) })
      },
    })),
    { name: 'graphics', enabled: import.meta.env.DEV },
  ),
)
