# Media Player Module — Implementation History

> Last updated: 2026-07-11

## Architecture

The media player module has two views:

- **Compact** (`MediaPlayerCard` — docked in studio grid): transport buttons, playlist, file browser, timecode
- **Popup** (`MediaPlayerPopupCard` — standalone window): same controls + per-player video preview + scrubber + IN/OUT marks + HOLD button

State is shared between both views via Zustand store. Both poll `/api/v1/productions/{id}/player-state/{sourceId}` every 250ms.

## What Works

| Feature | Status |
|---------|--------|
| Transport buttons (play/pause/stop/next) | Working |
| Playlist display + progress bars | Working |
| File browser (add clips) | Working |
| Loop toggle | Working |
| Per-clip IN/OUT marks (persist to CouchDB) | Working |
| Auto-stop at markOut | Working |
| Clear marks button | Working |
| Direct file preview in popup (HTML5 video) | Working |
| Scrubber in popup (range slider) | Working |
| Tally ring in popup (red=PGM, green=PVW) | Working |

## Attempted Fixes for markIn-based PLAY

### Problem
When markIn is set and user clicks PLAY, the clip should start playing from the IN mark position (not from 0).

### Attempt 1: `SEEK → PLAY` with setTimeout (200ms)
- Send seek(markIn) while stopped, wait 200ms, send PLAY
- **Failed**: seek on stopped player is a no-op (no internal pipeline loaded)

### Attempt 2: `GOTO → backend seek → PLAY` with setTimeout (300ms)
- Send GOTO, backend handler seeks to markIn, wait 300ms, send PLAY
- **Failed**: backend seek fires before pipeline finishes loading

### Attempt 3: `GOTO → backend seek (with 400ms delay) → PLAY` with setTimeout (600ms)
- Added `await new Promise(r => setTimeout(r, 400))` before markIn seek in backend
- **Failed**: setTimeout in backend handler races with frontend PLAY timer. PLAY fires before seek takes effect, clip starts from 0 then jumps

### Attempt 4: Remove backend setTimeout, direct await for seek, frontend 300ms
- Backend seeks synchronously after goto
- **Failed**: The `goto()` returns 200 OK but internal pipeline loading is async. Seek fires before pipeline is ready — position stays at 0

### Attempt 5: REMOVE all timeouts — poll-based state machine (CURRENT)
- Frontend sends `GOTO(index)` + sets `pendingPlayRef = true`
- Poll loop detects pipeline ready (duration_ns > 0)
- Send `SEEK(markIn)`, set `markInSoughtRef = true`
- Next poll: send `PLAY`, clear flags
- **Status**: Not yet verified working on production hardware

### Root cause analysis
The Strom media player bridge (`backend/src/blocks/builtin/mediaplayer/bridge.rs`) has a two-phase load:
1. `goto()` → returns HTTP 200 immediately
2. Internal pipeline loading runs asynchronously (uridecodebin → clocksync → appsink → appsrc)

The bridge's `load_current_file_inner()` destroys the old pipeline and creates a new one. The HTTP response comes back before the new pipeline is fully initialized. Any `seek()` sent after `goto()` returns but before pipeline init completes is silently ignored.

**The poll-based state machine solves this** by waiting until `duration_ns > 0` (which means the pipeline has loaded and decoded at least one frame) before sending the seek.

## HOLD Feature (auto-play on PGM)

### Desired behavior
1. Operator arms HOLD on a media player
2. Operator puts that source in PVW, presses TAKE
3. Clip auto-plays from markIn (or 0 if no mark)
4. After 1000ms, 500ms MIX transition fades into the clip
5. Near clip end (1s before markOut or clip duration), auto-MIX back to PVW source, clip stops

### Implementation
Backend `triggerHoldAutoPlay` + `startHoldMonitor` (500ms poll) handle the sequencing.
Frontend sends `MEDIAPLAYER_HOLD` WS message to arm/disarm.

### Current state
- HOLD button in popup sends/receives WS messages
- Backend handler receives and stores hold state
- TAKE handler calls `triggerHoldAutoPlay`
- `triggerHoldAutoPlay` sends GOTO(0) and sets `hold.pendingPlay = true`
- Hold monitor (500ms poll) should sequence: detect pipeline ready → seek → play → near-end → auto-fade-back
- **Status**: Not yet verified working on production hardware

## Root Issues

1. **Strom HTTP API returns before pipeline init**: No callback/event for "pipeline ready"
2. **Seek on stopped player is no-op**: Pipeline must be loaded AND in READY/PAUSED state
3. **Mid-playback seek breaks audio**: need to seek BEFORE play starts
4. **No event-driven pipeline state**: Must poll every 250/500ms to detect changes
5. **Backend WS handler and frontend poll compete**: Both tried to do markIn seek

## Files Changed

| File | Purpose |
|------|---------|
| `backend/src/ws/controller.ts` | HOLD handler, triggerHoldAutoPlay, startHoldMonitor, GOTO handler |
| `backend/src/db/types.ts` | clipMarks field on SourceDoc |
| `backend/src/routes/productions.ts` | player-state endpoint includes clipMarks |
| `modular-studio/src/modules/mediaplayer/MediaPlayerModule.tsx` | Compact view (PLAY button, poll loop, mark bands) |
| `modular-studio/src/modules/mediaplayer/MediaPlayerPopup.tsx` | Popup (scrubber, IN/OUT, HOLD, file preview) |
| `modular-studio/src/modules/mediaplayer/mediaplayer.messages.ts` | WS message builders |
| `modular-studio/src/modules/mediaplayer/mediaplayer.store.ts` | Zustand store with ClipMark types |
| `modular-studio/src/shared/types.ts` | OutboundMessage types |
