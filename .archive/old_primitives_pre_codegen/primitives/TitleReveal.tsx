import React from 'react';
import { spring, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { fitText } from '@remotion/layout-utils';
import { D, resolveColor } from '../design';

type Props = {
  text: string;
  subtitle?: string;
  color?: string;
  big?: boolean;
};

export const TitleReveal: React.FC<Props> = ({ text, subtitle, color, big }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const c = resolveColor(color);
  const p = spring({ frame, fps, config: { damping: D.spring_damping, stiffness: D.spring_stiffness } });
  const subOpacity = interpolate(frame, [10, 28], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Auto-fit hero word — shrink if it would overflow horizontally.
  // Cap at the design's intended size so short words don't blow up huge.
  const maxFontSize = big ? 140 : 100;
  const available = width - 200;
  const { fontSize: fittedSize } = fitText({
    text, fontFamily: D.font_display, fontWeight: '900',
    withinWidth: available,
  });
  const fontSize = Math.min(maxFontSize, fittedSize);

  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20,
      padding: '0 100px', textAlign: 'center',
    }}>
      <div style={{
        fontFamily: D.font_display,
        fontSize,
        fontWeight: 900, color: c, letterSpacing: -2,
        transform: `scale(${p})`, opacity: p,
        textShadow: `0 0 40px ${c}66`,
        lineHeight: 1.05,
      }}>
        {text}
      </div>
      {subtitle && (
        <div style={{
          fontFamily: D.font_mono, fontSize: 22, color: D.text_dim,
          opacity: subOpacity, letterSpacing: 1, marginTop: 10,
        }}>
          {subtitle}
        </div>
      )}
    </div>
  );
};
