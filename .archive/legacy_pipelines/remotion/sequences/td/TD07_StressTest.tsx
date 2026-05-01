import React from 'react';
import { interpolate, spring, useVideoConfig } from 'remotion';
import { Scene, Phase, usePhase } from '../../storyboard/Scene';
import {
  TC, TF, Backdrop, ClaudeChat, ClaudeUserMsg, ClaudeAssistantMsg, Tag, SlamText, PnLSlam,
} from '../../components/td/primitives';

const RevealOne: React.FC = () => (
  <>
    <Backdrop />
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 24,
    }}>
      <Tag color={TC.amber}>USE CASE #1</Tag>
      <SlamText text="The one I use most." appearAt={6} color={TC.text} size={56} />
      <SlamText text="The one I wish I'd known a year ago." appearAt={22} color={TC.amber} size={42} />
    </div>
  </>
);

const ArgueAgainst: React.FC = () => {
  const { phaseFrame } = usePhase();
  return (
    <>
      <Backdrop />
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 26,
      }}>
        <SlamText text="Pre-Trade Stress Test" appearAt={4} color={TC.cyan} size={64} />
        <div style={{
          fontFamily: TF.inter, fontSize: 26, color: TC.text, marginTop: 16,
          opacity: interpolate(phaseFrame, [22, 38], [0, 1], { extrapolateRight: 'clamp' }),
        }}>
          Tell Claude what you're about to do.
        </div>
        <div style={{
          fontFamily: TF.inter, fontSize: 32, color: TC.red, fontWeight: 900,
          opacity: interpolate(phaseFrame, [42, 58], [0, 1], { extrapolateRight: 'clamp' }),
        }}>
          Ask it to argue AGAINST you.
        </div>
        <div style={{
          fontFamily: TF.mono, fontSize: 18, color: TC.dim, marginTop: 12,
          opacity: interpolate(phaseFrame, [62, 78], [0, 1], { extrapolateRight: 'clamp' }),
        }}>
          Not validate. Argue.
        </div>
      </div>
    </>
  );
};

const PromptDemo: React.FC = () => (
  <>
    <Backdrop />
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center',
      alignItems: 'center', padding: '0 80px',
    }}>
      <div style={{ width: 1280 }}>
        <ClaudeChat>
          <ClaudeUserMsg appearAt={5}>
            I'm about to buy <strong>ADANIENT</strong> at <strong>₹2,380</strong>.<br />
            Thesis: oversold bounce + sector rotation.<br />
            Stop loss: ₹2,260. Target: ₹2,580.<br /><br />
            Act as a skeptical PM. Push back hard.
          </ClaudeUserMsg>
          <ClaudeAssistantMsg appearAt={45}>
            <strong style={{ color: TC.red }}>3 arguments AGAINST:</strong><br />
            • Group leverage still elevated; one bad headline reprices it 10%.<br />
            • "Oversold bounce" needs volume confirmation — yours doesn't have it.<br />
            • You're already overweight infra-adjacent names.<br /><br />
            <strong style={{ color: TC.amber }}>Question for you:</strong> what catalyst makes this re-rate in 3 weeks?
          </ClaudeAssistantMsg>
        </ClaudeChat>
      </div>
    </div>
  </>
);

const ToneShift: React.FC = () => (
  <>
    <Backdrop />
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 18,
    }}>
      <SlamText text="The part I wasn't going to share." appearAt={4} color={TC.dim} size={36} />
      <SlamText text="But it's the most important beat." appearAt={26} color={TC.text} size={48} />
    </div>
  </>
);

const Day11Conversation: React.FC = () => {
  const { phaseFrame } = usePhase();
  return (
    <>
      <Backdrop />
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center',
        alignItems: 'center', padding: '0 80px',
      }}>
        <div style={{ width: 1280 }}>
          <div style={{
            fontFamily: TF.mono, fontSize: 14, color: TC.amber, letterSpacing: 4, marginBottom: 16, textAlign: 'center',
            opacity: interpolate(phaseFrame, [0, 12], [0, 1], { extrapolateRight: 'clamp' }),
          }}>
            DAY 11 · ADANIENT
          </div>
          <ClaudeChat>
            <ClaudeAssistantMsg appearAt={10}>
              I wouldn't take this trade. Three flags:<br />
              valuation, missing catalyst, exposure concentration.
            </ClaudeAssistantMsg>
            <ClaudeUserMsg appearAt={50}>
              Yeah fine, I still want to take it.<br />
              <span style={{ color: TC.red }}>Convince me I'm right instead.</span>
            </ClaudeUserMsg>
            <ClaudeAssistantMsg appearAt={80}>
              <span style={{ color: TC.dim }}>If you must…</span> a contrarian bullish read could lean on…
            </ClaudeAssistantMsg>
          </ClaudeChat>
        </div>
      </div>
    </>
  );
};

const PnlLoss: React.FC = () => {
  const { phaseFrame } = usePhase();
  return (
    <>
      <Backdrop />
      {/* Mock Zerodha closed position */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 24,
      }}>
        <div style={{
          fontFamily: TF.mono, fontSize: 14, color: TC.dim, letterSpacing: 4,
          opacity: interpolate(phaseFrame, [0, 10], [0, 1], { extrapolateRight: 'clamp' }),
        }}>
          ZERODHA · CLOSED POSITION · ADANIENT
        </div>
        <PnLSlam amount="−₹8,400" appearAt={10} />
        {phaseFrame > 50 && (
          <div style={{
            marginTop: 16, fontFamily: TF.mono, fontSize: 18, color: TC.dim,
            opacity: interpolate(phaseFrame - 50, [0, 18], [0, 1], { extrapolateRight: 'clamp' }),
          }}>
            entry ₹2,380.00  →  exit ₹2,240.00
          </div>
        )}
      </div>
    </>
  );
};

const Lesson: React.FC = () => {
  const { phaseFrame } = usePhase();
  return (
    <>
      <Backdrop />
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 22, padding: '0 120px',
      }}>
        <div style={{
          fontFamily: TF.inter, fontSize: 28, color: TC.text, textAlign: 'center', lineHeight: 1.4,
          opacity: interpolate(phaseFrame, [0, 16], [0, 1], { extrapolateRight: 'clamp' }),
        }}>
          Claude wasn't right. I wasn't wrong.
        </div>
        <div style={{
          fontFamily: TF.inter, fontSize: 36, color: TC.amber, fontWeight: 900, textAlign: 'center',
          opacity: interpolate(phaseFrame, [22, 38], [0, 1], { extrapolateRight: 'clamp' }),
        }}>
          Claude was asking the right questions.
        </div>
        <div style={{
          fontFamily: TF.inter, fontSize: 32, color: TC.red, fontWeight: 700, textAlign: 'center',
          opacity: interpolate(phaseFrame, [44, 60], [0, 1], { extrapolateRight: 'clamp' }),
        }}>
          I didn't have good answers. I took the trade anyway.
        </div>
      </div>
    </>
  );
};

const DoThisOne: React.FC = () => (
  <>
    <Backdrop />
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 22,
    }}>
      <SlamText text="The cheapest second opinion" appearAt={4} color={TC.text} size={52} />
      <SlamText text="I've ever had." appearAt={22} color={TC.cyan} size={64} />
      <div style={{ marginTop: 24 }}>
        <Tag color={TC.amber}>IF YOU DO ONE THING — DO THIS ONE</Tag>
      </div>
    </div>
  </>
);

export const TD07_StressTest: React.FC = () => (
  <Scene id="td07">
    <Phase id="reveal_one"><RevealOne /></Phase>
    <Phase id="argue_against"><ArgueAgainst /></Phase>
    <Phase id="prompt_demo"><PromptDemo /></Phase>
    <Phase id="tone_shift"><ToneShift /></Phase>
    <Phase id="day_11_conversation"><Day11Conversation /></Phase>
    <Phase id="pnl_loss"><PnlLoss /></Phase>
    <Phase id="lesson"><Lesson /></Phase>
    <Phase id="do_this_one"><DoThisOne /></Phase>
  </Scene>
);
