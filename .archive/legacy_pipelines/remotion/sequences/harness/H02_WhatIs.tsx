import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { findWordFrame, getSceneDurationFrames } from '../../utils/audioSync';

const C = {
  bg: '#0A1628', blue: '#00ADE4', violet: '#7C5CFF',
  green: '#22C55E', amber: '#F59E0B', white: '#E8F4FF', dim: '#4A5568', card: '#111E34',
};
const MONO = 'JetBrains Mono, monospace';
const SANS = 'Inter, sans-serif';

const Background: React.FC = () => (
  <>
    <div style={{
      position: 'absolute', inset: 0, backgroundColor: C.bg,
      backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(0,173,228,0.08), transparent 60%)',
    }} />
    <div style={{
      position: 'absolute', inset: 0, opacity: 0.4,
      backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)',
      backgroundSize: '40px 40px',
    }} />
  </>
);

// 3×3 module layout — center = platform hex, 8 surrounding
const MODULES = [
  { name: 'CI',                  pos: [0, 0], phrase: 'Continuous Integration' },
  { name: 'CD',                  pos: [1, 0], phrase: 'Continuous Delivery' },
  { name: 'Feature Flags',       pos: [2, 0], phrase: 'Feature Flags' },
  { name: 'Security Testing',    pos: [0, 1], phrase: 'Security Testing' },
  { name: '',                    pos: [1, 1], phrase: '' }, // center
  { name: 'IaC Management',      pos: [2, 1], phrase: 'Infrastructure as Code' },
  { name: 'Cloud Cost',          pos: [0, 2], phrase: 'Cloud Cost' },
  { name: 'Developer Portal',    pos: [1, 2], phrase: 'Developer Portal' },
  { name: 'Chaos Engineering',   pos: [2, 2], phrase: 'Chaos Engineering' },
];

export const H02_WhatIs: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const KEY = 'h02';
  const total = getSceneDurationFrames(KEY);

  // Phase timings derived from narration
  const modulesStart = findWordFrame(KEY, 'Continuous Integration', 240);
  const pulseAllStart = findWordFrame(KEY, 'Each module', 1000);
  const aiWipeStart = findWordFrame(KEY, 'twenty twenty', 1300);

  // Center hex "breathing"
  const breathe = 1 + Math.sin(frame * 0.08) * 0.02;

  // Center hex label flip
  const flipLabel = frame > pulseAllStart;

  // AI wipe
  const aiWipeProgress = interpolate(frame - aiWipeStart, [0, 60], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Connector pulse
  const globalPulse = interpolate(Math.sin((frame - pulseAllStart) * 0.2), [-1, 1], [0.4, 1]);

  const cellW = 300;
  const cellH = 200;
  const gridX = 1920 / 2 - 1.5 * cellW;
  const gridY = 1080 / 2 - 1.5 * cellH;

  return (
    <div style={{ width: 1920, height: 1080, position: 'relative', overflow: 'hidden' }}>
      <Background />

      {/* Module tiles */}
      {MODULES.map((mod, i) => {
        const [col, row] = mod.pos;
        const isCenter = col === 1 && row === 1;
        const x = gridX + col * cellW + cellW / 2;
        const y = gridY + row * cellH + cellH / 2;

        if (isCenter) {
          // Center hex
          const hexIn = spring({ frame, fps, config: { damping: 14 } });
          return (
            <div key={i} style={{
              position: 'absolute', left: x - 130, top: y - 80,
              width: 260, height: 160,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transform: `scale(${hexIn * breathe})`, opacity: hexIn,
              background: `linear-gradient(135deg, ${C.blue}22, ${C.violet}15)`,
              border: `2px solid ${C.blue}`, borderRadius: 16,
              boxShadow: `0 0 40px ${C.blue}44`,
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: SANS, fontSize: 28, fontWeight: 900, color: C.white, letterSpacing: 2 }}>
                  {flipLabel ? 'ONE PLATFORM' : 'HARNESS'}
                </div>
                <div style={{ fontFamily: MONO, fontSize: 12, color: C.blue, marginTop: 8, letterSpacing: 3 }}>
                  {flipLabel ? '' : 'PLATFORM'}
                </div>
              </div>
            </div>
          );
        }

        // Compute stagger start based on VO marker — when narrator says this module's phrase
        const moduleFrame = findWordFrame(KEY, mod.phrase, modulesStart + i * 30);
        const tileSpring = spring({ frame: frame - moduleFrame, fps, config: { damping: 14 } });

        // Entry direction — slide from final direction
        const dx = (col - 1) * 100;
        const dy = (row - 1) * 80;

        return (
          <React.Fragment key={i}>
            {/* Connector line from tile to center */}
            <svg style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }} width={1920} height={1080}>
              <line
                x1={x} y1={y} x2={960} y2={540}
                stroke={C.blue}
                strokeWidth={1.5}
                strokeDasharray={3}
                opacity={tileSpring * (frame > pulseAllStart ? globalPulse : 0.3)}
              />
            </svg>

            {/* Module tile */}
            <div style={{
              position: 'absolute', left: x - 110, top: y - 50,
              width: 220, height: 100, borderRadius: 12,
              backgroundColor: C.card,
              border: `1px solid ${C.blue}66`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transform: `translate(${interpolate(tileSpring, [0, 1], [dx, 0])}px, ${interpolate(tileSpring, [0, 1], [dy, 0])}px) scale(${tileSpring})`,
              opacity: tileSpring,
              boxShadow: frame > pulseAllStart ? `0 0 ${globalPulse * 20}px ${C.blue}66` : 'none',
            }}>
              <div style={{ fontFamily: SANS, fontSize: 16, fontWeight: 700, color: C.white, textAlign: 'center', padding: 8 }}>
                {mod.name}
              </div>
              {/* AI sparkle badge (after wipe) */}
              {aiWipeProgress > 0 && (
                <div style={{
                  position: 'absolute', top: -8, right: -8,
                  width: 24, height: 24, borderRadius: '50%',
                  backgroundColor: C.violet, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, opacity: aiWipeProgress,
                  boxShadow: `0 0 8px ${C.violet}`,
                }}>✨</div>
              )}
            </div>
          </React.Fragment>
        );
      })}

      {/* AI violet wipe overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(225deg, ${C.violet}22, transparent 70%)`,
        opacity: aiWipeProgress,
        pointerEvents: 'none',
      }} />

      {/* Footer tagline */}
      {aiWipeProgress > 0.5 && (
        <div style={{
          position: 'absolute', bottom: 80, left: 0, right: 0, textAlign: 'center',
          fontFamily: SANS, fontSize: 24, fontWeight: 600, color: C.violet,
          opacity: interpolate(aiWipeProgress, [0.5, 1], [0, 1]),
        }}>
          AI-native from the ground up — not bolted on.
        </div>
      )}
    </div>
  );
};
