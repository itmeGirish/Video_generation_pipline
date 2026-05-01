import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';
import { usePhase } from './Scene';

/**
 * Ambient primitives: always-alive visual elements that eliminate "dead time"
 * in phases where the main animation has finished but the phase still plays.
 *
 * Compose these inside any <Phase> to guarantee the screen never looks static.
 */

/** Breathing scale oscillation (defaults: ±3%, 6s period). */
export const AmbientBreath: React.FC<{
  children: React.ReactNode;
  amount?: number;
  periodSec?: number;
  style?: React.CSSProperties;
}> = ({ children, amount = 0.03, periodSec = 6, style }) => {
  const frame = useCurrentFrame();
  const scale = 1 + Math.sin((frame / (30 * periodSec)) * Math.PI * 2) * amount;
  return (
    <div style={{ transform: `scale(${scale})`, ...style }}>
      {children}
    </div>
  );
};

/** Slow position drift (subtle parallax feel). */
export const AmbientDrift: React.FC<{
  children: React.ReactNode;
  amountX?: number;
  amountY?: number;
  periodSec?: number;
  style?: React.CSSProperties;
}> = ({ children, amountX = 8, amountY = 4, periodSec = 10, style }) => {
  const frame = useCurrentFrame();
  const t = (frame / (30 * periodSec)) * Math.PI * 2;
  const dx = Math.sin(t) * amountX;
  const dy = Math.cos(t * 0.7) * amountY;
  return (
    <div style={{ transform: `translate(${dx}px, ${dy}px)`, ...style }}>
      {children}
    </div>
  );
};

/** Phase-progress-aware pulse: brightens/dims as the phase plays. */
export const AmbientPulse: React.FC<{
  children: React.ReactNode;
  minOpacity?: number;
  maxOpacity?: number;
  periodSec?: number;
  style?: React.CSSProperties;
}> = ({ children, minOpacity = 0.75, maxOpacity = 1, periodSec = 4, style }) => {
  const frame = useCurrentFrame();
  const osc = (Math.sin((frame / (30 * periodSec)) * Math.PI * 2) + 1) / 2; // 0..1
  const opacity = minOpacity + osc * (maxOpacity - minOpacity);
  return <div style={{ opacity, ...style }}>{children}</div>;
};

/** Drifting dot-field background. Lightweight — ~20 dots. */
export const AmbientParticles: React.FC<{
  count?: number;
  color?: string;
  size?: number;
  opacity?: number;
}> = ({ count = 18, color = '#ffffff', size = 3, opacity = 0.15 }) => {
  const frame = useCurrentFrame();
  // Deterministic seeded positions (no Math.random per render)
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {Array.from({ length: count }).map((_, i) => {
        const seed = (i * 47) % 100;
        const x = ((seed * 13) % 1920) + Math.sin((frame + i * 20) / 120) * 30;
        const y = ((seed * 29) % 1080) + Math.cos((frame + i * 17) / 100) * 20;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: size,
              height: size,
              borderRadius: '50%',
              backgroundColor: color,
              opacity,
            }}
          />
        );
      })}
    </div>
  );
};

/**
 * Utility: clamp animation to first `fraction` of the phase, then hold.
 * Returns `progress` ∈ [0, 1] where 0 = start of animation, 1 = end of animation.
 *
 * Example: `const p = useIntroProgress(0.3)` — animation finishes at 30% of phase,
 * rest of the phase is ambient hold. Paired with an <AmbientBreath> or similar,
 * this gives lively "completed state" rather than static dead time.
 */
export function useIntroProgress(introFraction = 0.3) {
  const { progress } = usePhase();
  return Math.min(1, progress / introFraction);
}

/** Outro progress: begins at (1 - fraction) of the phase, ends at phase end. */
export function useOutroProgress(outroFraction = 0.2) {
  const { progress } = usePhase();
  const start = 1 - outroFraction;
  if (progress < start) return 0;
  return Math.min(1, (progress - start) / outroFraction);
}
