import React from 'react';
import { spring, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { D } from '../design';

type Node = { year: string; label: string; current?: boolean; future?: boolean };
type Props = { nodes: Node[] };

export const EvolutionTimeline: React.FC<Props> = ({ nodes }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const cy = height / 2;
  const margin = 200;
  const usable = width - margin * 2;
  const lineProgress = interpolate(frame, [0, fps], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {/* Backbone line */}
      <div style={{
        position: 'absolute', left: margin, top: cy - 1, width: usable * lineProgress, height: 2,
        backgroundColor: D.text_dim, opacity: 0.6,
      }} />
      {nodes.map((n, i) => {
        const x = margin + (usable * i) / Math.max(1, nodes.length - 1);
        const start = 16 + i * 10;
        const p = spring({ frame: frame - start, fps, config: { damping: 11, stiffness: 200 } });
        const color = n.current ? D.amber : n.future ? D.text_dim : D.cyan;
        const dotSize = n.current ? 28 : 20;
        return (
          <React.Fragment key={i}>
            {/* Dot */}
            <div style={{
              position: 'absolute', left: x - dotSize / 2, top: cy - dotSize / 2,
              width: dotSize, height: dotSize, borderRadius: '50%',
              backgroundColor: n.future ? 'transparent' : color,
              border: `2px ${n.future ? 'dashed' : 'solid'} ${color}`,
              boxShadow: n.current ? `0 0 30px ${color}` : 'none',
              transform: `scale(${p})`, opacity: p,
            }} />
            {/* Year above */}
            <div style={{
              position: 'absolute', left: x - 60, top: cy - 70, width: 120, textAlign: 'center',
              fontFamily: D.font_mono, fontSize: 16, color: D.text_dim, letterSpacing: 2,
              opacity: p,
            }}>
              {n.year}
            </div>
            {/* Label below */}
            <div style={{
              position: 'absolute', left: x - 90, top: cy + 28, width: 180, textAlign: 'center',
              fontFamily: D.font_display, fontSize: n.current ? 24 : 18,
              fontWeight: n.current ? 800 : 600, color,
              opacity: p,
            }}>
              {n.label}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};
