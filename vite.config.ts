import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

const OPEN_LIVE_URL = process.env.OPEN_LIVE_URL || 'http://localhost:8000'

export default defineConfig({
  envPrefix: ['OPEN_LIVE_', 'VITE_', 'OSC_'],
  plugins: [
    tailwindcss(),
    react(),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3200,
    proxy: {
      '/api': OPEN_LIVE_URL,
      '/ws': { target: OPEN_LIVE_URL, ws: true },
    },
  },
})
