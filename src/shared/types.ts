export type OutboundMessage =
  | { type: 'CUT'; mixerInput: string; afvRampMs?: number }
  | { type: 'TRANSITION'; mixerInput: string; transitionType: string; durationMs?: number; afvRampMs?: number }
  | { type: 'TAKE'; afvRampMs?: number }
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
  | { type: 'PFL_SET'; elementId: string; enabled: boolean; volume?: number }
  | { type: 'AUX_SEND_SET'; elementId: string; auxBus: number; level: number; enabled: boolean }
  | { type: 'AUX_MASTER_SET'; auxBus: number; volume: number; muted: boolean }
  | { type: 'GRP_SEND_SET'; elementId: string; grpBus: number; level: number; enabled: boolean }
  | { type: 'GRP_MASTER_SET'; grpBus: number; volume: number; muted: boolean }
  | { type: 'SOURCE_OFFSET_SET'; mixerInput: string; offsetMs: number }
  | { type: 'RECORDER_SPLIT'; outputId: string }
  | { type: 'RECORDER_TOGGLE'; outputId: string; active: boolean }
  | { type: 'MEDIAPLAYER_CONTROL'; sourceId: string; action: 'play' | 'pause' | 'stop' | 'next' | 'previous' }
  | { type: 'MEDIAPLAYER_SEEK'; sourceId: string; positionMs: number }
  | { type: 'MEDIAPLAYER_GOTO'; sourceId: string; index: number }
  | { type: 'MEDIAPLAYER_TOGGLE_LOOP'; sourceId: string; active: boolean }
  | { type: 'MEDIAPLAYER_SET_PLAYLIST'; sourceId: string; files: string[] }
  | { type: 'AUDIO_DYNAMICS_SET'; channel: number; property: string; value: number | boolean }

export type SendFn = (message: OutboundMessage) => void
