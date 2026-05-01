import React from 'react';
import { spring, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { D } from '../design';

type Props = { count: number; caption?: string };

export const SilhouetteTeam: React.FC<Props> = ({ count, caption }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const n = Math.max(1, Math.min(20, Math.floor(count)));
  const spacing = Math.min(180, (width - 200) / n);
  const startX = (width - spacing * (n - 1)) / 2;
  const y = height * 0.55;

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {Array.from({ length: n }, (_, i) => {
        const start = i * 4;
        const p = spring({ frame: frame - start, fps, config: { damping: 12, stiffness: 200 } });
        const x = startX + i * spacing;
        // Floating amber orb above each silhouette
        const orbBob = Math.sin((frame + i * 8) / (1.5 * fps) * Math.PI * 2) * 6;
        return (
          <React.Fragment key={i}>
            {/* Silhouette: head + body */}
            <div style={{
              position: 'absolute', left: x - 28, top: y - 80, width: 56, height: 56,
              borderRadius: '50%', backgroundColor: D.text_dim, opacity: 0.6 * p,
              transform: `scale(${p})`,
            }} />
            <div style={{
              position: 'absolute', left: x - 50, top: y - 24, width: 100, height: 130,
              borderTopLeftRadius: 50, borderTopRightRadius: 50,
              backgroundColor: D.text_dim, opacity: 0.6 * p,
              transform: `scale(${p})`,
            }} />
            {/* Floating orb */}
            <div style={{
              position: 'absolute', left: x - 18, top: y - 150 + orbBob, width: 36, height: 36,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${D.amber}, ${D.amber}66 60%, transparent 80%)`,
              boxShadow: `0 0 20px ${D.amber}`,
              opacity: p,
            }} />
          </React.Fragment>
        );
      })}
      {caption && (
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 80, textAlign: 'center',
          fontFamily: D.font_mono, fontSize: 22, color: D.text, letterSpacing: 2,
          opacity: interpolate(frame, [n * 4 + 5, n * 4 + 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
        }}>
          {caption}
        </div>
      )}
    </div>
  );
};
