import React from 'react';
import { interpolate, spring, useVideoConfig } from 'remotion';
import { Scene, Phase, usePhase } from '../../storyboard/Scene';
import { TC, TF, Backdrop, Tag, SlamText } from '../../components/td/primitives';

const TeaseNext: React.FC = () => {
  const { phaseFrame } = usePhase();
  const { fps } = useVideoConfig();
  const popIn = spring({ frame: phaseFrame - 5, fps, config: { damping: 12, stiffness: 180 } });
  return (
    <>
      <Backdrop />
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 24,
      }}>
        <Tag color={TC.amber}>NEXT WEEK · ON CAMERA</Tag>
        <SlamText text="Build the news triage" appearAt={8} color={TC.text} size={50} />
        <SlamText text="as an automated system." appearAt={22} color={TC.cyan} size={50} />
        <div style={{
          marginTop: 28, padding: '20px 32px',
          backgroundColor: TC.panel, border: `2px solid ${TC.green}`, borderRadius: 12,
          boxShadow: `0 0 30px ${TC.green}66`,
          fontFamily: TF.mono, fontSize: 18, color: TC.green,
          transform: `scale(${popIn})`, opacity: popIn,
        }}>
          📱 Drops in WhatsApp · before market opens
        </div>
        <div style={{
          marginTop: 12, padding: '10px 20px', borderRadius: 8,
          backgroundColor: TC.red, color: TC.text, fontFamily: TF.inter, fontSize: 22, fontWeight: 900,
          letterSpacing: 1.5,
          opacity: interpolate(phaseFrame, [60, 75], [0, 1], { extrapolateRight: 'clamp' }),
        }}>
          ▶ SUBSCRIBE
        </div>
      </div>
    </>
  );
};

const ShareClose: React.FC = () => {
  const { phaseFrame } = usePhase();
  return (
    <>
      <Backdrop />
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 28,
      }}>
        <SlamText text="If this saved you time…" appearAt={4} color={TC.text} size={44} />
        <SlamText text="send it to one friend." appearAt={20} color={TC.cyan} size={56} />
        <div style={{
          marginTop: 30,
          fontFamily: TF.mono, fontSize: 14, color: TC.dim, letterSpacing: 4,
          opacity: interpolate(phaseFrame, [40, 60], [0, 1], { extrapolateRight: 'clamp' }),
        }}>
          CLAUDE 4.7 · TRADING · 30-DAY DEBRIEF
        </div>
      </div>
    </>
  );
};

export const TD10_Outro: React.FC = () => (
  <Scene id="td10">
    <Phase id="tease_next"><TeaseNext /></Phase>
    <Phase id="share_close"><ShareClose /></Phase>
  </Scene>
);
