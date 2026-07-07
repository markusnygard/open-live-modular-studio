export const BASE_URL: string =
  import.meta.env.VITE_OPEN_LIVE_URL || 'http://localhost:8000'

export const WS_BASE: string =
  import.meta.env.VITE_WS_BASE ||
  BASE_URL.replace(/^http/, 'ws')
