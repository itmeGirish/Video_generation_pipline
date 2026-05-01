/**
 * VideoOverlay - Persistent overlays for full-length videos
 *
 * Includes:
 * - Progress bar at bottom showing video position
 * - Section label showing current topic
 * - Subtle vignette for cinematic depth
 */

import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

// ============================================
// PROGRESS BAR
// ============================================

interface ProgressBarProps {
  /** Current scene index (0-based) */
  currentScene: number;
  /** Total number of scenes */
  totalScenes: number;
  /** Overall progress 0-1 */
  progress: number;
  /** Accent color */
  accentColor?: string;
}

export const VideoProgressBar: React.FC<ProgressBarProps> = ({
  currentScene,
  totalScenes,
  progress,
  accentColor = "#00d9ff",
}) => {
  const { width, height } = useVideoConfig();
  const frame = useCurrentFrame();
  const scale = Math.min(width / 1920, height / 1080);

  // Gentle pulse on the progress dot
  const pulse = 0.8 + 0.2 * Math.sin(frame * 0.08);

  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 4 * scale,
        zIndex: 1000,
        pointerEvents: "none",
      }}
    >
      {/* Track */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 3 * scale,
          backgroundColor: "rgba(255, 255, 255, 0.08)",
        }}
      />

      {/* Filled progress */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: `${progress * 100}%`,
          height: 3 * scale,
          backgroundColor: accentColor,
          boxShadow: `0 0 ${8 * scale}px ${accentColor}80`,
          transition: "width 0.1s linear",
        }}
      />

      {/* Scene markers */}
      {Array.from({ length: totalScenes }).map((_, i) => {
        const markerPos = (i + 1) / totalScenes;
        const isActive = i <= currentScene;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              bottom: 0,
              left: `${markerPos * 100}%`,
              width: 2 * scale,
              height: 6 * scale,
              backgroundColor: isActive ? accentColor : "rgba(255, 255, 255, 0.2)",
              transform: "translateX(-50%)",
            }}
          />
        );
      })}
    </div>
  );
};

// ============================================
// SECTION LABEL
// ============================================

interface SectionLabelProps {
  /** Current section name (e.g., "THE PROBLEM", "THE REVEAL") */
  label: string;
  /** Scene number */
  sceneNumber: number;
  /** Total scenes */
  totalScenes: number;
  /** Accent color */
  accentColor?: string;
  /** Frame when this label appeared */
  entryFrame?: number;
}

export const SectionLabel: React.FC<SectionLabelProps> = ({
  label,
  sceneNumber,
  totalScenes,
  accentColor = "#00d9ff",
  entryFrame = 0,
}) => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const scale = Math.min(width / 1920, height / 1080);
  const localFrame = frame - entryFrame;

  // Slide in from left, stay, then fade slightly
  const slideIn = interpolate(localFrame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = interpolate(localFrame, [0, 10, 60, 90], [0, 0.9, 0.9, 0.5], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const translateX = interpolate(slideIn, [0, 1], [-100, 0]);

  if (localFrame < 0) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: 24 * scale,
        left: 24 * scale,
        display: "flex",
        alignItems: "center",
        gap: 8 * scale,
        opacity,
        transform: `translateX(${translateX * scale}px)`,
        zIndex: 999,
        pointerEvents: "none",
      }}
    >
      {/* Accent line */}
      <div
        style={{
          width: 3 * scale,
          height: 20 * scale,
          backgroundColor: accentColor,
          borderRadius: 2 * scale,
          boxShadow: `0 0 ${6 * scale}px ${accentColor}60`,
        }}
      />

      {/* Label text */}
      <div
        style={{
          fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
          fontSize: 11 * scale,
          fontWeight: 500,
          color: "rgba(255, 255, 255, 0.7)",
          letterSpacing: 2 * scale,
          textTransform: "uppercase",
        }}
      >
        {`// ${label}`}
      </div>

      {/* Scene counter */}
      <div
        style={{
          fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
          fontSize: 9 * scale,
          color: "rgba(255, 255, 255, 0.35)",
          marginLeft: 8 * scale,
        }}
      >
        {`${sceneNumber}/${totalScenes}`}
      </div>
    </div>
  );
};

// ============================================
// CINEMATIC VIGNETTE
// ============================================

interface VignetteProps {
  intensity?: number;
}

export const CinematicVignette: React.FC<VignetteProps> = ({
  intensity = 0.4,
}) => {
  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        zIndex: 998,
        background: `radial-gradient(ellipse at center, transparent 50%, rgba(0, 0, 0, ${intensity}) 100%)`,
      }}
    />
  );
};

// ============================================
// COMBINED OVERLAY
// ============================================

interface VideoOverlayProps {
  currentScene: number;
  totalScenes: number;
  progress: number;
  sectionLabel: string;
  accentColor?: string;
  showProgressBar?: boolean;
  showSectionLabel?: boolean;
  showVignette?: boolean;
}

export const VideoOverlay: React.FC<VideoOverlayProps> = ({
  currentScene,
  totalScenes,
  progress,
  sectionLabel,
  accentColor = "#00d9ff",
  showProgressBar = true,
  showSectionLabel = true,
  showVignette = true,
}) => {
  return (
    <>
      {showVignette && <CinematicVignette intensity={0.35} />}
      {showSectionLabel && (
        <SectionLabel
          label={sectionLabel}
          sceneNumber={currentScene + 1}
          totalScenes={totalScenes}
          accentColor={accentColor}
        />
      )}
      {showProgressBar && (
        <VideoProgressBar
          currentScene={currentScene}
          totalScenes={totalScenes}
          progress={progress}
          accentColor={accentColor}
        />
      )}
    </>
  );
};

export default VideoOverlay;
