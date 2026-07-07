import { create } from 'zustand'
import { request } from '@/shared/api'

interface Production {
  _id: string
  name: string
  status: string
}

interface ProductionsStore {
  productions: Production[]
  activeId: string | null
  fetch: () => Promise<void>
  setActive: (id: string | null) => void
}

export const useProductionsStore = create<ProductionsStore>((set) => ({
  productions: [],
  activeId: null,
  fetch: async () => {
    try {
      const data = await request<unknown>('/api/v1/productions')
      const list = Array.isArray(data)
        ? data
        : (data as { productions?: unknown } | null)?.productions
      set({ productions: Array.isArray(list) ? (list as Production[]) : [] })
    } catch {
      set({ productions: [] })
    }
  },
  setActive: (id) => set({ activeId: id }),
}))
