# Open Live Modular Studio

Modular alternative to Open Live Studio. Isolated modules with event bus and shared WebSocket.

## Quick Start

```bash
pnpm install
pnpm exec vite dev
```

Open http://localhost:5173/studio-modular

## Architecture

Each feature is a self-contained module in `src/modules/`. Modules communicate via a typed EventBus and a shared WebSocket provider. See `docs/superpowers/specs/2026-07-07-modular-studio-design.md` for the full design.

## Modules

- **multiviewer** — WHEP video preview
- **pgm** — PGM monitor
- **controller** — CUT/AUTO/FTB/DSK/Macros + keyboard shortcuts
- **audio** — Channel strips, VU/EBU meters, EQ/comp/gate, AFV
- **looks** — Per-source shader effects
- **pip** — Picture-in-picture editor
- **mediaplayer** — Transport, playlist, file browser
- **timer** — Program clock
- **srtStream**, **efpStream**, **recording**, **ndiOutput**, **sdiOutput** — Output flows

## Docker Compose (alongside Open Live)

Add to your docker-compose.yml:

```yaml
  modular-studio:
    image: node:23-slim
    container_name: open-live-modular-studio
    working_dir: /app
    volumes:
      - ./modular-studio:/app
    ports:
      - "3001:5173"
    command: sh -c "corepack enable && pnpm install && pnpm exec vite --host 0.0.0.0 --port 5173"
```
