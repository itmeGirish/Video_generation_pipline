import React from 'react';
import { interpolate } from 'remotion';
import { Scene, Phase, usePhase } from '../../storyboard/Scene';
import {
  TC, TF, Backdrop, ClaudeChat, ClaudeUserMsg, ClaudeAssistantMsg, Tag, SlamText, Counter,
} from '../../components/td/primitives';

const CeoSpeech: React.FC = () => {
  const { phaseFrame } = usePhase();
  return (
    <>
      <Backdrop />
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 30,
      }}>
        <Tag color={TC.cyan}>USE CASE #2</Tag>
        <SlamText text="Earnings call transcripts." appearAt={6} color={TC.text} size={56} />
        {/* Speech bubbles fading from green → yellow → red */}
        <div style={{
          marginTop: 28, display: 'flex', flexDirection: 'column', gap: 14, width: 800,
          opacity: interpolate(phaseFrame, [22, 38], [0, 1], { extrapolateRight: 'clamp' }),
        }}>
          {[
            { color: TC.green, text: '"We expect strong double-digit growth."' },
            { color: TC.amber, text: '"We are comfortable with our trajectory."' },
            { color: TC.red,   text: '"It is hard to predict in this environment."' },
          ].map((b, i) => (
            <div key={i} style={{
              padding: '14px 22px', borderRadius: 8,
              backgroundColor: `${b.color}11`, border: `1.5px solid ${b.color}66`,
              fontFamily: TF.mono, fontSize: 18, color: b.color,
              opacity: interpolate(phaseFrame - 22 - i * 14, [0, 14], [0, 1], { extrapolateRight: 'clamp' }),
            }}>
              {b.text}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

const ResearchProof: React.FC = () => (
  <>
    <Backdrop />
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 18,
    }}>
      <Tag color={TC.amber}>STANFORD · 2012</Tag>
      <SlamText text="Hedging language predicts" appearAt={6} color={TC.text} size={44} />
      <SlamText text="future underperformance." appearAt={22} color={TC.amber} size={52} />
      <div style={{
        fontFamily: TF.mono, fontSize: 16, color: TC.dim, marginTop: 18, textAlign: 'center',
      }}>
        Larcker &amp; Zakolyukina · "Detecting Deceptive Discussions in Conference Calls"
      </div>
    </div>
  </>
);

const ThirtySecPromise: React.FC = () => (
  <>
    <Backdrop />
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 60,
    }}>
      <div style={{
        padding: '40px 60px', backgroundColor: TC.panel, border: `2px solid ${TC.dim}`, borderRadius: 10,
        textAlign: 'center',
      }}>
        <div style={{ fontFamily: TF.mono, fontSize: 13, color: TC.dim, letterSpacing: 2, marginBottom: 8 }}>
          YOU
        </div>
        <div style={{ fontFamily: TF.inter, fontSize: 84, fontWeight: 900, color: TC.dim }}>
          90<span style={{ fontSize: 36 }}>min</span>
        </div>
      </div>
      <div style={{ fontFamily: TF.inter, fontSize: 60, color: TC.cyan }}>vs</div>
      <div style={{
        padding: '40px 60px', backgroundColor: TC.panel, border: `3px solid ${TC.green}`, borderRadius: 10,
        textAlign: 'center', boxShadow: `0 0 40px ${TC.green}66`,
      }}>
        <div style={{ fontFamily: TF.mono, fontSize: 13, color: TC.green, letterSpacing: 2, marginBottom: 8 }}>
          CLAUDE
        </div>
        <div style={{ fontFamily: TF.inter, fontSize: 84, fontWeight: 900, color: TC.green }}>
          <Counter from={90} to={30} startFrame={6} duration={30} /><span style={{ fontSize: 36 }}>sec</span>
        </div>
      </div>
    </div>
  </>
);

const PromptDemo: React.FC = () => (
  <>
    <Backdrop />
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center',
      alignItems: 'center', padding: '0 80px',
    }}>
      <div style={{ width: 1200 }}>
        <ClaudeChat>
          <ClaudeUserMsg appearAt={5}>
            This is INFY's Q3 earnings call transcript.<br />
            1. Compare guidance language vs last quarter.<br />
            2. Flag every evaded question.<br />
            3. Identify NEW phrases not in last quarter's call.<br />
            <strong>Quote exact phrases.</strong>
          </ClaudeUserMsg>
          <ClaudeAssistantMsg appearAt={36}>
            <strong style={{ color: TC.amber }}>⚠ Confidence shift detected:</strong><br />
            <span style={{ color: TC.dim }}>Last quarter:</span> <em style={{ color: TC.green }}>"strong double-digit growth"</em><br />
            <span style={{ color: TC.dim }}>This quarter:</span> <em style={{ color: TC.amber }}>"comfortable with our trajectory"</em><br /><br />
            <strong style={{ color: TC.red }}>2 evaded questions:</strong> margin guidance, BFSI segment outlook.
          </ClaudeAssistantMsg>
        </ClaudeChat>
      </div>
    </div>
  </>
);

const LanguageShift: React.FC = () => {
  const { phaseFrame } = usePhase();
  return (
    <>
      <Backdrop />
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 24,
      }}>
        <Tag color={TC.amber}>THE LANGUAGE SHIFT</Tag>
        <div style={{
          padding: '24px 32px', backgroundColor: TC.panel, border: `2px solid ${TC.green}`, borderRadius: 8,
          fontFamily: TF.inter, fontSize: 24, color: TC.green, fontStyle: 'italic',
          opacity: interpolate(phaseFrame, [4, 18], [0, 1], { extrapolateRight: 'clamp' }), maxWidth: 900,
        }}>
          Q2: "We expect <strong>strong double-digit growth</strong>."
        </div>
        <div style={{
          fontFamily: TF.inter, fontSize: 48, color: TC.amber, fontWeight: 900,
          opacity: interpolate(phaseFrame, [24, 32], [0, 1], { extrapolateRight: 'clamp' }),
        }}>
          ↓
        </div>
        <div style={{
          padding: '24px 32px', backgroundColor: TC.panel, border: `2px solid ${TC.amber}`, borderRadius: 8,
          fontFamily: TF.inter, fontSize: 24, color: TC.amber, fontStyle: 'italic',
          opacity: interpolate(phaseFrame, [32, 46], [0, 1], { extrapolateRight: 'clamp' }), maxWidth: 900,
          boxShadow: `0 0 20px ${TC.amber}44`,
        }}>
          Q3: "We're <strong>comfortable with our trajectory</strong>."
        </div>
      </div>
    </>
  );
};

const NudgeTakeaway: React.FC = () => (
  <>
    <Backdrop />
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 18,
    }}>
      <SlamText text="Not a signal." appearAt={4} color={TC.dim} size={48} />
      <SlamText text="A nudge." appearAt={20} color={TC.cyan} size={88} />
    </div>
  </>
);

export const TD06_EarningsCall: React.FC = () => (
  <Scene id="td06">
    <Phase id="ceo_speech"><CeoSpeech /></Phase>
    <Phase id="research_proof"><ResearchProof /></Phase>
    <Phase id="thirty_sec_promise"><ThirtySecPromise /></Phase>
    <Phase id="prompt_demo"><PromptDemo /></Phase>
    <Phase id="language_shift"><LanguageShift /></Phase>
    <Phase id="nudge_takeaway"><NudgeTakeaway /></Phase>
  </Scene>
);
