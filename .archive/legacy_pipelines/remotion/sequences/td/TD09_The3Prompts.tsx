import React from 'react';
import { interpolate } from 'remotion';
import { Scene, Phase, usePhase } from '../../storyboard/Scene';
import { TC, TF, Backdrop, Tag, SlamText } from '../../components/td/primitives';

const PROMPTS = [
  { num: '1', name: 'Post-Trade Journal',  hint: 'run monthly',     color: '#22D3EE' },
  { num: '2', name: 'Daily News Triage',   hint: 'every morning',   color: '#22C55E' },
  { num: '3', name: 'Earnings Call Analysis', hint: 'per quarter',  color: '#FBBF24' },
  { num: '4', name: 'Pre-Trade Stress Test',  hint: 'every trade',  color: '#EF4444' },
];

const PinnedComment: React.FC = () => {
  const { phaseFrame } = usePhase();
  return (
    <>
      <Backdrop />
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 18,
      }}>
        <Tag color={TC.amber}>📌 PINNED IN COMMENT</Tag>
        <SlamText text="Copy. Adapt. Use tomorrow." appearAt={6} color={TC.text} size={44} />
        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 14, width: 760 }}>
          {PROMPTS.map((p, i) => {
            const start = 22 + i * 12;
            const opacity = interpolate(phaseFrame - start, [0, 14], [0, 1], { extrapolateRight: 'clamp' });
            const x = interpolate(phaseFrame - start, [0, 18], [-40, 0], { extrapolateRight: 'clamp' });
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 18, padding: '16px 22px',
                backgroundColor: TC.panel, border: `2px solid ${p.color}66`, borderRadius: 8,
                opacity, transform: `translateX(${x}px)`,
              }}>
                <div style={{
                  fontFamily: TF.mono, fontSize: 26, fontWeight: 900, color: p.color, minWidth: 36,
                }}>
                  #{p.num}
                </div>
                <div style={{ flex: 1, fontFamily: TF.inter, fontSize: 22, color: TC.text, fontWeight: 700 }}>
                  {p.name}
                </div>
                <div style={{
                  fontFamily: TF.mono, fontSize: 13, color: TC.dim, letterSpacing: 1,
                }}>
                  {p.hint}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

const PersonalizeTweak: React.FC = () => {
  const { phaseFrame } = usePhase();
  return (
    <>
      <Backdrop />
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 22, padding: '0 100px',
      }}>
        <SlamText text="Don't just copy." appearAt={4} color={TC.text} size={48} />
        <SlamText text="Tweak." appearAt={20} color={TC.cyan} size={88} />
        <div style={{
          marginTop: 30, fontFamily: TF.inter, fontSize: 22, color: TC.text, maxWidth: 1000,
          textAlign: 'center', lineHeight: 1.5,
          opacity: interpolate(phaseFrame, [44, 60], [0, 1], { extrapolateRight: 'clamp' }),
        }}>
          Be specific about your style, your holdings, your risk tolerance.<br />
          <span style={{ color: TC.amber, fontWeight: 700 }}>Generic prompt → generic answer.</span><br />
          <span style={{ color: TC.green, fontWeight: 700 }}>Personalized → your edge.</span>
        </div>
      </div>
    </>
  );
};

export const TD09_The3Prompts: React.FC = () => (
  <Scene id="td09">
    <Phase id="pinned_comment"><PinnedComment /></Phase>
    <Phase id="personalize_tweak"><PersonalizeTweak /></Phase>
  </Scene>
);
