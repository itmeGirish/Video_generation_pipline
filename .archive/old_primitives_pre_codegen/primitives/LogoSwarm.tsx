import React from 'react';
import { spring, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { D } from '../design';

type Props = { caption: string; logos: string[] };

export const LogoSwarm: React.FC<Props> = ({ caption, logos }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.32;
  const captionP = spring({ frame, fps, config: { damping: 16, stiffness: 200 } });

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {/* Central caption */}
      <div style={{
        position: 'absolute', left: cx - 280, top: cy - 36, width: 560, textAlign: 'center',
        fontFamily: D.font_display, fontSize: 44, fontWeight: 800, color: D.text,
        opacity: captionP, transform: `scale(${captionP})`,
        textShadow: `0 0 20px ${D.amber}55`,
      }}>
        {caption}
      </div>
      {/* Logos arranged in circle */}
      {logos.map((name, i) => {
        const angle = (i / logos.length) * Math.PI * 2 - Math.PI / 2;
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;
        const start = 8 + i * 5;
        const p = spring({ frame: frame - start, fps, config: { damping: 9, stiffness: 220 } });
        return (
          <div key={i} style={{
            position: 'absolute', left: x - 70, top: y - 28, width: 140, height: 56,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: D.surface, border: `1.5px solid ${D.cyan}66`, borderRadius: 8,
            fontFamily: D.font_mono, fontSize: 16, color: D.cyan, fontWeight: 700,
            transform: `scale(${p})`, opacity: p,
            boxShadow: `0 0 12px ${D.cyan}33`,
          }}>
            {name}
          </div>
        );
      })}
    </div>
  );
};
