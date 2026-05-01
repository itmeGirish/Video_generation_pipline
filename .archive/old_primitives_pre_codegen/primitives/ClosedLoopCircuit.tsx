import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { D, resolveColor } from '../design';

type Stage = { label: string; color: string };
type Props = { stages: Stage[] };

export const ClosedLoopCircuit: React.FC<Props> = ({ stages }) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const cx = width / 2;
  const cy = height / 2;
  const r = Math.min(width, height) * 0.28;
  const drawProgress = interpolate(frame, [0, Math.floor(durationInFrames * 0.55)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const circumference = 2 * Math.PI * r;

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <svg style={{ position: 'absolute', inset: 0 }} width={width} height={height}>
        <defs>
          <linearGradient id="loopGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={D.violet} />
            <stop offset="33%" stopColor={D.amber} />
            <stop offset="66%" stopColor={D.green} />
            <stop offset="100%" stopColor={D.violet} />
          </linearGradient>
        </defs>
        <circle
          cx={cx} cy={cy} r={r}
          fill="none" stroke="url(#loopGrad)" strokeWidth={5}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - drawProgress)}
          strokeLinecap="round"
        />
      </svg>
      {stages.map((s, i) => {
        const angle = -Math.PI / 2 + (i / stages.length) * Math.PI * 2;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        const start = 18 + i * 8;
        const p = spring({ frame: frame - start, fps, config: { damping: 12, stiffness: 200 } });
        const c = resolveColor(s.color);
        return (
          <React.Fragment key={i}>
            <div style={{
              position: 'absolute', left: x - 12, top: y - 12, width: 24, height: 24,
              borderRadius: '50%', backgroundColor: c, boxShadow: `0 0 16px ${c}`,
              transform: `scale(${p})`, opacity: p,
            }} />
            <div style={{
              position: 'absolute', left: x - 100, top: y + 22, width: 200, textAlign: 'center',
              fontFamily: D.font_mono, fontSize: 18, color: c, letterSpacing: 2, fontWeight: 700,
              opacity: p,
            }}>
              {s.label}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};
