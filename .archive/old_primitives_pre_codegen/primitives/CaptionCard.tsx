import React from 'react';
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { D, resolveColor } from '../design';

type Props = { text: string; subtitle?: string; color?: string };

export const CaptionCard: React.FC<Props> = ({ text, subtitle, color }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = resolveColor(color);
  const p = spring({ frame, fps, config: { damping: 10, stiffness: 200 } });
  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24,
    }}>
      <div style={{
        padding: '24px 48px', backgroundColor: D.surface, border: `2px solid ${c}`,
        borderRadius: 12, boxShadow: `0 0 30px ${c}55`,
        transform: `scale(${p})`, opacity: p,
        fontFamily: D.font_mono, fontSize: 28, color: c, letterSpacing: 3, fontWeight: 700,
      }}>
        {text}
      </div>
      {subtitle && (
        <div style={{
          fontFamily: D.font_display, fontSize: 36, color: D.text,
          opacity: p, marginTop: 12,
        }}>
          {subtitle}
        </div>
      )}
    </div>
  );
};
