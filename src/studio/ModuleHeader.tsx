import type { ReactNode } from 'react'

// ── Icons ──────────────────────────────────────────────────────────────────────

function PopOutIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"
         strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 2H2v12h12V9" />
      <path d="M10 2h4v4" />
      <line x1="14" y1="2" x2="7" y2="9" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor"
         strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <line x1="2" y1="2" x2="14" y2="14" />
      <line x1="14" y1="2" x2="2" y2="14" />
    </svg>
  )
}

function FullscreenIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"
         strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 2 2 2 2 6" />
      <polyline points="10 14 14 14 14 10" />
      <line x1="2" y1="14" x2="6" y2="10" />
      <line x1="14" y1="2" x2="10" y2="6" />
    </svg>
  )
}

function ExitFullscreenIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"
         strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 2 2 2 2 4" />
      <polyline points="12 14 14 14 14 12" />
      <line x1="14" y1="2" x2="10" y2="6" />
      <line x1="2" y1="14" x2="6" y2="10" />
    </svg>
  )
}

function GearIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
         strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="3" />
      <path d="M8 1.5v2M8 12.5v2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M1.5 8h2M12.5 8h2M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4" />
    </svg>
  )
}

function InfoCircle() {
  return (
    <span className="flex items-center justify-center w-4 h-4 rounded-full border border-zinc-400 text-white hover:border-zinc-200 transition-colors cursor-help text-[10px] font-bold leading-none shrink-0">
      i
    </span>
  )
}

// ── ModuleHeader ───────────────────────────────────────────────────────────────

export interface ModuleHeaderProps {
  icon: ReactNode
  label: string
  tooltip?: string
  onPopOut?: () => void
  onHide?: () => void
  onSettings?: () => void
  fullscreenRef?: React.RefObject<HTMLElement | null>
  children?: ReactNode
}

/**
 * Standard panel header bar matching the existing Studio's SectionLabel pattern.
 * Renders: [icon] [LABEL] [children] [settings ⚙] [fullscreen ⛶] [popout ↗] [info ⓘ] [close ✕]
 *
 * Drop-in for every module panel — multiviewer, PGM, controller, audio, looks, pip, mediaplayer.
 * Matches the existing SectionLabel exactly: same icons, same sizing, same hover colors.
 */
export function ModuleHeader({
  icon, label, tooltip, onPopOut, onHide, onSettings, fullscreenRef, children,
}: ModuleHeaderProps) {
  const isFullscreen = (typeof document !== 'undefined')
    ? document.fullscreenElement === fullscreenRef?.current
    : false

  const handleFullscreen = () => {
    if (!fullscreenRef?.current) return
    if (document.fullscreenElement) {
      void document.exitFullscreen()
    } else {
      void fullscreenRef.current.requestFullscreen()
    }
  }

  return (
    <div className="flex items-center gap-1.5 text-[--color-text-muted] shrink-0">
      {/* Icon */}
      <span className="flex items-center">{icon}</span>

      {/* Label */}
      <span className="text-[10px] font-semibold uppercase tracking-widest">{label}</span>

      {/* Custom actions (mute, audio track selector, etc.) */}
      {children}

      {/* Settings gear */}
      {onSettings && (
        <button
          type="button"
          onClick={onSettings}
          title={`${label} settings`}
          className="cursor-pointer hover:text-[--color-text-primary] transition-colors"
        >
          <GearIcon />
        </button>
      )}

      {/* Fullscreen toggle */}
      {fullscreenRef && (
        <button
          type="button"
          onClick={handleFullscreen}
          title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          className="cursor-pointer hover:text-[--color-text-primary] transition-colors"
        >
          {isFullscreen ? <ExitFullscreenIcon /> : <FullscreenIcon />}
        </button>
      )}

      {/* Pop-out */}
      {onPopOut && (
        <button
          type="button"
          onClick={onPopOut}
          title={`Pop out ${label}`}
          className="cursor-pointer hover:text-[--color-text-primary] transition-colors"
        >
          <PopOutIcon />
        </button>
      )}

      {/* Info tooltip */}
      {tooltip && (
        <span title={tooltip}>
          <InfoCircle />
        </span>
      )}

      {/* Close / hide */}
      {onHide && (
        <button
          type="button"
          onClick={onHide}
          title={`Hide ${label}`}
          className="cursor-pointer hover:text-[--color-text-primary] transition-colors"
        >
          <CloseIcon />
        </button>
      )}
    </div>
  )
}
