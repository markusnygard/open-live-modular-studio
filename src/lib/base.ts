declare global { interface Window { _env_?: Record<string, string> } }

// Empty string = relative paths will go through Vite's dev proxy.
// For direct browser connections (WHEP WebRTC), STROM_HOST is used instead.
export const BASE = (window._env_?.OPEN_LIVE_URL || '').replace(/\/$/, '')
