import { useState } from 'react'
import { useToastStore, getReconnectCallback } from '@/store/toast.store'

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore()
  const [reconnecting, setReconnecting] = useState<Set<number>>(new Set())

  if (toasts.length === 0) return null

  async function handleReconnect(id: number) {
    const cb = getReconnectCallback(id)
    if (!cb) return
    setReconnecting((s) => new Set(s).add(id))
    try {
      await cb()
    } finally {
      setReconnecting((s) => { const next = new Set(s); next.delete(id); return next })
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => {
        const isReconnecting = reconnecting.has(t.id)
        return (
          <div
            key={t.id}
            className="pointer-events-auto flex flex-col rounded border shadow-xl text-xs font-mono max-w-sm bg-zinc-900 border-red-700 text-red-300"
          >
            {/* Dismiss row */}
            <div className="flex justify-end px-3 pt-3">
              <button
                onClick={() => removeToast(t.id)}
                className="text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer leading-none"
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>

            {/* Title */}
            <div className="px-4 pt-2 pb-2">
              <span className="font-semibold text-red-200">{t.message}</span>
            </div>

            {/* Issues list */}
            {t.issues && t.issues.length > 0 && (
              <ul className="flex flex-col gap-1 px-4 pb-3">
                {t.issues.map((issue) => (
                  <li key={issue} className="flex items-center gap-1.5 text-red-400">
                    <span className="w-1 h-1 rounded-full bg-red-500 shrink-0" />
                    {issue}
                  </li>
                ))}
              </ul>
            )}

            {/* Reconnect button — right edge aligned with ✕ */}
            {t.hasReconnect && (
              <div className="flex justify-end px-3 pb-3">
                <button
                  onClick={() => handleReconnect(t.id)}
                  disabled={isReconnecting}
                  className="flex items-center gap-1.5 px-2 py-1 rounded bg-red-900 hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed text-red-200 text-xs font-mono cursor-pointer transition-colors"
                >
                  {isReconnecting && (
                    <svg className="animate-spin h-3 w-3 text-red-300" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                  )}
                  {isReconnecting ? 'Reconnecting…' : 'Reconnect'}
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
