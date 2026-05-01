import React from 'react';
import { interpolate, spring, useVideoConfig } from 'remotion';
import { Scene, Phase, usePhase } from '../../storyboard/Scene';
import { C, F, Starfield } from '../../components/rh/primitives';

const TASKS = [
  'Pick one repetitive task in your work',
  'Wrap one AI call + one tool around it',
  'Use it Monday',
];

const Checklist: React.FC = () => {
  const { phaseFrame, phaseDuration } = usePhase();
  const { fps } = useVideoConfig();
  const showSubscribe = phaseFrame > phaseDuration * 0.6;
  const subPulse = 0.85 + 0.15 * Math.sin(phaseFrame * 0.2);

  return (
    <>
      <Starfield />
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 40,
      }}>
        <div style={{
          fontFamily: F.inter, fontSize: 52, fontWeight: 900, color: C.text, letterSpacing: 1, textAlign: 'center',
        }}>
          Build your first harness<br/>
          <span style={{ color: C.cyan }}>this weekend.</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 10 }}>
          {TASKS.map((t, i) => {
            const start = i * 25;
            const p = spring({ frame: phaseFrame - start, fps, config: { damping: 14 } });
            if (phaseFrame < start) return null;
            const checked = phaseFrame > start + 30;
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 20,
                transform: `translateX(${interpolate(p, [0, 1], [-30, 0])}px)`, opacity: p,
                padding: '14px 28px', borderRadius: 10,
                backgroundColor: '#101520', border: `1px solid ${C.cyan}66`,
                minWidth: 800,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 6,
                  border: `2px solid ${checked ? C.green : C.cyan}`,
                  backgroundColor: checked ? `${C.green}33` : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, color: C.green, fontWeight: 900,
                }}>
                  {checked ? '✓' : ''}
                </div>
                <div style={{ fontFamily: F.mono, fontSize: 18, color: C.text }}>{t}</div>
              </div>
            );
          })}
        </div>
        {showSubscribe && (
          <div style={{
            position: 'absolute', bottom: 80, right: 80,
            padding: '14px 28px', borderRadius: 12,
            backgroundColor: C.cyan, color: '#000',
            fontFamily: F.inter, fontSize: 22, fontWeight: 900, letterSpacing: 1,
            transform: `scale(${subPulse})`,
            boxShadow: `0 0 20px ${C.cyan}aa`,
          }}>
            ▶ SUBSCRIBE
          </div>
        )}
      </div>
    </>
  );
};

export const RH10_CTA: React.FC = () => (
  <Scene id="rh10">
    <Phase id="checklist"><Checklist /></Phase>
  </Scene>
);
