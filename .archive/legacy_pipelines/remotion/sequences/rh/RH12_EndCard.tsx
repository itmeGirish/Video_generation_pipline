import React from 'react';
import { interpolate, spring, useVideoConfig } from 'remotion';
import { Scene, Phase, usePhase } from '../../storyboard/Scene';
import { C, F, Starfield } from '../../components/rh/primitives';

const EndCard: React.FC = () => {
  const { phaseFrame, phaseDuration } = usePhase();
  const { fps } = useVideoConfig();
  const leftP  = spring({ frame: phaseFrame - 15, fps, config: { damping: 14 } });
  const rightP = spring({ frame: phaseFrame - 30, fps, config: { damping: 14 } });
  const botP   = spring({ frame: phaseFrame - 55, fps, config: { damping: 14 } });

  return (
    <>
      <Starfield />
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1, padding: '80px 120px',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60,
        alignItems: 'center', justifyItems: 'center',
      }}>
        {/* Left thumbnail */}
        <div style={{
          width: 600, height: 338, borderRadius: 14,
          backgroundColor: '#101520', border: `2px solid ${C.cyan}`,
          transform: `translateX(${interpolate(leftP, [0, 1], [-80, 0])}px) scale(${leftP})`,
          opacity: leftP, padding: 30,
          display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14,
        }}>
          <div style={{ fontFamily: F.mono, fontSize: 14, color: C.dim, letterSpacing: 2 }}>
            NEXT
          </div>
          <div style={{ fontFamily: F.inter, fontSize: 30, fontWeight: 900, color: C.text, lineHeight: 1.2 }}>
            The Anatomy of an Agent Harness
          </div>
        </div>
        {/* Right thumbnail */}
        <div style={{
          width: 600, height: 338, borderRadius: 14,
          backgroundColor: '#101520', border: `2px solid ${C.magenta}`,
          transform: `translateX(${interpolate(rightP, [0, 1], [80, 0])}px) scale(${rightP})`,
          opacity: rightP, padding: 30,
          display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14,
        }}>
          <div style={{ fontFamily: F.mono, fontSize: 14, color: C.dim, letterSpacing: 2 }}>
            PLAYLIST
          </div>
          <div style={{ fontFamily: F.inter, fontSize: 30, fontWeight: 900, color: C.text, lineHeight: 1.2 }}>
            Building AI-Native Products
          </div>
        </div>
      </div>
      {/* Subscribe */}
      <div style={{
        position: 'absolute', bottom: 80, left: 0, right: 0, textAlign: 'center', zIndex: 2,
        opacity: botP, transform: `scale(${botP})`,
      }}>
        <div style={{
          display: 'inline-block', padding: '14px 32px', borderRadius: 12,
          backgroundColor: C.cyan, color: '#000',
          fontFamily: F.inter, fontSize: 22, fontWeight: 900, letterSpacing: 2,
        }}>
          ▶ SUBSCRIBE
        </div>
      </div>
    </>
  );
};

export const RH12_EndCard: React.FC = () => (
  <Scene id="rh12">
    <Phase id="end_card"><EndCard /></Phase>
  </Scene>
);
