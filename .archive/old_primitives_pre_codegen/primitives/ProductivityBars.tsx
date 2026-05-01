import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { D } from '../design';

type Team = { label: string; speed: number };
type Props = { team_a: Team; team_b: Team; caption?: string };

export const ProductivityBars: React.FC<Props> = ({ team_a, team_b, caption }) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const progress = interpolate(frame, [10, Math.max(11, durationInFrames - fps)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const maxBarLen = width * 0.6;
  const labelX = 100;
  const barX = labelX + 280;
  const aY = height * 0.35;
  const bY = height * 0.55;

  // Faster team's bar reaches the right side at the end. Other scales relative.
  const maxSpeed = Math.max(team_a.speed, team_b.speed);
  const lenA = maxBarLen * (team_a.speed / maxSpeed) * progress;
  const lenB = maxBarLen * (team_b.speed / maxSpeed) * progress;
  const colorA = team_a.speed >= team_b.speed ? D.amber : D.text_dim;
  const colorB = team_b.speed >= team_a.speed ? D.amber : D.text_dim;

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {/* Team A row */}
      <div style={{
        position: 'absolute', left: labelX, top: aY - 18, width: 260,
        fontFamily: D.font_mono, fontSize: 22, color: D.text, fontWeight: 700,
      }}>{team_a.label}</div>
      <div style={{
        position: 'absolute', left: barX, top: aY - 24, width: lenA, height: 48,
        backgroundColor: colorA, borderRadius: 6,
        boxShadow: colorA === D.amber ? `0 0 20px ${D.amber}88` : 'none',
      }} />

      {/* Team B row */}
      <div style={{
        position: 'absolute', left: labelX, top: bY - 18, width: 260,
        fontFamily: D.font_mono, fontSize: 22, color: D.text, fontWeight: 700,
      }}>{team_b.label}</div>
      <div style={{
        position: 'absolute', left: barX, top: bY - 24, width: lenB, height: 48,
        backgroundColor: colorB, borderRadius: 6,
        boxShadow: colorB === D.amber ? `0 0 20px ${D.amber}88` : 'none',
      }} />

      {/* Caption */}
      {caption && (
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 100, textAlign: 'center',
          fontFamily: D.font_display, fontSize: 38, fontWeight: 800, color: D.amber,
          opacity: interpolate(frame, [Math.floor(durationInFrames * 0.5), Math.floor(durationInFrames * 0.7)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
          textShadow: `0 0 20px ${D.amber}66`,
        }}>
          {caption}
        </div>
      )}
    </div>
  );
};
