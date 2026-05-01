import React from 'react';
import { spring, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { D } from '../design';

type Props = { items: string[]; tagline?: string };

export const CallbackCard: React.FC<Props> = ({ items, tagline }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cardP = spring({ frame, fps, config: { damping: 12, stiffness: 200 } });

  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18,
    }}>
      {tagline && (
        <div style={{
          fontFamily: D.font_mono, fontSize: 18, color: D.text_dim, letterSpacing: 3,
          opacity: interpolate(frame, [0, 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
        }}>
          {tagline}
        </div>
      )}
      <div style={{
        padding: '24px 36px', backgroundColor: D.surface, border: `1.5px solid ${D.cyan}55`,
        borderRadius: 12, boxShadow: `0 0 24px ${D.cyan}33`,
        transform: `scale(${cardP})`, opacity: cardP,
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        {items.map((it, i) => {
          const start = 8 + i * 6;
          const p = spring({ frame: frame - start, fps, config: { damping: 14, stiffness: 200 } });
          return (
            <div key={i} style={{
              fontFamily: D.font_display, fontSize: 22, color: D.text, fontWeight: 600,
              opacity: p,
            }}>
              <span style={{ color: D.cyan, marginRight: 10 }}>•</span>
              {it}
            </div>
          );
        })}
      </div>
    </div>
  );
};
