import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { D } from '../design';

type Guide = { label: string; icon?: string };
type Sensor = { label: string; icon?: string; result?: string };
type Props = { guides: Guide[]; sensors: Sensor[] };

export const GuidesSensorsSplit: React.FC<Props> = ({ guides, sensors }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const cx = width / 2;
  const cy = height / 2;

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {/* Central orb */}
      <div style={{
        position: 'absolute', left: cx - 80, top: cy - 80, width: 160, height: 160,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${D.amber}, ${D.amber}33 60%, transparent 80%)`,
        boxShadow: `0 0 50px ${D.amber}`,
        opacity: interpolate(frame, [0, 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
      }} />

      {/* Header bands */}
      <div style={{
        position: 'absolute', left: 0, top: 60, width: '50%', textAlign: 'center',
        fontFamily: D.font_mono, fontSize: 18, color: D.cyan, letterSpacing: 6, fontWeight: 700,
      }}>GUIDES →</div>
      <div style={{
        position: 'absolute', right: 0, top: 60, width: '50%', textAlign: 'center',
        fontFamily: D.font_mono, fontSize: 18, color: D.green, letterSpacing: 6, fontWeight: 700,
      }}>← SENSORS</div>

      {/* Guides on left, flowing right */}
      {guides.map((g, i) => {
        const yPos = cy - (guides.length - 1) * 60 + i * 120;
        const start = 8 + i * 8;
        const p = spring({ frame: frame - start, fps, config: { damping: 14, stiffness: 200 } });
        const x = interpolate(p, [0, 1], [60, cx - 280]);
        return (
          <React.Fragment key={`g${i}`}>
            <div style={{
              position: 'absolute', left: x, top: yPos - 28, width: 240, padding: '14px 18px',
              backgroundColor: D.surface, border: `1.5px solid ${D.cyan}88`, borderRadius: 8,
              fontFamily: D.font_mono, fontSize: 16, color: D.cyan, fontWeight: 700,
              opacity: p,
            }}>
              {g.label}
            </div>
          </React.Fragment>
        );
      })}

      {/* Sensors on right, flowing back to center */}
      {sensors.map((s, i) => {
        const yPos = cy - (sensors.length - 1) * 60 + i * 120;
        const start = 12 + i * 8;
        const p = spring({ frame: frame - start, fps, config: { damping: 14, stiffness: 200 } });
        const x = interpolate(p, [0, 1], [width - 60 - 240, cx + 80 + 60]);
        return (
          <React.Fragment key={`s${i}`}>
            <div style={{
              position: 'absolute', left: x, top: yPos - 28, width: 240, padding: '14px 18px',
              backgroundColor: D.surface, border: `1.5px solid ${D.green}88`, borderRadius: 8,
              fontFamily: D.font_mono, fontSize: 16, color: D.green, fontWeight: 700,
              opacity: p,
            }}>
              {s.label}
              {s.result && (
                <div style={{ fontSize: 13, color: D.text_dim, marginTop: 4 }}>
                  {s.result}
                </div>
              )}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};
