import React from 'react';
import { interpolate, spring, useVideoConfig } from 'remotion';
import { Scene, Phase, usePhase } from '../../storyboard/Scene';
import { C, F, Starfield, ClaudeOrb } from '../../components/rh/primitives';

const BOXES = [
  { label: 'Tools', pos: [-280, -150] as [number, number] },
  { label: 'Memory', pos: [260, -170] as [number, number] },
  { label: 'Planner', pos: [-320, 80] as [number, number] },
  { label: 'Guardrails', pos: [280, 100] as [number, number] },
  { label: 'Executor', pos: [0, 240] as [number, number] },
];

const SplitScreen: React.FC = () => {
  const { phaseFrame, phaseDuration } = usePhase();
  const { fps } = useVideoConfig();

  // Right-side orb position
  const rightCx = 1440;
  const rightCy = 540;
  const leftCx = 480;
  const leftCy = 540;

  return (
    <>
      <Starfield />
      {/* Divider */}
      <div style={{
        position: 'absolute', top: 80, bottom: 80, left: '50%',
        width: 2, backgroundColor: C.cyan, opacity: 0.5, zIndex: 1,
      }} />

      {/* LEFT: lonely orb */}
      <div style={{
        position: 'absolute', left: 60, top: 60,
        fontFamily: F.mono, fontSize: 16, color: C.cyan, letterSpacing: 2, zIndex: 1,
      }}>CLAUDE</div>
      <ClaudeOrb x={leftCx} y={leftCy} size={160} />

      {/* RIGHT: orb + 5 labeled boxes */}
      <div style={{
        position: 'absolute', right: 60, top: 60,
        fontFamily: F.mono, fontSize: 16, color: C.cyan, letterSpacing: 2, zIndex: 1,
        textAlign: 'right',
      }}>CLAUDE + HARNESS</div>
      <ClaudeOrb x={rightCx} y={rightCy} size={130} />

      {BOXES.map((b, i) => {
        const appear = spring({
          frame: phaseFrame - 30 - i * 15,
          fps, config: { damping: 12, stiffness: 180 },
        });
        if (phaseFrame < 30 + i * 15) return null;
        const x = rightCx + b.pos[0];
        const y = rightCy + b.pos[1];

        // Data packet — pulses toward orb
        const pulsePhase = ((phaseFrame - 60 - i * 30) % 120) / 120;
        const showPacket = phaseFrame > 90 && pulsePhase > 0 && pulsePhase < 0.6;
        const pp = pulsePhase / 0.6;
        const px = x + (rightCx - x) * pp;
        const py = y + (rightCy - y) * pp;

        return (
          <React.Fragment key={i}>
            {/* Connection line */}
            <svg style={{
              position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
              opacity: appear,
            }} width="1920" height="1080">
              <line x1={x} y1={y} x2={rightCx} y2={rightCy}
                stroke={C.cyan} strokeWidth={1} opacity={0.6} strokeDasharray="4 4" />
            </svg>
            {/* Box */}
            <div style={{
              position: 'absolute', left: x - 80, top: y - 30,
              width: 160, padding: '10px 16px', borderRadius: 8,
              backgroundColor: '#101520', border: `1.5px solid ${C.cyan}`,
              fontFamily: F.mono, fontSize: 16, color: C.text,
              textAlign: 'center',
              transform: `scale(${appear})`, opacity: appear, zIndex: 1,
            }}>
              {b.label}
            </div>
            {/* Data packet */}
            {showPacket && (
              <div style={{
                position: 'absolute', left: px - 4, top: py - 4,
                width: 8, height: 8, borderRadius: '50%',
                backgroundColor: C.cyan,
                boxShadow: `0 0 6px ${C.cyan}`,
                zIndex: 2,
              }} />
            )}
          </React.Fragment>
        );
      })}
    </>
  );
};

export const RH03_RealQuestion: React.FC = () => (
  <Scene id="rh03">
    <Phase id="split_screen"><SplitScreen /></Phase>
  </Scene>
);
