// API calls use relative paths and go through Vite's dev proxy (vite.config.ts
// proxies /api and /ws to the backend). For direct browser connections (WHEP
// WebRTC), use the externally-accessible host.
export const BASE_URL = '' // relative paths → Vite proxy

export const STROM_HOST: string =
  import.meta.env.VITE_STROM_HOST ||
  window.location.hostname

export const WS_BASE: string =
  `ws://${STROM_HOST}:8000`
