import React from 'react';
import { interpolate } from 'remotion';
import { Scene, Phase, usePhase } from '../../storyboard/Scene';
import { TC, TF, Backdrop, Typewriter, Calendar30, SlamText, Tag } from '../../components/td/primitives';

const HookCursor: React.FC = () => {
  const { phaseFrame } = usePhase();
  return (
    <>
      <Backdrop />
      {/* Mock Zerodha trade screen with hovering cursor */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: 720, padding: '40px 60px', backgroundColor: TC.panel,
          border: `1px solid ${TC.panel2}`, borderRadius: 12,
          boxShadow: `0 0 40px rgba(0,0,0,0.6)`,
        }}>
          <div style={{
            fontFamily: TF.mono, fontSize: 12, color: TC.dim, letterSpacing: 2, marginBottom: 14,
          }}>
            ZERODHA · KITE
          </div>
          <div style={{ fontFamily: TF.inter, fontSize: 36, color: TC.text, fontWeight: 700, marginBottom: 8 }}>
            RELIANCE
          </div>
          <div style={{ fontFamily: TF.mono, fontSize: 28, color: TC.green, marginBottom: 30 }}>
            ₹ 2,847.50  <span style={{ color: TC.dim, fontSize: 18 }}>+1.2%</span>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{
              flex: 1, padding: '18px 0', backgroundColor: TC.green, color: '#000',
              fontFamily: TF.inter, fontSize: 22, fontWeight: 900, letterSpacing: 2, textAlign: 'center',
              borderRadius: 6, position: 'relative',
            }}>
              BUY
              {/* Cursor hovering, then pulling away */}
              <div style={{
                position: 'absolute',
                left: interpolate(phaseFrame, [10, 60, 90], [120, 100, 200], { extrapolateRight: 'clamp' }),
                top: interpolate(phaseFrame, [10, 60, 90], [-20, 10, -40], { extrapolateRight: 'clamp' }),
                width: 24, height: 24, transition: 'all 0.3s',
              }}>
                <svg viewBox="0 0 24 24" fill={TC.text} stroke="#000" strokeWidth="1">
                  <path d="M2 2 L2 18 L7 14 L10 22 L13 21 L10 13 L17 13 Z" />
                </svg>
              </div>
            </div>
            <div style={{
              flex: 1, padding: '18px 0', backgroundColor: TC.panel2, color: TC.text,
              fontFamily: TF.inter, fontSize: 22, fontWeight: 900, letterSpacing: 2, textAlign: 'center',
              borderRadius: 6,
            }}>
              SELL
            </div>
          </div>
        </div>
      </div>
      {/* Lower-third caption */}
      {phaseFrame > 30 && (
        <div style={{
          position: 'absolute', bottom: 180, left: 0, right: 0, textAlign: 'center',
          fontFamily: TF.mono, fontSize: 16, color: TC.cyan, letterSpacing: 3,
          opacity: interpolate(phaseFrame - 30, [0, 12], [0, 1], { extrapolateRight: 'clamp' }),
        }}>
          BEFORE I PLACE THIS TRADE…
        </div>
      )}
    </>
  );
};

const CalendarCallouts: React.FC = () => {
  const { phaseFrame } = usePhase();
  return (
    <>
      <Backdrop />
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 30, padding: '0 100px',
      }}>
        <div style={{
          fontFamily: TF.inter, fontSize: 28, color: TC.text, fontWeight: 700, letterSpacing: 1,
        }}>
          30 DAYS · CLAUDE 4.7 + EVERY TRADE
        </div>
        <Calendar30
          callouts={{
            4:  { text: "caught a red flag",          color: TC.green },
            11: { text: "ignored Claude → -₹8,400",   color: TC.red },
            19: { text: "found a pattern I'd missed", color: TC.amber },
          }}
          appearAt={5}
        />
        {/* Callout legends */}
        {phaseFrame > 60 && (
          <div style={{
            display: 'flex', gap: 30,
            opacity: interpolate(phaseFrame - 60, [0, 18], [0, 1], { extrapolateRight: 'clamp' }),
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: TF.mono, fontSize: 15, color: TC.text }}>
              <div style={{ width: 14, height: 14, backgroundColor: TC.green, borderRadius: 3 }} />
              Day 4 — caught a red flag
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: TF.mono, fontSize: 15, color: TC.text }}>
              <div style={{ width: 14, height: 14, backgroundColor: TC.red, borderRadius: 3 }} />
              Day 11 — ignored Claude, lost ₹8,400
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: TF.mono, fontSize: 15, color: TC.text }}>
              <div style={{ width: 14, height: 14, backgroundColor: TC.amber, borderRadius: 3 }} />
              Day 19 — pattern I'd missed
            </div>
          </div>
        )}
      </div>
    </>
  );
};

const TitleCard: React.FC = () => {
  const { phaseFrame } = usePhase();
  return (
    <>
      <Backdrop />
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 24,
      }}>
        <div style={{
          fontFamily: TF.mono, fontSize: 14, color: TC.cyan, letterSpacing: 4,
          opacity: interpolate(phaseFrame, [0, 15], [0, 1], { extrapolateRight: 'clamp' }),
        }}>
          A 30-DAY EXPERIMENT
        </div>
        <SlamText text="CLAUDE 4.7" appearAt={6} color={TC.claude} size={120} />
        <SlamText text="FOR TRADING" appearAt={20} color={TC.text} size={96} />
        {phaseFrame > 40 && (
          <div style={{
            opacity: interpolate(phaseFrame - 40, [0, 18], [0, 1], { extrapolateRight: 'clamp' }),
            display: 'flex', gap: 20, marginTop: 14,
          }}>
            <Tag color={TC.green}>30 DAYS</Tag>
            <Tag color={TC.amber}>REAL TRADES</Tag>
            <Tag color={TC.red}>HONEST RESULTS</Tag>
          </div>
        )}
      </div>
    </>
  );
};

export const TD01_ColdOpen: React.FC = () => (
  <Scene id="td01">
    <Phase id="hook_cursor"><HookCursor /></Phase>
    <Phase id="calendar_callouts"><CalendarCallouts /></Phase>
    <Phase id="title_card"><TitleCard /></Phase>
  </Scene>
);
