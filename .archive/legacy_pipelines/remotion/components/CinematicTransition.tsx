/**
 * CinematicTransition - Custom transition presentation for Remotion
 *
 * Features:
 * - Focus pull (blur out/in)
 * - Light leak overlay
 * - Chromatic aberration
 * - Color pulse
 * - Smooth crossfade
 */

import React from "react";
import { AbsoluteFill, interpolate, Easing } from "remotion";
import type { TransitionPresentation, TransitionPresentationComponentProps } from "@remotion/transitions";

// ============================================
// CINEMATIC TRANSITION PRESENTATION
// ============================================

type CinematicTransitionProps = {
  direction?: "in" | "out";
  accentColor?: string;
  enableBlur?: boolean;
  enableLightLeak?: boolean;
  enableChromatic?: boolean;
  enableColorPulse?: boolean;
};

const CinematicTransitionComponent: React.FC<
  TransitionPresentationComponentProps<CinematicTransitionProps>
> = ({
  children,
  presentationDirection,
  presentationProgress,
  passedProps,
}) => {
  const {
    accentColor = "#00d9ff",
    enableBlur = true,
    enableLightLeak = true,
    enableChromatic = true,
    enableColorPulse = true,
  } = passedProps;

  const isExiting = presentationDirection === "exiting";
  const progress = presentationProgress;

  // Eased progress for smoother feel
  const easedProgress = Easing.inOut(Easing.cubic)(progress);

  // OPACITY: Crossfade
  const opacity = isExiting
    ? interpolate(easedProgress, [0, 1], [1, 0])
    : interpolate(easedProgress, [0, 1], [0, 1]);

  // BLUR: Focus pull effect - blur peaks at middle of transition
  const blurAmount = enableBlur
    ? Math.sin(progress * Math.PI) * 8
    : 0;

  // SCALE: Slight zoom during blur to hide edges
  const scale = 1 + (blurAmount * 0.005);

  // LIGHT LEAK: Subtle white wash peaks at middle
  const lightLeakOpacity = enableLightLeak
    ? Math.sin(progress * Math.PI) * 0.25
    : 0;

  // Y-OFFSET: Subtle vertical movement
  const yOffset = isExiting
    ? interpolate(easedProgress, [0, 1], [0, -15])
    : interpolate(easedProgress, [0, 1], [15, 0]);

  return (
    <AbsoluteFill>
      {/* Main content with blur and fade */}
      <AbsoluteFill
        style={{
          opacity,
          filter: blurAmount > 0.1 ? `blur(${blurAmount}px)` : "none",
          transform: `scale(${scale}) translateY(${yOffset}px)`,
          transformOrigin: "center center",
        }}
      >
        {children}
      </AbsoluteFill>

      {/* Light leak overlay - subtle white glow */}
      {lightLeakOpacity > 0.01 && (
        <AbsoluteFill
          style={{
            pointerEvents: "none",
            background: isExiting
              ? `linear-gradient(to left, transparent 30%, rgba(255,255,255,${lightLeakOpacity * 0.5}) 50%, transparent 70%)`
              : `linear-gradient(to right, transparent 30%, rgba(255,255,255,${lightLeakOpacity * 0.5}) 50%, transparent 70%)`,
            mixBlendMode: "soft-light",
          }}
        />
      )}
    </AbsoluteFill>
  );
};

/**
 * Create a cinematic transition presentation
 */
export const cinematicFade = (
  props: CinematicTransitionProps = {}
): TransitionPresentation<CinematicTransitionProps> => {
  return {
    component: CinematicTransitionComponent,
    props,
  };
};

// ============================================
// CINEMATIC SLIDE TRANSITION
// ============================================

type CinematicSlideProps = CinematicTransitionProps & {
  slideDirection?: "left" | "right" | "up" | "down";
};

const CinematicSlideComponent: React.FC<
  TransitionPresentationComponentProps<CinematicSlideProps>
> = ({
  children,
  presentationDirection,
  presentationProgress,
  passedProps,
}) => {
  const {
    slideDirection = "left",
    accentColor = "#00d9ff",
    enableBlur = true,
    enableLightLeak = true,
    enableColorPulse = true,
  } = passedProps;

  const isExiting = presentationDirection === "exiting";
  const progress = presentationProgress;

  // Eased progress
  const easedProgress = Easing.out(Easing.cubic)(progress);

  // Calculate slide offset based on direction
  const slideAmount = 100; // percentage
  let translateX = 0;
  let translateY = 0;

  if (isExiting) {
    switch (slideDirection) {
      case "left":
        translateX = interpolate(easedProgress, [0, 1], [0, -slideAmount]);
        break;
      case "right":
        translateX = interpolate(easedProgress, [0, 1], [0, slideAmount]);
        break;
      case "up":
        translateY = interpolate(easedProgress, [0, 1], [0, -slideAmount]);
        break;
      case "down":
        translateY = interpolate(easedProgress, [0, 1], [0, slideAmount]);
        break;
    }
  } else {
    switch (slideDirection) {
      case "left":
        translateX = interpolate(easedProgress, [0, 1], [slideAmount, 0]);
        break;
      case "right":
        translateX = interpolate(easedProgress, [0, 1], [-slideAmount, 0]);
        break;
      case "up":
        translateY = interpolate(easedProgress, [0, 1], [slideAmount, 0]);
        break;
      case "down":
        translateY = interpolate(easedProgress, [0, 1], [-slideAmount, 0]);
        break;
    }
  }

  // Blur during slide
  const blurAmount = enableBlur
    ? Math.sin(progress * Math.PI) * 4
    : 0;

  // Scale slightly during transition
  const scale = interpolate(
    Math.sin(progress * Math.PI),
    [0, 1],
    [1, 0.98]
  );

  // Light leak
  const lightLeakOpacity = enableLightLeak
    ? Math.sin(progress * Math.PI) * 0.2
    : 0;

  // Color pulse
  const colorPulseOpacity = enableColorPulse
    ? Math.sin(progress * Math.PI) * 0.08
    : 0;

  return (
    <AbsoluteFill>
      {/* Main content with slide, blur, and scale */}
      <AbsoluteFill
        style={{
          filter: blurAmount > 0.1 ? `blur(${blurAmount}px)` : "none",
          transform: `translate(${translateX}%, ${translateY}%) scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        {children}
      </AbsoluteFill>

      {/* Light leak - subtle white glow */}
      {lightLeakOpacity > 0.01 && (
        <AbsoluteFill
          style={{
            pointerEvents: "none",
            background: `radial-gradient(ellipse at ${isExiting ? '30%' : '70%'} 50%, rgba(255,255,255,${lightLeakOpacity * 0.5}) 0%, transparent 60%)`,
            mixBlendMode: "soft-light",
          }}
        />
      )}
    </AbsoluteFill>
  );
};

/**
 * Create a cinematic slide transition
 */
export const cinematicSlide = (
  props: CinematicSlideProps = {}
): TransitionPresentation<CinematicSlideProps> => {
  return {
    component: CinematicSlideComponent,
    props,
  };
};

// ============================================
// CINEMATIC ZOOM TRANSITION
// ============================================

type CinematicZoomProps = CinematicTransitionProps & {
  zoomDirection?: "in" | "out";
};

const CinematicZoomComponent: React.FC<
  TransitionPresentationComponentProps<CinematicZoomProps>
> = ({
  children,
  presentationDirection,
  presentationProgress,
  passedProps,
}) => {
  const {
    zoomDirection = "in",
    accentColor = "#00d9ff",
    enableBlur = true,
    enableLightLeak = true,
  } = passedProps;

  const isExiting = presentationDirection === "exiting";
  const progress = presentationProgress;
  const easedProgress = Easing.inOut(Easing.cubic)(progress);

  // Zoom: exiting zooms out, entering zooms in (or reverse)
  let scale: number;
  let opacity: number;

  if (zoomDirection === "in") {
    if (isExiting) {
      scale = interpolate(easedProgress, [0, 1], [1, 1.4]);
      opacity = interpolate(easedProgress, [0, 0.7, 1], [1, 0.5, 0]);
    } else {
      scale = interpolate(easedProgress, [0, 1], [0.6, 1]);
      opacity = interpolate(easedProgress, [0, 0.3, 1], [0, 0.5, 1]);
    }
  } else {
    if (isExiting) {
      scale = interpolate(easedProgress, [0, 1], [1, 0.6]);
      opacity = interpolate(easedProgress, [0, 0.7, 1], [1, 0.5, 0]);
    } else {
      scale = interpolate(easedProgress, [0, 1], [1.4, 1]);
      opacity = interpolate(easedProgress, [0, 0.3, 1], [0, 0.5, 1]);
    }
  }

  const blurAmount = enableBlur ? Math.sin(progress * Math.PI) * 6 : 0;

  const lightLeakOpacity = enableLightLeak
    ? Math.sin(progress * Math.PI) * 0.3
    : 0;

  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          opacity,
          filter: blurAmount > 0.1 ? `blur(${blurAmount}px)` : "none",
          transform: `scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        {children}
      </AbsoluteFill>

      {lightLeakOpacity > 0.01 && (
        <AbsoluteFill
          style={{
            pointerEvents: "none",
            background: `radial-gradient(circle at 50% 50%, rgba(255,255,255,${lightLeakOpacity * 0.6}) 0%, transparent 50%)`,
            mixBlendMode: "screen",
          }}
        />
      )}
    </AbsoluteFill>
  );
};

export const cinematicZoom = (
  props: CinematicZoomProps = {}
): TransitionPresentation<CinematicZoomProps> => {
  return {
    component: CinematicZoomComponent,
    props,
  };
};

// ============================================
// GRADIENT WIPE TRANSITION
// ============================================

type GradientWipeProps = {
  angle?: number;
  accentColor?: string;
  softness?: number;
};

const GradientWipeComponent: React.FC<
  TransitionPresentationComponentProps<GradientWipeProps>
> = ({
  children,
  presentationDirection,
  presentationProgress,
  passedProps,
}) => {
  const {
    angle = 45,
    accentColor = "#00d9ff",
    softness = 15,
  } = passedProps;

  const isExiting = presentationDirection === "exiting";
  const progress = presentationProgress;
  const easedProgress = Easing.inOut(Easing.cubic)(progress);

  // Wipe position moves from -softness to 100+softness
  const wipePos = isExiting
    ? interpolate(easedProgress, [0, 1], [100 + softness, -softness])
    : interpolate(easedProgress, [0, 1], [-softness, 100 + softness]);

  // Create a gradient mask that reveals/hides the scene
  const maskGradient = `linear-gradient(${angle}deg, black ${wipePos - softness}%, transparent ${wipePos}%, transparent ${wipePos + softness}%, black 100%)`;

  // Edge glow at the wipe boundary
  const glowGradient = `linear-gradient(${angle}deg, transparent ${wipePos - softness * 2}%, ${accentColor}40 ${wipePos - softness}%, ${accentColor}80 ${wipePos}%, ${accentColor}40 ${wipePos + softness}%, transparent ${wipePos + softness * 2}%)`;

  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          WebkitMaskImage: isExiting ? maskGradient : undefined,
          maskImage: isExiting ? maskGradient : undefined,
        }}
      >
        {children}
      </AbsoluteFill>

      {/* Glow line at wipe edge */}
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          background: glowGradient,
          opacity: Math.sin(progress * Math.PI) * 0.6,
          mixBlendMode: "screen",
        }}
      />
    </AbsoluteFill>
  );
};

export const gradientWipe = (
  props: GradientWipeProps = {}
): TransitionPresentation<GradientWipeProps> => {
  return {
    component: GradientWipeComponent,
    props,
  };
};

// ============================================
// GLITCH TRANSITION (tech style)
// ============================================

type GlitchTransitionProps = {
  accentColor?: string;
  intensity?: number;
};

const GlitchTransitionComponent: React.FC<
  TransitionPresentationComponentProps<GlitchTransitionProps>
> = ({
  children,
  presentationDirection,
  presentationProgress,
  passedProps,
}) => {
  const {
    accentColor = "#00d9ff",
    intensity = 1,
  } = passedProps;

  const isExiting = presentationDirection === "exiting";
  const progress = presentationProgress;

  // Glitch is most intense in the middle of transition
  const glitchIntensity = Math.sin(progress * Math.PI) * intensity;
  const isGlitching = glitchIntensity > 0.3;

  // Opacity
  const opacity = isExiting
    ? interpolate(progress, [0, 0.4, 0.6, 1], [1, 1, 0.5, 0])
    : interpolate(progress, [0, 0.4, 0.6, 1], [0, 0.5, 1, 1]);

  // RGB shift during glitch
  const rgbShift = isGlitching ? glitchIntensity * 8 : 0;

  // Scanline offset during glitch
  const scanlineOffset = isGlitching
    ? Math.sin(progress * 47) * glitchIntensity * 20
    : 0;

  return (
    <AbsoluteFill>
      {/* Red channel shifted */}
      {rgbShift > 1 && (
        <AbsoluteFill
          style={{
            opacity: opacity * 0.3,
            transform: `translateX(${rgbShift}px)`,
            filter: "url(#redOnly)",
            mixBlendMode: "screen",
          }}
        >
          {children}
        </AbsoluteFill>
      )}

      {/* Main content */}
      <AbsoluteFill
        style={{
          opacity,
          transform: `translateY(${scanlineOffset}px)`,
        }}
      >
        {children}
      </AbsoluteFill>

      {/* Cyan channel shifted */}
      {rgbShift > 1 && (
        <AbsoluteFill
          style={{
            opacity: opacity * 0.3,
            transform: `translateX(${-rgbShift}px)`,
            mixBlendMode: "screen",
          }}
        >
          {children}
        </AbsoluteFill>
      )}

      {/* Scanline overlay */}
      {isGlitching && (
        <AbsoluteFill
          style={{
            pointerEvents: "none",
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)`,
            opacity: glitchIntensity * 0.5,
          }}
        />
      )}

      {/* Flash */}
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          backgroundColor: accentColor,
          opacity: glitchIntensity > 0.8 ? (glitchIntensity - 0.8) * 0.3 : 0,
          mixBlendMode: "overlay",
        }}
      />
    </AbsoluteFill>
  );
};

export const glitchTransition = (
  props: GlitchTransitionProps = {}
): TransitionPresentation<GlitchTransitionProps> => {
  return {
    component: GlitchTransitionComponent,
    props,
  };
};

export default cinematicFade;
