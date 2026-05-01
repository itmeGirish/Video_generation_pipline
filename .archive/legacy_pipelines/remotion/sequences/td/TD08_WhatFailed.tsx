import React from 'react';
import { interpolate, spring, useVideoConfig } from 'remotion';
import { Scene, Phase, usePhase } from '../../storyboard/Scene';
import { TC, TF, Backdrop, Tag, SlamText, ClaudeChat, ClaudeAssistantMsg } from '../../components/td/primitives';

const IntroFailed: React.FC = () => (
  <>
    <Backdrop />
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 18,
    }}>
      <Tag color={TC.red}>EMBARRASSING SECTION</Tag>
      <SlamText text="Things I tried." appearAt={6} color={TC.text} size={48} />
      <SlamText text="That absolutely did not work." appearAt={20} color={TC.red} size={48} />
    </div>
  </>
);

const FailNiftyPredict: React.FC = () => {
  const { phaseFrame } = usePhase();
  return (
    <>
      <Backdrop />
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 24, padding: '0 80px',
      }}>
        <Tag color={TC.red}>FAIL #1 · PRICE PREDICTION</Tag>
        <div style={{
          fontFamily: TF.inter, fontSize: 28, color: TC.text, textAlign: 'center',
          opacity: interpolate(phaseFrame, [4, 16], [0, 1], { extrapolateRight: 'clamp' }),
        }}>
          "Where will Nifty close on Friday?"
        </div>
        <div style={{ width: 1100, marginTop: 12 }}>
          <ClaudeChat>
            <ClaudeAssistantMsg appearAt={20}>
              I don't have access to real-time market data and I cannot predict future prices.
              I can help you reason about scenarios, but I cannot tell you where Nifty will close.
            </ClaudeAssistantMsg>
          </ClaudeChat>
        </div>
        <div style={{
          fontFamily: TF.mono, fontSize: 18, color: TC.dim, fontStyle: 'italic', marginTop: 8,
          opacity: interpolate(phaseFrame, [70, 85], [0, 1], { extrapolateRight: 'clamp' }),
        }}>
          I knew it wouldn't work. I did it anyway. Don't be me.
        </div>
      </div>
    </>
  );
};

const FailCharts: React.FC = () => (
  <>
    <Backdrop />
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 22,
    }}>
      <Tag color={TC.red}>FAIL #2 · TECHNICAL ANALYSIS</Tag>
      <SlamText text="Claude can't see your chart." appearAt={6} color={TC.text} size={42} />
      <div style={{
        fontFamily: TF.inter, fontSize: 22, color: TC.dim, marginTop: 8, textAlign: 'center', maxWidth: 900,
      }}>
        Even with a screenshot, pattern recognition is mediocre.<br />
        Use real TA tools — TradingView, Trendlyne. Not this.
      </div>
    </div>
  </>
);

const FailNumbers: React.FC = () => {
  const { phaseFrame } = usePhase();
  return (
    <>
      <Backdrop />
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 18, padding: '0 80px',
      }}>
        <Tag color={TC.red}>FAIL #3 · TRUSTING THE NUMBERS</Tag>
        <div style={{
          padding: '20px 30px', backgroundColor: TC.panel, border: `2px solid ${TC.amber}`, borderRadius: 8,
          fontFamily: TF.mono, fontSize: 22, color: TC.text, maxWidth: 900,
          opacity: interpolate(phaseFrame, [4, 18], [0, 1], { extrapolateRight: 'clamp' }),
        }}>
          <span style={{ color: TC.dim }}>Claude:</span> "Infosys Q2 revenue was <span style={{ color: TC.green }}>₹38,000 crore</span>."
        </div>
        <div style={{
          padding: '20px 30px', backgroundColor: TC.panel, border: `2px solid ${TC.red}`, borderRadius: 8,
          fontFamily: TF.mono, fontSize: 22, color: TC.text, maxWidth: 900,
          opacity: interpolate(phaseFrame, [24, 38], [0, 1], { extrapolateRight: 'clamp' }),
        }}>
          <span style={{ color: TC.dim }}>Reality:</span> ₹37,000 crore. <strong style={{ color: TC.red }}>Off by ₹1,000 crore.</strong>
        </div>
        <div style={{
          marginTop: 16, fontFamily: TF.inter, fontSize: 26, color: TC.amber, fontWeight: 700,
          opacity: interpolate(phaseFrame, [48, 64], [0, 1], { extrapolateRight: 'clamp' }),
        }}>
          Verify every number before trading on it. Always.
        </div>
      </div>
    </>
  );
};

const TakeawayUseFor: React.FC = () => {
  const { phaseFrame } = usePhase();
  return (
    <>
      <Backdrop />
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 22,
      }}>
        <div style={{ display: 'flex', gap: 18 }}>
          {['READING', 'REASONING', 'PUSHING BACK'].map((w, i) => (
            <div key={i} style={{
              padding: '14px 26px', backgroundColor: `${TC.green}22`, border: `1.5px solid ${TC.green}`, borderRadius: 8,
              fontFamily: TF.mono, fontSize: 18, color: TC.green, fontWeight: 700, letterSpacing: 1,
              opacity: interpolate(phaseFrame - i * 8, [0, 14], [0, 1], { extrapolateRight: 'clamp' }),
            }}>
              ✓ {w}
            </div>
          ))}
        </div>
        <div style={{
          fontFamily: TF.inter, fontSize: 22, color: TC.dim, marginTop: 14,
          opacity: interpolate(phaseFrame, [40, 54], [0, 1], { extrapolateRight: 'clamp' }),
        }}>
          Not for…
        </div>
        <div style={{ display: 'flex', gap: 18 }}>
          {['DATA', 'PREDICTION', 'CHARTS'].map((w, i) => (
            <div key={i} style={{
              padding: '14px 26px', backgroundColor: `${TC.red}22`, border: `1.5px solid ${TC.red}`, borderRadius: 8,
              fontFamily: TF.mono, fontSize: 18, color: TC.red, fontWeight: 700, letterSpacing: 1,
              opacity: interpolate(phaseFrame - 50 - i * 8, [0, 14], [0, 1], { extrapolateRight: 'clamp' }),
            }}>
              ✗ {w}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export const TD08_WhatFailed: React.FC = () => (
  <Scene id="td08">
    <Phase id="intro_failed"><IntroFailed /></Phase>
    <Phase id="fail_nifty_predict"><FailNiftyPredict /></Phase>
    <Phase id="fail_charts"><FailCharts /></Phase>
    <Phase id="fail_numbers"><FailNumbers /></Phase>
    <Phase id="takeaway_use_for"><TakeawayUseFor /></Phase>
  </Scene>
);
