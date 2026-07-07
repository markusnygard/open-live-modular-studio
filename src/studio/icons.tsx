// Studio header icons.
//
// The module-toggle icons (Multiviewer / Monitor / Controller / Audio / Looks /
// PiP / MediaPlayer) are copied verbatim from the original Open Live
// ControllerPage so the modular studio header is pixel-identical.
//
// The output icons (SRT / EFP / Recorder / NDI / SDI) are new, drawn in the
// same 20×20 stroke-based style so they sit consistently alongside the module
// toggles in the header's OUTPUT group.

// ─── Module toggle icons (verbatim from ControllerPage) ─────────────────────────

export function MonitorIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  )
}

export function MultiviewerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="2" y="3" width="20" height="15" rx="2" />
      <line x1="12" y1="3" x2="12" y2="18" strokeOpacity="0.5" />
      <line x1="2" y1="10.5" x2="22" y2="10.5" strokeOpacity="0.5" />
      <path d="M8 22h8M12 18v4" />
    </svg>
  )
}

export function ControllerIcon() {
  // T-bar: two bus rails (PGM top, PVW bottom) with a sliding handle — the iconic production switcher control
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6"  x2="21" y2="6"  />
      <line x1="3" y1="18" x2="21" y2="18" />
      <line x1="12" y1="6" x2="12" y2="18" strokeWidth="1" strokeOpacity="0.35" />
      <rect x="7" y="10" width="10" height="4" rx="2" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function AudioIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9v6h4l5 5V4L7 9H3Z" />
      <path d="M17.5 8.5a6 6 0 0 1 0 7" />
    </svg>
  )
}

export function PipIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20">
      <rect x="1" y="2" width="14" height="12" rx="1" />
      <rect x="9" y="8" width="5" height="4" rx="0.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function MediaPlayerIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
      <circle cx="24" cy="24" r="21.5" />
      <polygon points="32.7,24 19.7,16.49 19.7,31.51" />
    </svg>
  )
}

export function LooksIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20">
      <circle cx="8" cy="8" r="5.5" />
      <path d="M5 8a3 3 0 0 1 6 0" strokeLinecap="round" />
      <circle cx="8" cy="8" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  )
}

// ─── Output icons (new — same 20×20 stroke style) ───────────────────────────────

export function SrtStreamIcon() {
  // Data stream — two angled arrows flowing right, evoking an outbound transport feed
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 8l6 4-6 4" />
      <path d="M12 8l6 4-6 4" />
    </svg>
  )
}

export function EfpStreamIcon() {
  // Same data-stream idea, vertical orientation to distinguish from SRT
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 4l4 6 4-6" />
      <path d="M8 12l4 6 4-6" />
    </svg>
  )
}

export function RecorderIcon() {
  // Record button — outer ring with a filled centre dot
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function NdiIcon() {
  // Network — globe with meridians, evoking an IP video output
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18Z" />
    </svg>
  )
}

export function SdiIcon() {
  // BNC connector — concentric rings with a centre pin and a lead line
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="12" r="6" />
      <circle cx="9" cy="12" r="2" fill="currentColor" stroke="none" />
      <line x1="15" y1="12" x2="22" y2="12" />
    </svg>
  )
}
