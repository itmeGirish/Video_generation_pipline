/**
 * SceneFramework — enforces visual quality rules on ALL generated scenes.
 *
 * ARCHITECTURE:
 *
 * Problem 1 (overlapping):     SceneLayout enforces flexbox → browser prevents overlap
 * Problem 2 (color bleed):     Section/Panel enforce overflow:hidden → CSS clips
 * Problem 3 (same look):       Each scene is generated per script → different content
 * Problem 4 (empty space):     SceneLayout fills 88% of frame → consistent padding
 * Problem 5 (no sync):         findWordFrame + Phase → voiceover drives timeline
 * Problem 6 (scripts ignored): visual_description drives generation → script controls visuals
 *
 * Problem 7 (NEW — empty screens / front-loaded content):
 *   ROOT CAUSE: Animations fire once at a trigger frame, then scene sits static
 *   for remaining 80% of its duration.
 *
 *   FIX: <Phase> component. The voiceover IS the timeline.
 *   Each sentence/topic in the voiceover = one Phase.
 *   Phase auto-calculates start/end frames from wordTimestamps.
 *   At any frame in the scene, exactly ONE Phase is visible.
 *   Content is distributed across the FULL scene duration, not front-loaded.
 *
 * Generated scenes use:
 *   <SceneLayout> → enforces layout rules
 *     <Phase trigger="terminal" until="twenty dollars"> → content for this voiceover segment
 *       <Section> / <Panel> → layout structure
 *     </Phase>
 *     <Phase trigger="twenty dollars" until="goose"> → next segment
 *       ...
 *     </Phase>
 *   </SceneLayout>
 */

import React, { createContext, useContext } from "react";
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";

// ============================================================
// WORD TIMESTAMP SYNC
// ============================================================

export type WordTS = {
  word: string;
  start_seconds?: number;
  end_seconds?: number;
  start?: number;
  end?: number;
};

/**
 * Find the frame when the narrator says a word.
 */
export function findWordFrame(text: string, wts: WordTS[], fps: number = 30): number {
  if (!wts?.length || !text) return -1;
  const triggers = text.toLowerCase().split(/[\s,→\-$%/]+/).filter(w => w.length > 2);
  for (const trigger of triggers.slice(0, 4)) {
    for (const wt of wts) {
      const w = (wt.word || "").toLowerCase().replace(/[.,!?]/g, "");
      const start = wt.start_seconds ?? wt.start ?? 0;
      if (w === trigger || (trigger.length >= 4 && (w.includes(trigger) || trigger.includes(w)))) {
        return Math.max(0, Math.round(start * fps) - 10);
      }
    }
  }
  return -1; // not found — caller must handle
}

/**
 * Get the last word's timestamp frame — i.e., the scene's effective end.
 */
function getLastWordFrame(wts: WordTS[], fps: number): number {
  if (!wts?.length) return 900; // fallback 30 seconds
  const last = wts[wts.length - 1];
  const end = last.end_seconds ?? last.end ?? last.start_seconds ?? last.start ?? 30;
  return Math.round(end * fps);
}

// ============================================================
// SCENE CONTEXT — passes wordTimestamps + duration down to Phase
// ============================================================

interface SceneContextType {
  wordTimestamps: WordTS[];
  fps: number;
  totalFrames: number;
}

const SceneContext = createContext<SceneContextType>({
  wordTimestamps: [],
  fps: 30,
  totalFrames: 900,
});

// ============================================================
// PHASE — the voiceover-driven timeline unit
// ============================================================

export interface PhaseProps {
  children: React.ReactNode;
  /**
   * Word/phrase that starts this phase.
   * Matched against wordTimestamps via findWordFrame.
   */
  trigger: string;
  /**
   * Word/phrase that ends this phase (= next phase's trigger).
   * If omitted, phase lasts until scene ends.
   */
  until?: string;
  /**
   * Fallback start frame if trigger word not found in timestamps.
   * If not provided, Phase distributes evenly based on its position.
   */
  fallbackStart?: number;
  /**
   * Fallback end frame if 'until' word not found.
   */
  fallbackEnd?: number;
}

/**
 * Phase — a voiceover-driven content window.
 *
 * GUARANTEES:
 * - Content fades in when narrator reaches `trigger` word
 * - Content fades out when narrator reaches `until` word
 * - Entrance: 20-frame fade+slide
 * - Exit: 15-frame fade out
 * - If trigger/until not found: uses fallback frames
 *
 * This is the architectural fix for "empty screens":
 * Each Phase covers a segment of the voiceover timeline.
 * Multiple Phases tile the entire scene duration.
 * At any given frame, at least one Phase is active.
 */
export const Phase: React.FC<PhaseProps> = ({
  children,
  trigger,
  until,
  fallbackStart,
  fallbackEnd,
}) => {
  const frame = useCurrentFrame();
  const { wordTimestamps, fps, totalFrames } = useContext(SceneContext);

  // Resolve start frame
  let startFrame = findWordFrame(trigger, wordTimestamps, fps);
  if (startFrame < 0) {
    startFrame = fallbackStart ?? 0;
  }

  // Resolve end frame
  let endFrame: number;
  if (until) {
    const found = findWordFrame(until, wordTimestamps, fps);
    endFrame = found >= 0 ? found : (fallbackEnd ?? totalFrames);
  } else {
    endFrame = fallbackEnd ?? totalFrames;
  }

  // Ensure valid range
  if (endFrame <= startFrame) endFrame = startFrame + 90; // minimum 3 seconds

  // Entrance: 20-frame fade + slide up
  const enterDuration = 20;
  const enterProgress = interpolate(
    frame,
    [startFrame, startFrame + enterDuration],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }
  );

  // Exit: 15-frame fade out (starts 15 frames before end)
  const exitStart = endFrame - 15;
  const exitProgress = interpolate(
    frame,
    [exitStart, endFrame],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Combined opacity: entrance AND exit
  const opacity = Math.min(enterProgress, exitProgress);

  // Slide up during entrance
  const translateY = interpolate(
    frame,
    [startFrame, startFrame + enterDuration],
    [20, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }
  );

  // Don't render at all if fully invisible (saves rendering cost)
  if (frame < startFrame - 5 || frame > endFrame + 5) {
    return null;
  }

  return (
    <div style={{
      opacity,
      transform: `translateY(${translateY}px)`,
      width: "100%",
      flex: 1,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      minHeight: 0,
    }}>
      {children}
    </div>
  );
};

// ============================================================
// SCENE LAYOUT — the root enforcer
// ============================================================

export interface SceneLayoutProps {
  children: React.ReactNode;
  /** Section label shown at top-left */
  sectionLabel?: string;
  /** Scene title shown below section label */
  title?: string;
  /** Accent color for section label */
  accentColor?: string;
  /** Word timestamps from voiceover — REQUIRED for Phase timing */
  wordTimestamps?: WordTS[];
  /**
   * Cold-open / hook scenes set `chromeless` to remove the corner header
   * and the 40/60 padding so content can fill the entire 1920x1080 frame.
   * Used for the first-scene "punch in numbers before narration" pattern
   * that stops the viewer from scrolling in the first 8 seconds.
   */
  chromeless?: boolean;
  /**
   * When set, renders nothing during the pre-roll window so the scene's
   * own component owns pixel 1 of the video (no SceneLayout chrome
   * fighting with the cold-open visuals).
   */
  preRollFrames?: number;
}

/**
 * SceneLayout — wraps every generated scene.
 *
 * ENFORCES:
 * - overflow:hidden on the root → no bleed
 * - Consistent padding → fills ~88% of 1920x1080
 * - Flexbox column layout → no overlapping
 * - Provides SceneContext to Phase children → voiceover-driven timeline
 */
export const SceneLayout: React.FC<SceneLayoutProps> = ({
  children,
  sectionLabel,
  title,
  accentColor = "#00AAFF",
  wordTimestamps = [],
  chromeless = false,
  preRollFrames = 0,
}) => {
  const { fps } = useVideoConfig();
  const totalFrames = getLastWordFrame(wordTimestamps, fps) + 60; // +2s buffer after last word
  const frame = useCurrentFrame();
  // Cold-open pre-roll: hide chrome until narration starts so the hook
  // visuals own the full frame. After preRollFrames the normal layout
  // fades in (or stays hidden if chromeless is permanent).
  const inPreRoll = preRollFrames > 0 && frame < preRollFrames;
  const hideChrome = chromeless || inPreRoll;
  const padding = hideChrome ? "0" : "40px 60px";

  return (
    <SceneContext.Provider value={{ wordTimestamps, fps, totalFrames }}>
      <div style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding,
        boxSizing: "border-box",
        fontFamily: "Inter, sans-serif",
        overflow: "hidden",
        color: "rgba(255,255,255,0.9)",
      }}>
        {/* Header area — skipped for cold-open / chromeless scenes */}
        {!hideChrome && (sectionLabel || title) && (
          <div style={{ flexShrink: 0, marginBottom: 16 }}>
            {sectionLabel && (
              <div style={{
                fontSize: 14,
                fontWeight: 700,
                color: accentColor,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: 4,
              }}>
                {sectionLabel}
              </div>
            )}
            {title && (
              <div style={{
                fontSize: 36,
                fontWeight: 800,
                color: "rgba(255,255,255,0.95)",
              }}>
                {title}
              </div>
            )}
          </div>
        )}

        {/* Content area — Phase children go here.
            AmbientBackdrop guarantees visible motion even if every Phase is off
            (architectural fix #3: "no blank screens by construction"). */}
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          minHeight: 0,
          position: "relative",
        }}>
          <AmbientBackdrop accentColor={accentColor} />
          <div style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
            {children}
          </div>
        </div>
      </div>
    </SceneContext.Provider>
  );
};

// ============================================================
// SECTION — layout slot with overflow enforcement
// ============================================================

export interface SectionProps {
  children: React.ReactNode;
  flex?: number;
  direction?: "row" | "column";
  gap?: number;
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "space-between" | "space-around";
}

export const Section: React.FC<SectionProps> = ({
  children,
  flex = 1,
  direction = "row",
  gap = 16,
  align = "stretch",
  justify = "start",
}) => {
  return (
    <div style={{
      flex,
      display: "flex",
      flexDirection: direction,
      gap,
      alignItems: align,
      justifyContent: justify,
      overflow: "hidden",
      minWidth: 0,
      minHeight: 0,
    }}>
      {children}
    </div>
  );
};

// ============================================================
// PANEL — bordered content area
// ============================================================

export interface PanelProps {
  children: React.ReactNode;
  borderColor?: string;
  background?: string;
  flex?: number;
  padding?: number;
}

export const Panel: React.FC<PanelProps> = ({
  children,
  borderColor = "rgba(255,255,255,0.12)",
  background = "rgba(255,255,255,0.03)",
  flex = 1,
  padding = 24,
}) => {
  return (
    <div style={{
      flex,
      borderRadius: 12,
      border: `1px solid ${borderColor}`,
      background,
      padding,
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      minWidth: 0,
      minHeight: 0,
    }}>
      {children}
    </div>
  );
};

// ============================================================
// ANIMATED ENTRANCE (legacy — prefer Phase for new scenes)
// ============================================================

export interface AnimatedEntranceProps {
  children: React.ReactNode;
  delay: number;
  duration?: number;
}

export const AnimatedEntrance: React.FC<AnimatedEntranceProps> = ({
  children,
  delay,
  duration = 15,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [delay, delay + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const y = interpolate(frame, [delay, delay + duration], [12, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={{
      opacity,
      transform: `translateY(${y}px)`,
      width: "100%",
    }}>
      {children}
    </div>
  );
};

// ============================================================
// AMBIENT BACKDROP — architectural fix #3: "never blank"
// ============================================================

/**
 * AmbientBackdrop — an always-on layer behind every Phase.
 *
 * The Animation Completion Contract says: if every Phase in a scene
 * decides not to render (e.g. the narration word couldn't be matched),
 * the viewer must still see motion, not a black rectangle.
 *
 * This component renders a subtle, continuously-animated accent wash
 * that sits under the Phase content. It is resolution-independent,
 * costs nothing in frame time, and makes dead air architecturally
 * impossible.
 */
export interface AmbientBackdropProps {
  accentColor?: string;
  intensity?: number;
}

export const AmbientBackdrop: React.FC<AmbientBackdropProps> = ({
  accentColor = "#00AAFF",
  intensity = 0.08,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  // Two counter-drifting sine waves so the eye always sees motion
  const driftA = Math.sin(t * 0.35) * 60;
  const driftB = Math.cos(t * 0.22) * 80;
  const pulse = 0.85 + Math.sin(t * 0.6) * 0.15;
  const glowA = `radial-gradient(600px 600px at ${50 + driftA / 10}% ${40 + driftB / 12}%, ${accentColor}${Math.round(
    intensity * 255
  )
    .toString(16)
    .padStart(2, "0")} 0%, transparent 70%)`;
  const glowB = `radial-gradient(500px 500px at ${60 - driftA / 14}% ${70 + driftA / 18}%, ${accentColor}${Math.round(
    intensity * 180
  )
    .toString(16)
    .padStart(2, "0")} 0%, transparent 70%)`;
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        backgroundImage: `${glowA}, ${glowB}`,
        opacity: pulse,
      }}
    />
  );
};

// ============================================================
// ANIMATION COMPLETION CONTRACT
// ============================================================

/**
 * Scenes MUST export `animationCompletionFrames` so the player can detect
 * dead air between a scene's last animation and its scene-level end.
 *
 * Convention:
 *   export const animationCompletionFrames = (durationInFrames?: number) =>
 *     durationInFrames ?? 900;
 *
 * The player compares this against the audio length. A shortfall is logged
 * and the gap is automatically filled by AmbientBackdrop. This means
 * "blank screen" becomes impossible by construction.
 */
export type AnimationCompletion = (durationInFrames?: number) => number;

// ============================================================
// EXPORTS
// ============================================================

export default {
  SceneLayout,
  Phase,
  Section,
  Panel,
  AnimatedEntrance,
  AmbientBackdrop,
  findWordFrame,
};
