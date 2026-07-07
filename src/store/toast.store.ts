import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

interface Toast {
  id: number
  message: string
  issues?: string[]
  variant: 'error' | 'info'
  persistent?: boolean
  hasReconnect?: boolean
  tag?: string
}

interface ToastStore {
  toasts: Toast[]
  addToast: (message: string, variant?: Toast['variant'], options?: { persistent?: boolean; onReconnect?: () => Promise<void>; tag?: string; issues?: string[] }) => void
  removeToast: (id: number) => void
  removeToastsByTag: (tag: string) => void
  upsertToastByTag: (tag: string, message: string, variant?: Toast['variant'], options?: { persistent?: boolean; onReconnect?: () => Promise<void>; issues?: string[]; mergeIssues?: boolean }) => void
}

// Callbacks stored outside immer to avoid freezing
const reconnectCallbacks = new Map<number, () => Promise<void>>()

let nextId = 1

export const useToastStore = create<ToastStore>()(
  immer((set) => ({
    toasts: [],
    addToast: (message, variant = 'error', options = {}) => {
      const id = nextId++
      if (options.onReconnect) {
        reconnectCallbacks.set(id, options.onReconnect)
      }
      set((s) => {
        s.toasts.push({ id, message, issues: options.issues, variant, persistent: options.persistent, hasReconnect: !!options.onReconnect, tag: options.tag })
      })
      if (!options.persistent) {
        setTimeout(() => {
          set((s) => { s.toasts = s.toasts.filter((t) => t.id !== id) })
          reconnectCallbacks.delete(id)
        }, 6000)
      }
    },
    removeToast: (id) => {
      reconnectCallbacks.delete(id)
      set((s) => { s.toasts = s.toasts.filter((t) => t.id !== id) })
    },
    removeToastsByTag: (tag) => {
      set((s) => {
        s.toasts.filter((t) => t.tag === tag).forEach((t) => reconnectCallbacks.delete(t.id))
        s.toasts = s.toasts.filter((t) => t.tag !== tag)
      })
    },
    upsertToastByTag: (tag, message, variant = 'error', options = {}) => {
      set((s) => {
        const existing = s.toasts.find((t) => t.tag === tag)
        if (existing) {
          if (options.onReconnect) {
            reconnectCallbacks.set(existing.id, options.onReconnect)
            existing.hasReconnect = true
          }
          existing.message = message
          existing.variant = variant
          if (options.mergeIssues && options.issues) {
            const merged = [...(existing.issues ?? [])]
            for (const issue of options.issues) {
              if (!merged.includes(issue)) merged.push(issue)
            }
            existing.issues = merged
          } else {
            existing.issues = options.issues
          }
          existing.persistent = options.persistent ?? existing.persistent
        } else {
          const id = nextId++
          if (options.onReconnect) reconnectCallbacks.set(id, options.onReconnect)
          s.toasts.push({ id, message, issues: options.issues, variant, persistent: options.persistent, hasReconnect: !!options.onReconnect, tag })
        }
      })
    },
  }))
)

export function getReconnectCallback(id: number): (() => Promise<void>) | undefined {
  return reconnectCallbacks.get(id)
}
