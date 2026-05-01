import React from 'react';
import { spring, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { D } from '../design';

type Props = { title?: string; items: string[] };

export const Checklist: React.FC<Props> = ({ title, items }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const headerOpacity = interpolate(frame, [0, 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28,
      padding: '0 140px',
    }}>
      {title && (
        <div style={{
          fontFamily: D.font_mono, fontSize: 16, color: D.amber, letterSpacing: 4,
          opacity: headerOpacity,
        }}>
          {title}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, width: 1200 }}>
        {items.map((item, i) => {
          const start = 12 + i * 14;
          const p = spring({ frame: frame - start, fps, config: { damping: 10, stiffness: 200 } });
          const checkP = spring({ frame: frame - start - 10, fps, config: { damping: 8, stiffness: 240 } });
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 22, padding: '20px 28px',
              backgroundColor: D.surface, border: `1.5px solid ${D.green}55`, borderRadius: 10,
              opacity: p,
            }}>
              <div style={{
                width: 36, height: 36, border: `2.5px solid ${D.green}`,
                borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: D.green, fontFamily: D.font_display, fontSize: 26, fontWeight: 900,
                transform: `scale(${checkP})`, opacity: checkP,
              }}>✓</div>
              <div style={{ fontFamily: D.font_display, fontSize: 22, color: D.text }}>{item}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
