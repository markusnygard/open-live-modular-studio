import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import type { OutboundMessage } from '@/shared/types'
import type { EventBus } from '@/shared/event-bus'
import type { SendFn } from './types'
import { WS_BASE } from '@/shared/base'

interface WsCtx {
  send: SendFn
  productionId: string | null
  /** Register inbound handler for a message type. Returns unsubscribe. */
  onMessage: (type: string, handler: (msg: any) => void) => () => void
}

const WsContext = createContext<WsCtx | null>(null)

export function useWs(): WsCtx {
  const ctx = useContext(WsContext)
  if (!ctx) throw new Error('useWs must be used within WsProvider')
  return ctx
}

export function WsProvider({ productionId, eventBus, children }: {
  productionId: string | null
  eventBus: EventBus<any>
  children: React.ReactNode
}) {
  const wsRef = useRef<WebSocket | null>(null)
  const handlersRef = useRef<Map<string, Set<(msg: any) => void>>>(new Map())
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const retryCount = useRef(0)

  const connect = useCallback(() => {
    if (!productionId) return
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    const ws = new WebSocket(`${WS_BASE}/ws/productions/${productionId}/controller`)
    wsRef.current = ws

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data)
        const type = msg.type
        handlersRef.current.get(type)?.forEach(h => h(msg))
        // Also dispatch to catch-all
        handlersRef.current.get('*')?.forEach(h => h(msg))
      } catch {}
    }

    ws.onclose = () => {
      if (retryCount.current < 5 && productionId) {
        reconnectRef.current = setTimeout(() => {
          retryCount.current++
          connect()
        }, 2000)
      }
    }

    ws.onopen = () => { retryCount.current = 0; console.log('[WsProvider] connected') }
  }, [productionId])

  useEffect(() => {
    connect()
    return () => {
      clearTimeout(reconnectRef.current)
      wsRef.current?.close()
    }
  }, [connect])

  const send: SendFn = useCallback((msg) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg))
    } else {
      console.warn('[WsProvider] send dropped (not open):', msg.type, wsRef.current?.readyState)
    }
  }, [])

  const onMessage = useCallback((type: string, handler: (msg: any) => void) => {
    if (!handlersRef.current.has(type)) handlersRef.current.set(type, new Set())
    handlersRef.current.get(type)!.add(handler)
    return () => { handlersRef.current.get(type)?.delete(handler) }
  }, [])

  return (
    <WsContext.Provider value={{ send, productionId, onMessage }}>
      {children}
    </WsContext.Provider>
  )
}
