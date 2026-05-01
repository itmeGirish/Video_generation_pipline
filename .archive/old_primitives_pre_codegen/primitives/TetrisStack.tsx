import React from 'react';
import { spring, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { D } from '../design';

type Props = { blocks: string[]; header?: string };

export const TetrisStack: React.FC<Props> = ({ blocks, header }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const blockH = 80;
  const blockW = 380;
  const baseY = height * 0.85 - blockH;
  const cx = width / 2;

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {header && (
        <div style={{
          position: 'absolute', left: 0, right: 0, top: 80, textAlign: 'center',
          fontFamily: D.font_mono, fontSize: 22, color: D.cyan, letterSpacing: 4,
          opacity: interpolate(frame, [0, 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
        }}>
          {header}
        </div>
      )}
      {blocks.map((label, i) => {
        // Each block falls into place after a stagger
        const start = 12 + i * 12;
        const fallP = spring({ frame: frame - start, fps, config: { damping: 12, stiffness: 180 } });
        const targetY = baseY - i * blockH;
        const startY = -blockH;
        const y = interpolate(fallP, [0, 1], [startY, targetY]);
        return (
          <div key={i} style={{
            position: 'absolute', left: cx - blockW / 2, top: y, width: blockW, height: blockH - 8,
            backgroundColor: D.surface, border: `2px solid ${D.cyan}`, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: D.font_display, fontSize: 26, fontWeight: 700, color: D.cyan,
            boxShadow: `0 0 20px ${D.cyan}55`,
            opacity: fallP,
          }}>
            {label}
          </div>
        );
      })}
    </div>
  );
};
