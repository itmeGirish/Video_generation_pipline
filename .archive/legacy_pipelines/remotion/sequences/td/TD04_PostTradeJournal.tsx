import React from 'react';
import { interpolate } from 'remotion';
import { Scene, Phase, usePhase } from '../../storyboard/Scene';
import {
  TC, TF, Backdrop, ZerodhaPanel, PnLRow, ClaudeChat, ClaudeUserMsg, ClaudeAssistantMsg, Tag, SlamText, Counter,
} from '../../components/td/primitives';

const TRADES: Array<{ ticker: string; entry: number; exit: number; pnl: number; hold: number; date: string; pulse?: boolean }> = [
  { ticker: 'RELIANCE',   entry: 2845.0, exit: 2871.0, pnl:  +260, hold: 2,  date: '02 Apr' },
  { ticker: 'TATAMOTORS', entry:  982.5, exit:  945.0, pnl:  -750, hold: 14, date: '04 Apr', pulse: true },
  { ticker: 'INFY',       entry: 1556.0, exit: 1569.0, pnl:  +130, hold: 1,  date: '05 Apr' },
  { ticker: 'HDFCBANK',   entry: 1690.0, exit: 1640.0, pnl: -1500, hold: 11, date: '08 Apr', pulse: true },
  { ticker: 'ITC',        entry:  455.0, exit:  462.0, pnl:  +280, hold: 3,  date: '10 Apr' },
  { ticker: 'ADANIENT',   entry: 2380.0, exit: 2240.0, pnl: -8400, hold: 18, date: '11 Apr', pulse: true },
];

const TradeHistoryIntro: React.FC = () => (
  <>
    <Backdrop />
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 24,
    }}>
      <Tag color={TC.cyan}>USE CASE #4</Tag>
      <SlamText text="Your own trade history" appearAt={6} color={TC.text} size={56} />
      <div style={{ marginTop: 20, width: 760 }}>
        <ZerodhaPanel>
          {TRADES.map((t, i) => <PnLRow key={i} {...t} />)}
        </ZerodhaPanel>
      </div>
    </div>
  </>
);

const PromptDemo: React.FC = () => {
  const { phaseFrame } = usePhase();
  return (
    <>
      <Backdrop />
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center',
        alignItems: 'center', padding: '0 80px',
      }}>
        <div style={{ width: 1200 }}>
          <ClaudeChat>
            <ClaudeUserMsg appearAt={5}>
              Here are my last 30 trades. Analyze:<br />
              1. What setups do losing trades have in common?<br />
              2. What holding period works best for winners?<br />
              3. What's my single biggest mistake?<br />
              <strong>Be blunt.</strong>
            </ClaudeUserMsg>
            <ClaudeAssistantMsg appearAt={40}>
              You're exiting winners in <strong style={{ color: TC.green }}>2 days</strong> but holding losers for{' '}
              <strong style={{ color: TC.red }}>14 days</strong>.<br />
              You trade most frequently on <strong>Fridays</strong> — also your lowest win rate.<br />
              Biggest mistake: <em>"hope" exits.</em> You let losers run because you don't want to admit you were wrong.
            </ClaudeAssistantMsg>
          </ClaudeChat>
        </div>
      </div>
    </>
  );
};

const BlindSpot: React.FC = () => {
  const { phaseFrame } = usePhase();
  return (
    <>
      <Backdrop />
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 18,
      }}>
        <Tag color={TC.amber}>DAY 1 INSIGHT</Tag>
        <SlamText text="The basic mistake I'd been" appearAt={6} color={TC.text} size={42} />
        <SlamText text="making for a year." appearAt={18} color={TC.amber} size={56} />
        <div style={{
          marginTop: 30,
          fontFamily: TF.mono, fontSize: 22, color: TC.dim,
          opacity: interpolate(phaseFrame, [40, 55], [0, 1], { extrapolateRight: 'clamp' }),
        }}>
          What my broker's analytics never told me.
        </div>
      </div>
    </>
  );
};

const StatsCallout: React.FC = () => {
  const { phaseFrame } = usePhase();
  return (
    <>
      <Backdrop />
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 32,
      }}>
        <div style={{ display: 'flex', gap: 50 }}>
          <div style={{
            padding: '40px 60px', backgroundColor: TC.panel, border: `2px solid ${TC.green}`,
            borderRadius: 10, boxShadow: `0 0 30px ${TC.green}66`, textAlign: 'center',
          }}>
            <div style={{ fontFamily: TF.mono, fontSize: 14, color: TC.green, letterSpacing: 2, marginBottom: 8 }}>
              AVG WINNER
            </div>
            <div style={{ fontFamily: TF.inter, fontSize: 96, fontWeight: 900, color: TC.green, lineHeight: 1 }}>
              <Counter from={0} to={2.1} startFrame={5} duration={30} format={(n) => n.toFixed(1)} />
            </div>
            <div style={{ fontFamily: TF.mono, fontSize: 16, color: TC.dim, marginTop: 6 }}>days held</div>
          </div>
          <div style={{
            padding: '40px 60px', backgroundColor: TC.panel, border: `2px solid ${TC.red}`,
            borderRadius: 10, boxShadow: `0 0 30px ${TC.red}66`, textAlign: 'center',
          }}>
            <div style={{ fontFamily: TF.mono, fontSize: 14, color: TC.red, letterSpacing: 2, marginBottom: 8 }}>
              AVG LOSER
            </div>
            <div style={{ fontFamily: TF.inter, fontSize: 96, fontWeight: 900, color: TC.red, lineHeight: 1 }}>
              <Counter from={0} to={14} startFrame={20} duration={40} />
            </div>
            <div style={{ fontFamily: TF.mono, fontSize: 16, color: TC.dim, marginTop: 6 }}>days held</div>
          </div>
        </div>
        {phaseFrame > 70 && (
          <div style={{
            marginTop: 24, fontFamily: TF.inter, fontSize: 24, color: TC.amber, fontWeight: 700,
            opacity: interpolate(phaseFrame - 70, [0, 18], [0, 1], { extrapolateRight: 'clamp' }),
          }}>
            7× longer on losses than winners.
          </div>
        )}
      </div>
    </>
  );
};

const Takeaway: React.FC = () => (
  <>
    <Backdrop />
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 20,
    }}>
      <Tag color={TC.cyan}>10 MINUTES · ONCE A MONTH</Tag>
      <SlamText text="If you do nothing else…" appearAt={6} color={TC.text} size={48} />
      <SlamText text="at least do this once." appearAt={20} color={TC.cyan} size={56} />
    </div>
  </>
);

export const TD04_PostTradeJournal: React.FC = () => (
  <Scene id="td04">
    <Phase id="trade_history_intro"><TradeHistoryIntro /></Phase>
    <Phase id="prompt_demo"><PromptDemo /></Phase>
    <Phase id="blind_spot"><BlindSpot /></Phase>
    <Phase id="stats_callout"><StatsCallout /></Phase>
    <Phase id="takeaway"><Takeaway /></Phase>
  </Scene>
);
