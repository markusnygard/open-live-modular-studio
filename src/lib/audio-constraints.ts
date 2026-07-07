/**
 * Audio constraints for intercom getUserMedia.
 * See docs/repo-patterns.md: "Echo cancellation must be explicitly requested"
 */
export const INTERCOM_AUDIO_CONSTRAINTS: MediaTrackConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  sampleRate: 48000,
}
