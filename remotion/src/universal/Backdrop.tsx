import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, random } from 'remotion';
import { noise2D } from '@remotion/noise';
import { D } from './design';

// Atmospheric backdrop — the single global lever that lifts every LIGHT scene from a
// flat beige fill to a LIT, TEXTURED, ALIVE frame (composition skill §8b/§8c). Layers,
// back-to-front:
//   1. base fill + a warm RADIAL LIGHT POOL (a key light — the frame has a light source)
//   2. faint dot grid (structure)
//   3. AMBIENT PARTICLE FIELD — ~40 soft motes, noise-driven slow drift + twinkle + parallax
//      depth (nothing is ever fully static; the frame breathes) — render-safe (frame-driven)
//   4. FILM GRAIN — a static SVG-turbulence overlay; kills the "digital flatness" tell
//   5. VIGNETTE — subtle edge darkening pulls the eye to the lit centre
// All frame-driven + deterministic (parallel-render safe). Dark scenes (S5) paint their own
// AbsoluteFill ON TOP, so this only affects the light scenes.
export const Backdrop: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();

  const f = D.fade_frames;
  let opacity: number;
  if (f <= 0) {
    opacity = 1;
  } else {
    const fadeIn = interpolate(frame, [0, f], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    const fadeOut = interpolate(frame, [durationInFrames - f, durationInFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    opacity = Math.min(fadeIn, fadeOut);
  }

  // ambient particle field — noise-driven drift + twinkle + parallax depth
  const N = 44;
  const particles = new Array(N).fill(0).map((_, i) => {
    const depth = 0.35 + random(`pd-${i}`) * 0.65;
    const bx = random(`px-${i}`) * width;
    const by = random(`py-${i}`) * height;
    const dx = noise2D(`dx-${i}`, frame * 0.0045 * depth, 0) * width * 0.035 * depth;
    const dy = noise2D(`dy-${i}`, frame * 0.0045 * depth, 9) * height * 0.035 * depth;
    const sz = (1.5 + random(`ps-${i}`) * 3) * depth;
    const tw = 0.35 + 0.65 * (0.5 + 0.5 * noise2D(`tw-${i}`, frame * 0.02, i * 3));
    return (
      <div
        key={i}
        style={{
          position: 'absolute',
          left: bx + dx,
          top: by + dy,
          width: sz,
          height: sz,
          borderRadius: '50%',
          backgroundColor: D.text,
          opacity: tw * depth * 0.16,
        }}
      />
    );
  });

  return (
    <div style={{ position: 'absolute', inset: 0, opacity, zIndex: -1 }}>
      {/* base fill */}
      <div style={{ position: 'absolute', inset: 0, backgroundColor: D.bg }} />
      {/* warm light pool (key light) — not a flat fill */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse 130% 100% at 50% 30%, ${D.surface} 0%, ${D.bg} 50%, rgba(0,0,0,0.06) 100%)`,
        }}
      />
      {/* faint dot grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: D.dot_grid_opacity * 0.65,
          backgroundImage: `radial-gradient(circle at 1px 1px, ${D.text_dim} 1px, transparent 0)`,
          backgroundSize: `${D.dot_grid_spacing}px ${D.dot_grid_spacing}px`,
        }}
      />
      {/* ambient particle field */}
      {particles}
      {/* film grain — static SVG turbulence, kills digital flatness */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.05,
          mixBlendMode: 'overlay',
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: '170px 170px',
        }}
      />
      {/* vignette — pulls the eye to the lit centre */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at center, transparent 46%, rgba(0,0,0,0.11) 100%)`,
        }}
      />
    </div>
  );
};
