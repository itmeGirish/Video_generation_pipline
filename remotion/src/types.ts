// Shared types for the renderer.
// WordTimestamp is the per-word Whisper output consumed by DynamicBlock for
// audio_anchor → frame alignment. It is NOT rendered visually — burned-in
// captions are disabled; long-form YouTube uses the separate .srt sidecar.

export interface WordTimestamp {
  word: string;
  // Support both manifest formats: start_seconds/end_seconds (from the Edge/
  // ElevenLabs pipeline) or start/end (legacy).
  start_seconds?: number;
  end_seconds?: number;
  start?: number;
  end?: number;
}
