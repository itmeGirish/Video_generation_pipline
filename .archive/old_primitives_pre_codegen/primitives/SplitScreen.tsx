import React from 'react';
import { spring, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { fitText } from '@remotion/layout-utils';
import { D, resolveColor } from '../design';

type Side = { label: string; color?: string; value?: string };
type Props = { left: Side; right: Side; subtitle?: string };

const SidePanel: React.FC<{
  side: Side;
  defaultColor: string;
  alignSide: 'left' | 'right';
  springFrame: number;
}> = ({ side, defaultColor, alignSide, springFrame }) => {
  const { fps, width } = useVideoConfig();
  const frame = useCurrentFrame();
  const c = resolveColor(side.color || defaultColor);
  const p = spring({ frame: springFrame, fps, config: { damping: 12, stiffness: 180 } });

  // Fit the label to the half-screen width minus padding so it's BIG, not tiny.
  const halfWidth = width / 2 - 160;
  const { fontSize: fitted } = fitText({
    text: side.label,
    fontFamily: D.font_display,
    fontWeight: '800',
    withinWidth: halfWidth,
  });
  const labelSize = Math.min(54, fitted);

  // Ambient breathing glow so the panel doesn't sit dead (1 cycle per second, fps-independent).
  const breathe = 0.6 + Math.sin(frame / fps) * 0.15;

  return (
    <div style={{
      position: 'absolute',
      [alignSide]: 0, top: 0, bottom: 0, width: '50%',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 28, padding: 80,
      background: `radial-gradient(ellipse at center, ${c}${Math.round(breathe * 30).toString(16).padStart(2,'0')} 0%, transparent 65%)`,
    }}>
      {/* Backdrop panel */}
      <div style={{
        position: 'absolute', inset: 60,
        border: `2px solid ${c}40`,
        borderRadius: 28,
        background: `${D.surface}cc`,
        boxShadow: `0 0 60px ${c}44, inset 0 0 40px ${c}22`,
        opacity: p,
        transform: `scale(${0.92 + p * 0.08})`,
      }} />
      {/* Side label (big) */}
      <div style={{
        position: 'relative',
        fontFamily: D.font_display,
        fontSize: labelSize,
        fontWeight: 800,
        color: c,
        lineHeight: 1.15,
        textAlign: 'center',
        opacity: p,
        transform: `translateY(${(1 - p) * 20}px)`,
        textShadow: `0 0 30px ${c}aa`,
      }}>{side.label}</div>
      {/* Optional value (huge) */}
      {side.value && (
        <div style={{
          position: 'relative',
          fontFamily: D.font_display,
          fontSize: 120, fontWeight: 900, color: c,
          opacity: p, transform: `scale(${0.85 + p * 0.15})`,
          textShadow: `0 0 50px ${c}cc`,
        }}>{side.value}</div>
      )}
    </div>
  );
};

export const SplitScreen: React.FC<Props> = ({ left, right, subtitle }) => {
  const frame = useCurrentFrame();
  const seam = interpolate(frame, [0, 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const sub = interpolate(frame, [4, 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {/* Subtitle band at top */}
      {subtitle && (
        <div style={{
          position: 'absolute', top: 60, left: 0, right: 0, textAlign: 'center',
          fontFamily: D.font_mono, fontSize: 22, color: D.text_dim,
          letterSpacing: 5, opacity: sub,
        }}>{subtitle}</div>
      )}

      {/* "VS" badge in the seam */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: `translate(-50%, -50%) scale(${seam})`,
        fontFamily: D.font_display, fontSize: 56, fontWeight: 900,
        color: D.white, letterSpacing: 6, zIndex: 5,
        textShadow: `0 0 30px ${D.white}aa`,
        background: D.bg, padding: '4px 24px', borderRadius: 12,
      }}>VS</div>

      {/* Vertical seam */}
      <div style={{
        position: 'absolute', top: 120, bottom: 80, left: '50%', width: 3,
        backgroundColor: D.text, opacity: 0.5 * seam,
        boxShadow: `0 0 16px ${D.white}`,
        transform: 'translateX(-50%)',
      }} />

      <SidePanel side={left} defaultColor="violet" alignSide="left" springFrame={frame - 6} />
      <SidePanel side={right} defaultColor="cyan" alignSide="right" springFrame={frame - 16} />
    </div>
  );
};
