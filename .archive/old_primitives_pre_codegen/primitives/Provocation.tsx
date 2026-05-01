import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { fitText } from '@remotion/layout-utils';
import { D, resolveColor } from '../design';

type Props = { text: string; subtitle?: string; color?: string };

export const Provocation: React.FC<Props> = ({ text, subtitle, color }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const c = resolveColor(color);

  const { fontSize: fittedSize } = fitText({
    text, fontFamily: D.font_display, fontWeight: '800',
    withinWidth: width - 320,
  });
  const heroFontSize = Math.min(96, fittedSize);

  // Typewriter
  const charsShown = Math.min(text.length, Math.floor((frame * D.type_speed_cps) / fps));
  const blink = Math.floor(frame / 15) % 2 === 0;
  const showCursor = charsShown < text.length;

  const typewriterEnd = text.length * (fps / D.type_speed_cps);
  const subOpacity = interpolate(
    frame,
    [typewriterEnd + 10, typewriterEnd + 28],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const cardP = spring({ frame: frame - 2, fps, config: { damping: 14, stiffness: 160 } });
  const glow = 28 + Math.sin(frame / 22) * 14;

  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 32,
      padding: '0 160px', textAlign: 'center',
    }}>
      {/* Ambient backdrop */}
      <div style={{
        position: 'absolute', inset: 100,
        borderRadius: 40,
        background: `radial-gradient(ellipse at center, ${c}26 0%, transparent 65%)`,
        opacity: cardP,
      }} />
      {/* Quote-style decorative marks */}
      <div style={{
        position: 'absolute', top: 140, left: 220,
        fontFamily: D.font_display, fontSize: 160, fontWeight: 900,
        color: `${c}55`, opacity: cardP,
        lineHeight: 1,
      }}>"</div>
      <div style={{
        position: 'absolute', bottom: 160, right: 220,
        fontFamily: D.font_display, fontSize: 160, fontWeight: 900,
        color: `${c}55`, opacity: cardP,
        lineHeight: 1, transform: 'rotate(180deg)',
      }}>"</div>

      <div style={{
        position: 'relative',
        fontFamily: D.font_display, fontSize: heroFontSize, fontWeight: 800, color: c,
        lineHeight: 1.15,
        textShadow: `0 0 ${glow}px ${c}88, 0 0 ${glow * 2}px ${c}33`,
        letterSpacing: -1,
      }}>
        {text.substring(0, charsShown)}
        {showCursor && blink && <span style={{ color: D.cyan }}>▊</span>}
      </div>
      {subtitle && (
        <div style={{
          position: 'relative',
          fontFamily: D.font_mono, fontSize: 28, color: D.text_dim,
          opacity: subOpacity, letterSpacing: 3,
        }}>
          {subtitle}
        </div>
      )}
    </div>
  );
};
