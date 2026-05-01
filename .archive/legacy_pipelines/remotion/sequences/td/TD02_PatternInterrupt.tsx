import React from 'react';
import { interpolate, useVideoConfig, spring } from 'remotion';
import { Scene, Phase, usePhase } from '../../storyboard/Scene';
import { TC, TF, Backdrop, SlamText } from '../../components/td/primitives';

const ScratchWarning: React.FC = () => {
  const { phaseFrame } = usePhase();
  const { fps } = useVideoConfig();
  const shake = phaseFrame < 8 ? Math.sin(phaseFrame * 3) * 12 : 0;
  return (
    <>
      <Backdrop />
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 20,
        transform: `translateX(${shake}px)`,
      }}>
        <div style={{
          fontFamily: TF.mono, fontSize: 16, color: TC.red, letterSpacing: 4,
          opacity: interpolate(phaseFrame, [0, 8], [0, 1], { extrapolateRight: 'clamp' }),
        }}>
          ✋ STOP
        </div>
        <SlamText text="If you came here for stock picks…" appearAt={4} color={TC.text} size={48} />
        <div style={{
          marginTop: 20,
          opacity: interpolate(phaseFrame, [20, 35], [0, 1], { extrapolateRight: 'clamp' }),
        }}>
          <SlamText text="close the video." appearAt={20} color={TC.red} size={64} />
        </div>
      </div>
    </>
  );
};

const WhatItIsNot: React.FC = () => {
  const { phaseFrame } = usePhase();
  const items = [
    "❌ does NOT predict prices",
    "❌ does NOT have live market data",
    "❌ is NOT a trading bot",
  ];
  return (
    <>
      <Backdrop />
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 24,
      }}>
        <div style={{
          fontFamily: TF.inter, fontSize: 28, color: TC.text, fontWeight: 700, marginBottom: 20,
        }}>
          Claude 4.7 …
        </div>
        {items.map((it, i) => {
          const start = i * 18;
          const opacity = interpolate(phaseFrame - start, [0, 14], [0, 1], { extrapolateRight: 'clamp' });
          const x = interpolate(phaseFrame - start, [0, 18], [-40, 0], { extrapolateRight: 'clamp' });
          return (
            <div key={i} style={{
              padding: '18px 32px', backgroundColor: TC.panel, borderRadius: 8,
              border: `2px solid ${TC.red}88`, boxShadow: `0 0 20px ${TC.red}33`,
              fontFamily: TF.mono, fontSize: 24, color: TC.text, opacity,
              transform: `translateX(${x}px)`, minWidth: 600,
            }}>
              {it}
            </div>
          );
        })}
      </div>
    </>
  );
};

const WhatItIs: React.FC = () => {
  const { phaseFrame } = usePhase();
  return (
    <>
      <Backdrop />
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 30, padding: '0 120px',
      }}>
        <div style={{
          fontFamily: TF.inter, fontSize: 28, color: TC.dim, fontWeight: 600,
          opacity: interpolate(phaseFrame, [0, 12], [0, 1], { extrapolateRight: 'clamp' }),
        }}>
          What it IS:
        </div>
        <SlamText text="The fastest reading & reasoning" appearAt={8} color={TC.text} size={56} />
        <SlamText text="assistant ever built." appearAt={22} color={TC.cyan} size={56} />
        {phaseFrame > 50 && (
          <div style={{
            marginTop: 20,
            fontFamily: TF.inter, fontSize: 22, color: TC.amber, fontWeight: 700,
            opacity: interpolate(phaseFrame - 50, [0, 18], [0, 1], { extrapolateRight: 'clamp' }),
            textAlign: 'center',
          }}>
            Used right → worth more than any signal service.
          </div>
        )}
      </div>
    </>
  );
};

export const TD02_PatternInterrupt: React.FC = () => (
  <Scene id="td02">
    <Phase id="scratch_warning"><ScratchWarning /></Phase>
    <Phase id="what_it_is_not"><WhatItIsNot /></Phase>
    <Phase id="what_it_is"><WhatItIs /></Phase>
  </Scene>
);
