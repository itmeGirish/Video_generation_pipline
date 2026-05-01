import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { D } from './design';

// Backdrop with scene fade-in and fade-out driven by useCurrentFrame().
// fade_frames from config controls duration (default 6 frames = 0.2s at 30fps).
export const Backdrop: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const f = D.fade_frames;
  const fadeIn  = interpolate(frame, [0, f], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const fadeOut = interpolate(frame, [durationInFrames - f, durationInFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const opacity = Math.min(fadeIn, fadeOut);

  return (
    <div style={{ position: 'absolute', inset: 0, opacity, zIndex: -1 }}>
      <div style={{ position: 'absolute', inset: 0, backgroundColor: D.bg }} />
      <div style={{
        position: 'absolute', inset: 0, opacity: D.dot_grid_opacity,
        backgroundImage: `radial-gradient(circle at 1px 1px, ${D.text_dim} 1px, transparent 0)`,
        backgroundSize: `${D.dot_grid_spacing}px ${D.dot_grid_spacing}px`,
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse at center, transparent 30%, ${D.bg} 95%)`,
      }} />
    </div>
  );
};
