import type { ReactNode } from 'react'
import { Tooltip } from '@/components/ui/Tooltip'

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
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 3 21 3 21 9" />
      <polyline points="9 21 3 21 3 15" />
      <line x1="21" y1="3" x2="14" y2="10" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  )
}

function ExitFullscreenIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 14 10 14 10 20" />
      <polyline points="20 10 14 10 14 4" />
      <line x1="10" y1="14" x2="3" y2="21" />
      <line x1="21" y1="3" x2="14" y2="10" />
    </svg>
  )
}

function GearIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
      <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
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
    <div className="flex items-center gap-1.5 text-[--color-text-primary] shrink-0">
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
        <Tooltip content={<span className="text-[11px] text-zinc-300 max-w-[260px] leading-relaxed">{tooltip}</span>}>
          <InfoCircle />
        </Tooltip>
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
