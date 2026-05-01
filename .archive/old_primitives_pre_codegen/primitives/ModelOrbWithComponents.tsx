import React from 'react';
import { spring, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { D } from '../design';

type ComponentItem = { label: string; icon?: string };
type Props = { label?: string; components: ComponentItem[] };

// Amber breathing orb in center, cyan component cards around it on a circle.
export const ModelOrbWithComponents: React.FC<Props> = ({ label, components }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const cx = width / 2;
  const cy = height / 2;
  const radius = 320;
  const orbBreathe = 0.92 + 0.08 * (0.5 + 0.5 * Math.sin((frame / (2 * fps)) * Math.PI * 2));

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {/* Orb */}
      <div style={{
        position: 'absolute', left: cx - 90, top: cy - 90, width: 180, height: 180,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${D.amber}, ${D.amber}33 60%, transparent 80%)`,
        boxShadow: `0 0 ${60 * orbBreathe}px ${D.amber}`,
        opacity: orbBreathe,
      }} />
      {label && (
        <div style={{
          position: 'absolute', left: 0, right: 0, top: cy + 110, textAlign: 'center',
          fontFamily: D.font_mono, fontSize: 14, color: D.amber, letterSpacing: 4,
          opacity: interpolate(frame, [0, 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
        }}>{label}</div>
      )}
      {/* Components on a circle */}
      {components.map((c, i) => {
        const angle = -Math.PI / 2 + (i / components.length) * Math.PI * 2;
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;
        const start = 10 + i * 4;
        const p = spring({ frame: frame - start, fps, config: { damping: 10, stiffness: 220 } });
        return (
          <React.Fragment key={i}>
            {/* Connection line */}
            <svg style={{ position: 'absolute', inset: 0 }} width={width} height={height}>
              <line
                x1={cx + Math.cos(angle) * 100} y1={cy + Math.sin(angle) * 100}
                x2={x - Math.cos(angle) * 80} y2={y - Math.sin(angle) * 30}
                stroke={D.cyan} strokeWidth={1.5} opacity={0.4 * p}
              />
            </svg>
            <div style={{
              position: 'absolute', left: x - 100, top: y - 24,
              width: 200, padding: '12px 16px', textAlign: 'center',
              backgroundColor: D.surface, border: `1.5px solid ${D.cyan}`, borderRadius: 8,
              boxShadow: `0 0 14px ${D.cyan}55`,
              fontFamily: D.font_mono, fontSize: 16, color: D.cyan, fontWeight: 700,
              transform: `scale(${p})`, opacity: p,
            }}>
              {c.label}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};
