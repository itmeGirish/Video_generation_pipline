import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { D, resolveColor } from '../design';

type Counter = { label: string; from: number; to: number; color?: string };
type Event = { at_pct: number; label: string };
type Props = {
  from_label: string;
  to_label: string;
  counters?: Counter[];
  events?: Event[];
};

export const TimelinePlayhead: React.FC<Props> = ({ from_label, to_label, counters = [], events = [] }) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const margin = 160;
  const usable = width - margin * 2;
  const baseY = height * 0.65;
  const headProgress = interpolate(frame, [10, Math.max(11, durationInFrames - fps)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const headX = margin + usable * headProgress;

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {/* Counters above */}
      <div style={{
        position: 'absolute', left: margin, right: margin, top: 100,
        display: 'flex', justifyContent: 'space-around', gap: 30,
      }}>
        {counters.map((c, i) => {
          const v = Math.floor(interpolate(headProgress, [0, 1], [c.from, c.to]));
          const color = resolveColor(c.color || 'amber');
          const p = spring({ frame: frame - 8 - i * 4, fps, config: { damping: 12, stiffness: 200 } });
          return (
            <div key={i} style={{ textAlign: 'center', opacity: p }}>
              <div style={{ fontFamily: D.font_display, fontSize: 56, fontWeight: 900, color }}>
                {v.toLocaleString()}
              </div>
              <div style={{ fontFamily: D.font_mono, fontSize: 14, color: D.text_dim, letterSpacing: 2 }}>
                {c.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Track */}
      <div style={{
        position: 'absolute', left: margin, top: baseY - 2, width: usable, height: 4,
        backgroundColor: D.surface, borderRadius: 2,
      }} />
      {/* Filled portion */}
      <div style={{
        position: 'absolute', left: margin, top: baseY - 2, width: usable * headProgress, height: 4,
        backgroundColor: D.cyan, borderRadius: 2,
        boxShadow: `0 0 12px ${D.cyan}`,
      }} />
      {/* Playhead */}
      <div style={{
        position: 'absolute', left: headX - 8, top: baseY - 18, width: 16, height: 36,
        backgroundColor: D.amber, borderRadius: 4,
        boxShadow: `0 0 18px ${D.amber}`,
      }} />

      {/* Event badges */}
      {events.map((e, i) => {
        const ex = margin + usable * Math.max(0, Math.min(1, e.at_pct));
        const reached = headProgress >= e.at_pct;
        const p = spring({ frame: frame - Math.floor(e.at_pct * (durationInFrames - fps)), fps, config: { damping: 10, stiffness: 220 } });
        return (
          <div key={i} style={{
            position: 'absolute', left: ex - 80, top: baseY + 30, width: 160, textAlign: 'center',
            fontFamily: D.font_mono, fontSize: 14, color: reached ? D.amber : D.text_dim,
            letterSpacing: 1, opacity: reached ? p : 0.4,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: reached ? D.amber : D.text_dim, margin: '0 auto 6px' }} />
            {e.label}
          </div>
        );
      })}

      {/* Endpoints */}
      <div style={{
        position: 'absolute', left: margin - 40, top: baseY - 10, width: 80, textAlign: 'center',
        fontFamily: D.font_mono, fontSize: 14, color: D.text_dim,
      }}>{from_label}</div>
      <div style={{
        position: 'absolute', right: margin - 40, top: baseY - 10, width: 80, textAlign: 'center',
        fontFamily: D.font_mono, fontSize: 14, color: D.text_dim,
      }}>{to_label}</div>
    </div>
  );
};
