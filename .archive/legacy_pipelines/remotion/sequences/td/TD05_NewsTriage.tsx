import React from 'react';
import { interpolate } from 'remotion';
import { Scene, Phase, usePhase } from '../../storyboard/Scene';
import {
  TC, TF, Backdrop, Headline, ClaudeChat, ClaudeUserMsg, ClaudeAssistantMsg, Tag, SlamText, Counter,
} from '../../components/td/primitives';

const HEADLINES_PREVIEW = [
  'RBI cuts repo rate by 25 bps',
  'Tata Motors recalls 50,000 vehicles',
  'Infosys wins $200M deal with European bank',
  'Bollywood box office sees 12% rise this quarter',
  'Adani Group denies regulator allegations',
  'Reliance Jio launches new 5G plans',
  'Asian Paints Q3 EBITDA beats estimates',
  'Mumbai monsoon expected to arrive June 5',
  'BTC crosses $108,000 mark globally',
  'L&T bags ₹4,500 cr defense contract',
];

const HeadlinesFlood: React.FC = () => {
  const { phaseFrame } = usePhase();
  return (
    <>
      <Backdrop />
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 24,
      }}>
        <Tag color={TC.cyan}>USE CASE #3</Tag>
        <SlamText text="News triage" appearAt={6} color={TC.text} size={64} />
        <div style={{
          marginTop: 20, display: 'flex', alignItems: 'center', gap: 20,
          opacity: interpolate(phaseFrame, [20, 35], [0, 1], { extrapolateRight: 'clamp' }),
        }}>
          <div style={{
            fontFamily: TF.inter, fontSize: 80, fontWeight: 900, color: TC.amber, lineHeight: 1,
          }}>
            <Counter from={0} to={50000} startFrame={20} duration={45} />
          </div>
          <div style={{ fontFamily: TF.mono, fontSize: 18, color: TC.text, lineHeight: 1.4 }}>
            financial news stories<br />
            <span style={{ color: TC.dim }}>published every Monday morning</span>
          </div>
        </div>
        {phaseFrame > 70 && (
          <div style={{
            marginTop: 24, fontFamily: TF.inter, fontSize: 26, color: TC.text,
            opacity: interpolate(phaseFrame - 70, [0, 18], [0, 1], { extrapolateRight: 'clamp' }),
          }}>
            You own 10 stocks. <span style={{ color: TC.cyan, fontWeight: 700 }}>Which 3 actually matter?</span>
          </div>
        )}
      </div>
    </>
  );
};

const PromptSort: React.FC = () => {
  const { phaseFrame } = usePhase();
  return (
    <>
      <Backdrop />
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center',
        alignItems: 'center', padding: '0 80px',
      }}>
        <div style={{ width: 1280 }}>
          <ClaudeChat>
            <ClaudeUserMsg appearAt={5}>
              I own: RELIANCE, HDFCBANK, INFY, TATAMOTORS, ITC, ASIANPAINT, BAJFINANCE, ADANIENT, ICICIBANK, LT.<br />
              Sort today's 40 headlines into MATERIAL / CONTEXT / NOISE.
            </ClaudeUserMsg>
            <ClaudeAssistantMsg appearAt={35}>
              <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                <div style={{ flex: 1 }}>
                  <Headline text="RBI cuts repo rate by 25 bps" tag="MATERIAL" appearAt={50} />
                  <Headline text="Tata Motors recalls 50,000 vehicles" tag="MATERIAL" appearAt={60} />
                  <Headline text="Infosys wins $200M EU bank deal" tag="MATERIAL" appearAt={70} />
                  <Headline text="Asian Paints Q3 EBITDA beats" tag="MATERIAL" appearAt={80} />
                </div>
              </div>
            </ClaudeAssistantMsg>
          </ClaudeChat>
        </div>
      </div>
    </>
  );
};

const ReplacesScroll: React.FC = () => {
  const { phaseFrame } = usePhase();
  return (
    <>
      <Backdrop />
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 24,
      }}>
        <SlamText text="10 minutes every morning" appearAt={4} color={TC.text} size={48} />
        <div style={{
          fontFamily: TF.inter, fontSize: 22, color: TC.dim,
          opacity: interpolate(phaseFrame, [22, 35], [0, 1], { extrapolateRight: 'clamp' }),
        }}>
          replaces an hour of scrolling
        </div>
        <div style={{
          marginTop: 16, display: 'flex', gap: 16,
          opacity: interpolate(phaseFrame, [40, 55], [0, 1], { extrapolateRight: 'clamp' }),
        }}>
          <Tag color={TC.dim}>Moneycontrol</Tag>
          <Tag color={TC.dim}>Bloomberg</Tag>
          <Tag color={TC.dim}>ET Markets</Tag>
        </div>
      </div>
    </>
  );
};

const ContextUnderstanding: React.FC = () => {
  const { phaseFrame } = usePhase();
  const examples = [
    { news: 'RBI cuts repo rate', ticker: 'HDFCBANK', why: 'lower rates → cheaper deposits' },
    { news: 'Tata Motors recall 50K cars', ticker: 'TATAMOTORS', why: 'real warranty hit, Q4 margin pressure' },
    { news: 'Tata Motors new SUV launch', ticker: 'TATAMOTORS', why: 'less material, marketing noise', muted: true },
  ];
  return (
    <>
      <Backdrop />
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 18, padding: '0 100px',
      }}>
        <Tag color={TC.cyan}>CLAUDE UNDERSTANDS CONTEXT</Tag>
        {examples.map((ex, i) => {
          const start = 14 + i * 20;
          const opacity = interpolate(phaseFrame - start, [0, 14], [0, ex.muted ? 0.55 : 1], { extrapolateRight: 'clamp' });
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 18, padding: '14px 22px',
              backgroundColor: TC.panel, border: `1px solid ${ex.muted ? TC.dim : TC.green}66`, borderRadius: 8,
              opacity, width: 1100,
            }}>
              <div style={{
                fontFamily: TF.mono, fontSize: 13, color: ex.muted ? TC.dim : TC.green,
                minWidth: 130, fontWeight: 700,
              }}>
                {ex.ticker}
              </div>
              <div style={{ flex: 1, fontFamily: TF.inter, fontSize: 17, color: TC.text }}>
                <span style={{ color: TC.text, fontWeight: 600 }}>{ex.news}</span>
                <span style={{ color: TC.dim }}> — {ex.why}</span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

const ComparisonStat: React.FC = () => {
  const { phaseFrame } = usePhase();
  return (
    <>
      <Backdrop />
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 60,
      }}>
        <div style={{
          padding: '40px 60px', backgroundColor: TC.panel, border: `2px solid ${TC.dim}`, borderRadius: 10,
          textAlign: 'center', opacity: interpolate(phaseFrame, [0, 16], [0, 1], { extrapolateRight: 'clamp' }),
        }}>
          <div style={{ fontFamily: TF.mono, fontSize: 13, color: TC.dim, letterSpacing: 2, marginBottom: 10 }}>
            OLD KEYWORD ALERTS
          </div>
          <div style={{ fontFamily: TF.inter, fontSize: 84, fontWeight: 900, color: TC.dim }}>
            <Counter from={0} to={500} startFrame={10} duration={30} />
          </div>
          <div style={{ fontFamily: TF.mono, fontSize: 14, color: TC.dim, marginTop: 4 }}>matches</div>
        </div>
        <div style={{ fontFamily: TF.inter, fontSize: 60, color: TC.cyan, fontWeight: 900 }}>→</div>
        <div style={{
          padding: '40px 60px', backgroundColor: TC.panel, border: `3px solid ${TC.green}`, borderRadius: 10,
          textAlign: 'center', boxShadow: `0 0 40px ${TC.green}66`,
          opacity: interpolate(phaseFrame, [25, 45], [0, 1], { extrapolateRight: 'clamp' }),
        }}>
          <div style={{ fontFamily: TF.mono, fontSize: 13, color: TC.green, letterSpacing: 2, marginBottom: 10 }}>
            CLAUDE 4.7
          </div>
          <div style={{ fontFamily: TF.inter, fontSize: 84, fontWeight: 900, color: TC.green }}>
            <Counter from={0} to={4} startFrame={35} duration={20} />
          </div>
          <div style={{ fontFamily: TF.mono, fontSize: 14, color: TC.dim, marginTop: 4 }}>that matter</div>
        </div>
      </div>
    </>
  );
};

const ClosingBeat: React.FC = () => (
  <>
    <Backdrop />
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 18,
    }}>
      <Tag color={TC.amber}>DAILY VALUE FOR EVERY RETAIL TRADER</Tag>
      <SlamText text="One prompt. Ten minutes." appearAt={6} color={TC.text} size={48} />
      <SlamText text="Whole morning saved." appearAt={22} color={TC.cyan} size={56} />
    </div>
  </>
);

export const TD05_NewsTriage: React.FC = () => (
  <Scene id="td05">
    <Phase id="headlines_flood"><HeadlinesFlood /></Phase>
    <Phase id="prompt_sort"><PromptSort /></Phase>
    <Phase id="replaces_scroll"><ReplacesScroll /></Phase>
    <Phase id="context_understanding"><ContextUnderstanding /></Phase>
    <Phase id="comparison_stat"><ComparisonStat /></Phase>
    <Phase id="closing_beat"><ClosingBeat /></Phase>
  </Scene>
);
