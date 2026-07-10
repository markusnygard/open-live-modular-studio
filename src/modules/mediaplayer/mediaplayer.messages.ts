import type { OutboundMessage } from '@/shared/types'

/**
 * Outbound WebSocket message builders for the media player transport.
 *
 * The media player has no inbound WS state stream — transport state is polled
 * over HTTP (`/api/v1/productions/{id}/player-state/{sourceId}`). These helpers
 * centralise construction of the control messages the module sends, keeping the
 * component free of inline message literals.
 */
export const mediaplayerMessages = {
  control: (sourceId: string, action: 'play' | 'pause' | 'stop' | 'next' | 'previous'): OutboundMessage =>
    ({ type: 'MEDIAPLAYER_CONTROL', sourceId, action }),

  seek: (sourceId: string, positionMs: number): OutboundMessage =>
    ({ type: 'MEDIAPLAYER_SEEK', sourceId, positionMs }),

  goto: (sourceId: string, index: number): OutboundMessage =>
    ({ type: 'MEDIAPLAYER_GOTO', sourceId, index }),

  toggleLoop: (sourceId: string, active: boolean): OutboundMessage =>
    ({ type: 'MEDIAPLAYER_TOGGLE_LOOP', sourceId, active }),

  setPlaylist: (sourceId: string, files: string[]): OutboundMessage =>
    ({ type: 'MEDIAPLAYER_SET_PLAYLIST', sourceId, files }),

  setMarks: (sourceId: string, clipIndex: number, markIn?: number, markOut?: number): OutboundMessage =>
    ({ type: 'MEDIAPLAYER_SET_MARKS', sourceId, clipIndex, markIn, markOut }),
}
