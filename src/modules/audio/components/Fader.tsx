import { Fragment, createContext, useContext } from 'react'
import { FADER_W, THUMB_CSS_W, FADER_H, FADER_CONTAINER_H, FADER_TICKS, volumeToFader } from '../audio.constants'

// Fader dimension context — lets the module (or a pop-out pane) override fader height
// to fill the available slot without prop-drilling through every strip component.
export interface FaderDims {
  faderH: number
  faderContainerH: number
}

const FaderDimsCtx = createContext<FaderDims>({ faderH: FADER_H, faderContainerH: FADER_CONTAINER_H })

export function FaderDimsProvider({ value, children }: { value: FaderDims; children: React.ReactNode }) {
  return <FaderDimsCtx.Provider value={value}>{children}</FaderDimsCtx.Provider>
}

export function useFaderDims(): FaderDims {
  return useContext(FaderDimsCtx)
}

// ── Fader ───────────────────────────────────────────────────────────────────────
// Rotated range input with dB-calibrated tick marks and the broadcast log taper.
// `value` is the linear volume (0–10); the taper maps it to a 0–1 handle position.
// `onChange` receives the raw handle position (0–1) — callers snap + convert to
// volume so they can apply optimistic store updates and throttle WS sends.
export function Fader({
  value,
  onChange,
  onMouseDown,
  onDoubleClick,
  ariaLabel,
  disabled = false,
  prePost,
}: {
  value: number
  onChange: (faderPos: number) => void
  onMouseDown?: () => void
  onDoubleClick?: () => void
  ariaLabel: string
  disabled?: boolean
  /** Optional PRE/POST badge above the fader (aux sends). */
  prePost?: 'PRE' | 'POST'
}) {
  const { faderContainerH } = useFaderDims()

  return (
    <div className="relative shrink-0" style={{ width: FADER_W, height: faderContainerH }}>
      {prePost && (
        <span
          className="absolute text-[7px] font-bold tracking-widest uppercase leading-none pointer-events-none"
          style={{ top: 0, left: '50%', transform: 'translateX(-50%)', color: prePost === 'PRE' ? '#f97316' : '#60a5fa' }}
        >
          {prePost}
        </span>
      )}

      {/* Track */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: 4,
          height: faderContainerH - THUMB_CSS_W,
          top: Math.round(THUMB_CSS_W / 2),
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#181818',
          border: '1px solid #2a2a2a',
        }}
      />

      {/* Tick marks */}
      {FADER_TICKS.map(({ pos, db, major, infinity: isInfinity }) => {
        const y = Math.round(THUMB_CSS_W / 2 + (1 - pos) * (faderContainerH - THUMB_CSS_W))
        return (
          <Fragment key={db}>
            <div
              className="absolute pointer-events-none"
              style={{
                top: y,
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: major ? 20 : 14,
                height: major ? 2 : 1,
                background: major ? '#505050' : '#383838',
              }}
            />
            <span
              className="absolute pointer-events-none"
              style={{
                top: y,
                left: 'calc(50% + 15px)',
                transform: 'translateY(-50%)',
                fontSize: isInfinity ? 9 : 6,
                lineHeight: 1,
                fontFamily: 'monospace',
                color: major ? '#505050' : '#383838',
                whiteSpace: 'nowrap',
              }}
            >
              {db}
            </span>
          </Fragment>
        )
      })}

      <input
        type="range"
        min={0}
        max={1}
        step={0.005}
        value={volumeToFader(value)}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        onDoubleClick={onDoubleClick}
        onMouseDown={onMouseDown}
        aria-label={ariaLabel}
        className="fader-rotated fader-handle-a"
        style={{
          width: faderContainerH,
          height: FADER_W,
          left: -(faderContainerH - FADER_W) / 2,
          top: (faderContainerH - FADER_W) / 2,
          cursor: disabled ? 'not-allowed' : 'pointer',
          zIndex: 2,
        }}
      />
    </div>
  )
}
