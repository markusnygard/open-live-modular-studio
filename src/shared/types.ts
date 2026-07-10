// ─── Picture-in-Picture protocol types ──────────────────────────────────────────
export interface ZoneBorder {
  /** #RRGGBB or #RRGGBBAA hex string */
  color: string
  /** Width in PGM canvas pixels (0–64) */
  width: number
}

export interface PipZone {
  rect: { x: number; y: number; w: number; h: number } | null
  capacity: number | null
  sources: number[]
  /** Border drawn around each source box in this zone. Strom 0.6.6+. */
  border?: ZoneBorder
}

/** Normalized per-source crop: fraction hidden from each edge (0.0–1.0). */
export interface SourceCrop {
  left: number
  top: number
  right: number
  bottom: number
}

/** Map of input index → SourceCrop. Strom 0.6.2+. */
export type PipTransforms = Record<number, SourceCrop>

export interface PipConfig {
  bg: number | null
  zones: PipZone[]
  /** Per-source crop/zoom transforms. Strom 0.6.2+; defaults to {} on older Strom. */
  transforms: PipTransforms
}

// ─── Video effect (Looks/FX) protocol types ────────────────────────────────────
export type VideoEffect =
  | { type: 'none' }
  | { type: 'chroma_key'; key_color: string; similarity: number; smoothness: number; spill: number }
  | { type: 'pixelate'; block_size: number }
  | { type: 'blur'; radius: number }
  | { type: 'duotone'; low: string; high: string; mix: number }
  | { type: 'vignette'; amount: number; softness: number }
  | { type: 'vhs'; intensity: number }
  | { type: 'old_film'; intensity: number }
  | { type: 'edge_glow'; color: string; intensity: number }
  | { type: 'crt'; intensity: number }
  | { type: 'halftone'; dot_size: number }
  | { type: 'thermal'; intensity: number }
  | { type: 'night_vision'; intensity: number }
  | { type: 'posterize'; levels: number }
  | { type: 'underwater'; intensity: number }
  | { type: 'color_correct'; brightness: number; contrast: number; saturation: number; hue: number; gamma: number; temperature: number; tint: number }

/** Target for a video effect: an input index or the master output. */
export type EffectTarget = { input: number } | 'master'

export type OutboundMessage =
  | { type: 'CUT'; mixerInput: string; afvRampMs?: number }
  | { type: 'TRANSITION'; mixerInput: string; transitionType: string; durationMs?: number; afvRampMs?: number }
  | { type: 'TAKE'; pip?: number; afvRampMs?: number }
  | { type: 'SET_PVW'; mixerInput: string }
  | { type: 'FTB'; active?: boolean; durationMs?: number }
  | { type: 'SET_OVL'; alpha: number }
  | { type: 'GO_LIVE' }
  | { type: 'CUT_STREAM' }
  | { type: 'GRAPHIC_ON'; overlayId: string }
  | { type: 'GRAPHIC_OFF'; overlayId: string }
  | { type: 'DSK_TOGGLE'; layer: number; visible?: boolean }
  | { type: 'MACRO_EXEC'; macroId: string }
  | { type: 'AUDIO_SET'; elementId: string; property: 'volume' | 'mute'; value: unknown; ramp_ms?: number }
  | { type: 'AFV_SET'; mixerInput: string; enabled: boolean }
  | { type: 'AFV_RAMP_SET'; rampUpMs: number; rampDownMs: number }
  | { type: 'PFL_SET'; elementId: string; enabled: boolean; volume?: number }
  | { type: 'AFL_SET'; elementId: string; enabled: boolean }
  | { type: 'AUX_SEND_SET'; elementId: string; auxBus: number; level: number; enabled: boolean; pre?: boolean }
  | { type: 'AUX_MASTER_SET'; auxBus: number; volume: number; muted: boolean }
  | { type: 'GRP_SEND_SET'; elementId: string; grpBus: number; level: number; enabled: boolean }
  | { type: 'GRP_MASTER_SET'; grpBus: number; volume: number; muted: boolean }
  | { type: 'MONITOR_SET'; volume: number; muted: boolean }
  | { type: 'LOUDNESS_RESET' }
  | { type: 'SOURCE_OFFSET_SET'; mixerInput: string; offsetMs: number }
  | { type: 'SOURCE_AUDIO_OFFSET_SET'; mixerInput: string; offsetMs: number }
  | { type: 'RECORDER_SPLIT'; outputId: string }
  | { type: 'RECORDER_TOGGLE'; outputId: string; active: boolean }
  | { type: 'MEDIAPLAYER_CONTROL'; sourceId: string; action: 'play' | 'pause' | 'stop' | 'next' | 'previous' }
  | { type: 'MEDIAPLAYER_SEEK'; sourceId: string; positionMs: number }
  | { type: 'MEDIAPLAYER_GOTO'; sourceId: string; index: number }
  | { type: 'MEDIAPLAYER_TOGGLE_LOOP'; sourceId: string; active: boolean }
  | { type: 'MEDIAPLAYER_SET_PLAYLIST'; sourceId: string; files: string[] }
  | { type: 'MEDIAPLAYER_SET_MARKS'; sourceId: string; clipIndex: number; markIn?: number; markOut?: number }
  | { type: 'AUDIO_DYNAMICS_SET'; channel: number; property: string; value: number | boolean }
  | { type: 'SET_EFFECT'; target: EffectTarget; effect: VideoEffect }
  | { type: 'SET_PIP'; pip: number; bg: number | null; zones: PipZone[]; transforms?: PipTransforms }
  | { type: 'SELECT_PVW_PIP'; pip: number }

export type SendFn = (message: OutboundMessage) => void
