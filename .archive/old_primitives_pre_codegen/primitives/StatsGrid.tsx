import React from 'react';
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { D, resolveColor } from '../design';

type Item = { value: string; label: string; color?: string };
type Props = { stats: Item[] };

export const StatsGrid: React.FC<Props> = ({ stats }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cols = stats.length > 3 ? Math.ceil(stats.length / 2) : stats.length;

  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 80,
    }}>
      <div style={{
        display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: 32, width: '100%', maxWidth: 1600,
      }}>
        {stats.map((it, i) => {
          const start = i * 8;
          const p = spring({ frame: frame - start, fps, config: { damping: 10, stiffness: 200 } });
          const c = resolveColor(it.color || 'amber');
          return (
            <div key={i} style={{
              padding: '40px 30px', backgroundColor: D.surface,
              border: `2px solid ${c}88`, borderRadius: 12,
              boxShadow: `0 0 30px ${c}33`,
              transform: `scale(${p})`, opacity: p, textAlign: 'center',
            }}>
              <div style={{
                fontFamily: D.font_display, fontSize: 84, fontWeight: 900, color: c,
                lineHeight: 1, textShadow: `0 0 24px ${c}66`,
              }}>{it.value}</div>
              <div style={{
                fontFamily: D.font_mono, fontSize: 16, color: D.text_dim,
                marginTop: 12, letterSpacing: 1,
              }}>{it.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
