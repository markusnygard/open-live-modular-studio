import type { ReactNode, FC } from 'react'
import type { EventBus } from '@/shared/event-bus'
import type { OutboundMessage } from '@/shared/types'

export type SendFn = (msg: OutboundMessage) => void

export interface ModuleCtx {
  send: SendFn
  eventBus: EventBus<any>
  productionId: string | null
}

export interface StudioModule {
  id: string
  slot: 'top' | 'pgm' | 'bottom'
  label: string
  icon: ReactNode
  defaultVisible: boolean
  supportsPopout: boolean
  popoutSize?: { width: number; height: number }
  component: FC<{ send: SendFn; productionId: string | null }>
  standaloneComponent?: FC<{ send: SendFn; productionId: string | null }>
  onRegister?: (ctx: ModuleCtx) => () => void
  minWidth?: number
  maxWidth?: number
}

export type StudioEvent = {
  PGM_SOURCE_CHANGED: { sourceId: string }
  PVW_SOURCE_CHANGED: { sourceId: string }
  PRODUCTION_ACTIVATED: { productionId: string }
  PRODUCTION_DEACTIVATED: void
}
