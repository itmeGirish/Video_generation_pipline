import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { D, resolveColor } from '../design';

type Side = { label: string; rank_path: number[]; result_color: string };
type Props = { model_label: string; left: Side; right: Side };

const _interpRank = (path: number[], t: number): number => {
  if (path.length === 0) return 0;
  if (path.length === 1) return path[0];
  const idx = t * (path.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.min(path.length - 1, lo + 1);
  const f = idx - lo;
  return path[lo] * (1 - f) + path[hi] * f;
};

export const BenchmarkRace: React.FC<Props> = ({ model_label, left, right }) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const progress = interpolate(frame, [10, Math.max(11, durationInFrames - fps)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const lc = resolveColor(left.result_color);
  const rc = resolveColor(right.result_color);
  const lRank = _interpRank(left.rank_path, progress);
  const rRank = _interpRank(right.rank_path, progress);
  const cy = height * 0.5;
  const orbSize = 140;
  const lx = width * 0.28;
  const rx = width * 0.72;

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {/* Title bar */}
      <div style={{
        position: 'absolute', left: 0, right: 0, top: 80, textAlign: 'center',
        fontFamily: D.font_mono, fontSize: 22, color: D.text, letterSpacing: 4,
      }}>
        {model_label}
      </div>

      {/* Left orb */}
      <div style={{
        position: 'absolute', left: lx - orbSize / 2, top: cy - orbSize / 2,
        width: orbSize, height: orbSize, borderRadius: '50%',
        background: `radial-gradient(circle, ${lc}, ${lc}44 60%, transparent 80%)`,
        boxShadow: `0 0 ${40 + 30 * (1 - lRank / 10)}px ${lc}`,
      }} />
      <div style={{
        position: 'absolute', left: lx - 100, top: cy + orbSize / 2 + 16, width: 200, textAlign: 'center',
        fontFamily: D.font_display, fontSize: 28, fontWeight: 800, color: lc,
      }}>{left.label}</div>
      <div style={{
        position: 'absolute', left: lx - 80, top: cy + orbSize / 2 + 60, width: 160, textAlign: 'center',
        fontFamily: D.font_mono, fontSize: 16, color: D.text_dim, letterSpacing: 2,
      }}>rank #{Math.round(lRank)}</div>

      {/* Right orb */}
      <div style={{
        position: 'absolute', left: rx - orbSize / 2, top: cy - orbSize / 2,
        width: orbSize, height: orbSize, borderRadius: '50%',
        background: `radial-gradient(circle, ${rc}, ${rc}44 60%, transparent 80%)`,
        boxShadow: `0 0 ${40 + 30 * (1 - rRank / 10)}px ${rc}`,
      }} />
      <div style={{
        position: 'absolute', left: rx - 100, top: cy + orbSize / 2 + 16, width: 200, textAlign: 'center',
        fontFamily: D.font_display, fontSize: 28, fontWeight: 800, color: rc,
      }}>{right.label}</div>
      <div style={{
        position: 'absolute', left: rx - 80, top: cy + orbSize / 2 + 60, width: 160, textAlign: 'center',
        fontFamily: D.font_mono, fontSize: 16, color: D.text_dim, letterSpacing: 2,
      }}>rank #{Math.round(rRank)}</div>
    </div>
  );
};
