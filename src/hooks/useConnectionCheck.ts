import { useEffect } from 'react'
import { statusApi } from '@/lib/api'
import { useToastStore } from '@/store/toast.store'

const TAG = 'connection'
let initialCheckDone = false

export function isInitialCheckDone() {
  return initialCheckDone
}

function showConnectionToast(issues: string[]) {
  const { upsertToastByTag, removeToastsByTag } = useToastStore.getState()
  removeToastsByTag('api-error')
  if (issues.length === 0) {
    removeToastsByTag(TAG)
    return
  }
  upsertToastByTag(TAG, 'Connection issues detected:', 'error', {
    persistent: true,
    onReconnect: runReconnect,
    issues,
  })
}

export async function runReconnect(): Promise<void> {
  let status: { db: boolean; strom: boolean } | null = null

  try {
    const result = await statusApi.reconnect()
    status = result
  } catch {
    // reconnect returns 503 with body when something is still down
    // fall through to a plain status check
  }

  const [finalStatus] = await Promise.all([
    status ? Promise.resolve(status) : statusApi.get().catch(() => null),
    new Promise((r) => setTimeout(r, 1000)),
  ])

  const issues: string[] = []
  if (!finalStatus) {
    issues.push('Cannot reach Open Live backend')
  } else {
    if (!finalStatus.db) issues.push('Database unreachable')
    if (!finalStatus.strom) issues.push('Media pipeline unreachable')
  }
  showConnectionToast(issues)
}

async function runCheck(): Promise<void> {
  try {
    const status = await statusApi.get()
    const issues: string[] = []
    if (!status.db) issues.push('Database unreachable')
    if (!status.strom) issues.push('Media pipeline unreachable')
    showConnectionToast(issues)
  } catch {
    showConnectionToast(['Cannot reach Open Live backend'])
  } finally {
    initialCheckDone = true
  }
}

export function useConnectionCheck() {
  useEffect(() => {
    runCheck()
  }, [])
}
