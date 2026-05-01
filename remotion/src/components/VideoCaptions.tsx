/**
 * VideoCaptions - Burned-in word-by-word captions for full-length videos
 *
 * Shows 3-5 words at a time, highlighting the currently spoken word.
 * Positioned at bottom-center with semi-transparent background.
 * Uses word timestamps from TTS for precise sync.
 */

import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { D } from "../universal/design";

export interface WordTimestamp {
  word: string;
  // Support both manifest formats: start_seconds/end_seconds (from Edge/ElevenLabs pipeline)
  // or start/end (legacy)
  start_seconds?: number;
  end_seconds?: number;
  start?: number;
  end?: number;
}

// Helper to normalize timestamp field names
const getStart = (ws: WordTimestamp): number => ws.start_seconds ?? ws.start ?? 0;
const getEnd = (ws: WordTimestamp): number => ws.end_seconds ?? ws.end ?? 0;

interface VideoCaptionsProps {
  /** Word timestamps for the current scene */
  wordTimestamps: WordTimestamp[];
  /** Offset in seconds (scene start time in the full video) */
  offsetSeconds?: number;
  /** How many words to show at once */
  wordsPerGroup?: number;
  /** Accent color for active word */
  accentColor?: string;
  /** Whether to show captions */
  enabled?: boolean;
}

export const VideoCaptions: React.FC<VideoCaptionsProps> = ({
  wordTimestamps,
  offsetSeconds = 0,
  wordsPerGroup = 4,
  // Default to the project's cyan token (resolved from config.yaml). Caller
  // can pass any design-token hex to override per-scene.
  accentColor = D.cyan,
  enabled = true,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const scale = Math.min(width / 1920, height / 1080);

  if (!enabled || !wordTimestamps || wordTimestamps.length === 0) return null;

  // Convert frame to time in this Sequence's local time (offsetSeconds is the scene start in global timeline)
  const currentTimeSec = frame / fps;

  // Find current word index (word timestamps are relative to scene start, so compare against local time)
  let currentWordIndex = -1;
  for (let i = 0; i < wordTimestamps.length; i++) {
    const ws = wordTimestamps[i];
    const start = getStart(ws);
    const end = getEnd(ws);
    if (currentTimeSec >= start && currentTimeSec <= end + 0.15) {
      currentWordIndex = i;
      break;
    }
  }

  // If no current word, find the nearest upcoming one for smooth fade-in
  if (currentWordIndex < 0) {
    for (let i = 0; i < wordTimestamps.length; i++) {
      if (getStart(wordTimestamps[i]) > currentTimeSec) {
        currentWordIndex = i;
        break;
      }
    }
  }

  if (currentWordIndex < 0) return null;

  // Get the group of words to display (centered around current word)
  const halfGroup = Math.floor(wordsPerGroup / 2);
  const groupStart = Math.max(0, currentWordIndex - halfGroup);
  const groupEnd = Math.min(wordTimestamps.length, groupStart + wordsPerGroup);
  const visibleWords = wordTimestamps.slice(groupStart, groupEnd);

  if (visibleWords.length === 0) return null;

  // Simple opacity: fade in quickly once words exist
  const firstWordStart = getStart(visibleWords[0]);
  const groupOpacity = interpolate(
    currentTimeSec,
    [firstWordStart - 0.15, firstWordStart],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <div
      style={{
        position: "absolute",
        bottom: 60 * scale,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 950,
        pointerEvents: "none",
      }}
    >
      {/* Background panel */}
      <div
        style={{
          backgroundColor: `${D.bg}a6`,  // 65% opacity background panel using project bg token
          backdropFilter: "blur(8px)",
          borderRadius: 8 * scale,
          padding: `${8 * scale}px ${20 * scale}px`,
          opacity: groupOpacity,
          display: "flex",
          gap: 6 * scale,
          alignItems: "baseline",
        }}
      >
        {visibleWords.map((ws, i) => {
          const globalIndex = groupStart + i;
          const isActive = globalIndex === currentWordIndex;
          const isPast = globalIndex < currentWordIndex;

          return (
            <span
              key={`${globalIndex}-${ws.word}`}
              style={{
                fontFamily: D.font_display,
                fontSize: (isActive ? 26 : 24) * scale,
                fontWeight: isActive ? 700 : 500,
                color: isActive
                  ? D.white
                  : isPast
                  ? `${D.text}80`   // 50% opacity past words
                  : `${D.text}b3`,  // 70% opacity upcoming words
                textShadow: isActive
                  ? `0 0 ${12 * scale}px ${accentColor}80`
                  : "none",
                transform: isActive ? `scale(1.08)` : "scale(1)",
                display: "inline-block",
                // CSS transition removed — doesn't work in Remotion frame-by-frame rendering
              }}
            >
              {ws.word}
            </span>
          );
        })}
      </div>
    </div>
  );
};

export default VideoCaptions;
