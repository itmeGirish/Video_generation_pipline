import React from 'react';
import { spring, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { D, resolveColor } from '../design';

type Props = { title?: string; items: string[]; color?: string };

export const BulletList: React.FC<Props> = ({ title, items, color }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = resolveColor(color || 'cyan');
  const headerOpacity = interpolate(frame, [0, 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24,
      padding: '0 140px',
    }}>
      {title && (
        <div style={{
          fontFamily: D.font_mono, fontSize: 16, color: c, letterSpacing: 4,
          opacity: headerOpacity, marginBottom: 16,
        }}>
          {title}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 1100 }}>
        {items.map((item, i) => {
          const start = 10 + i * 8;
          const p = spring({
            frame: frame - start, fps,
            config: { damping: D.spring_damping, stiffness: D.spring_stiffness },
          });
          const x = interpolate(p, [0, 1], [-40, 0]);
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 18, padding: '16px 24px',
              backgroundColor: D.surface, border: `1.5px solid ${c}55`, borderRadius: 8,
              opacity: p, transform: `translateX(${x}px)`,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: c, flexShrink: 0 }} />
              <div style={{ fontFamily: D.font_display, fontSize: 24, color: D.text, fontWeight: 600 }}>
                {item}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
