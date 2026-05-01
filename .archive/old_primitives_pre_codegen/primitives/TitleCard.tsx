import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig, spring } from 'remotion';
import { fitText } from '@remotion/layout-utils';
import { D, resolveColor } from '../design';

type Props = { text: string; subtitle?: string; color?: string; big?: boolean };

export const TitleCard: React.FC<Props> = ({ text, subtitle, color, big }) => {
  const frame = useCurrentFrame();
  const { width, fps } = useVideoConfig();
  const c = resolveColor(color);
  const opacity = interpolate(frame, [0, 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const y = interpolate(frame, [0, 18], [12, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const subOpacity = interpolate(frame, [12, 28], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const cardP = spring({ frame: frame - 2, fps, config: { damping: 14, stiffness: 160 } });

  // Ambient breathing — subtle scale pulse so the title doesn't sit dead (1 cycle per second, fps-independent).
  const breathe = 1 + Math.sin(frame / fps) * 0.012;
  const glowPulse = 50 + Math.sin(frame / 24) * 18;

  // Bigger fonts than before — scenes deserve hero text, not body text.
  const maxFontSize = big ? 140 : 96;
  const { fontSize: fittedSize } = fitText({
    text, fontFamily: D.font_display, fontWeight: '900',
    withinWidth: width - 280,
  });
  const fontSize = Math.min(maxFontSize, fittedSize);

  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28,
      padding: '0 140px', textAlign: 'center',
    }}>
      {/* Ambient backdrop */}
      <div style={{
        position: 'absolute', inset: 80,
        borderRadius: 32,
        background: `radial-gradient(ellipse at center, ${c}22 0%, transparent 60%)`,
        opacity: cardP,
      }} />
      {/* Top + bottom hairlines so the eye knows the slide has structure */}
      <div style={{
        position: 'absolute', left: 200, right: 200, top: 200, height: 2,
        background: `linear-gradient(to right, transparent, ${c}88, transparent)`,
        opacity: cardP,
      }} />
      <div style={{
        position: 'absolute', left: 200, right: 200, bottom: 200, height: 2,
        background: `linear-gradient(to right, transparent, ${c}88, transparent)`,
        opacity: cardP,
      }} />

      <div style={{
        position: 'relative',
        fontFamily: D.font_display,
        fontSize, fontWeight: 900, color: c,
        opacity, transform: `translateY(${y}px) scale(${breathe})`, lineHeight: 1.1,
        textShadow: `0 0 ${glowPulse}px ${c}aa, 0 0 ${glowPulse * 2}px ${c}55`,
        letterSpacing: -1,
      }}>
        {text}
      </div>
      {subtitle && (
        <div style={{
          position: 'relative',
          fontFamily: D.font_mono, fontSize: 26, color: D.text_dim,
          opacity: subOpacity, letterSpacing: 3,
        }}>
          {subtitle}
        </div>
      )}
    </div>
  );
};
