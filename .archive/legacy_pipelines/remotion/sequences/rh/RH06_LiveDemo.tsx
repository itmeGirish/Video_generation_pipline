import React from 'react';
import { interpolate, spring, useVideoConfig } from 'remotion';
import { Scene, Phase, usePhase } from '../../storyboard/Scene';
import { C, F, Starfield, ClaudeOrb, StampX } from '../../components/rh/primitives';

const Task: React.FC = () => (
  <div style={{
    position: 'absolute', top: 40, left: 0, right: 0, textAlign: 'center', zIndex: 2,
  }}>
    <div style={{
      display: 'inline-block', padding: '14px 24px', borderRadius: 10,
      backgroundColor: '#101520', border: `1.5px solid ${C.cyan}`,
      fontFamily: F.mono, fontSize: 18, color: C.text, maxWidth: 1400,
    }}>
      Find me the cheapest flight Mumbai to Tokyo next weekend. Draft the email to my manager.
    </div>
  </div>
);

const Divider: React.FC = () => (
  <div style={{
    position: 'absolute', top: 140, bottom: 60, left: '50%', width: 2,
    backgroundColor: C.cyan, opacity: 0.4, zIndex: 1,
  }} />
);

// Phase timings are auto-managed via <Phase>. Each sub-component owns its visual state.

const TaskSetup: React.FC = () => (
  <>
    <Starfield />
    <Task />
    <Divider />
    <div style={{
      position: 'absolute', left: 80, top: 160,
      fontFamily: F.mono, fontSize: 14, color: C.cyan, letterSpacing: 2, zIndex: 1,
    }}>NO HARNESS</div>
    <div style={{
      position: 'absolute', right: 80, top: 160,
      fontFamily: F.mono, fontSize: 14, color: C.cyan, letterSpacing: 2, zIndex: 1, textAlign: 'right',
    }}>WITH HARNESS</div>
    <ClaudeOrb x={480} y={540} size={120} />
    <ClaudeOrb x={1440} y={540} size={120} />
  </>
);

const LeftPanelFail: React.FC = () => {
  const { phaseFrame } = usePhase();
  return (
    <>
      <Starfield />
      <Task />
      <Divider />
      <div style={{
        position: 'absolute', left: 80, top: 160,
        fontFamily: F.mono, fontSize: 14, color: C.cyan, letterSpacing: 2, zIndex: 1,
      }}>NO HARNESS</div>
      <div style={{
        position: 'absolute', right: 80, top: 160,
        fontFamily: F.mono, fontSize: 14, color: C.cyan, letterSpacing: 2, zIndex: 1, textAlign: 'right',
      }}>WITH HARNESS</div>
      <ClaudeOrb x={480} y={440} size={120} opacity={0.5} />
      <ClaudeOrb x={1440} y={540} size={120} />
      <div style={{
        position: 'absolute', left: 280, top: 580, width: 400,
        fontFamily: F.mono, fontSize: 18, color: C.red, textAlign: 'center', zIndex: 1,
      }}>
        "I can't browse the web..."
      </div>
      <StampX x={480} y={440} startFrame={20} size={140} />
    </>
  );
};

const ContextBuilder: React.FC = () => {
  const { phaseFrame } = usePhase();
  const items = ['Calendar', 'Past emails', 'Travel prefs'];
  return (
    <>
      <Starfield />
      <Task />
      <Divider />
      <div style={{ position: 'absolute', left: 80, top: 160,
        fontFamily: F.mono, fontSize: 14, color: C.dim, letterSpacing: 2, zIndex: 1,
      }}>NO HARNESS</div>
      <StampX x={480} y={440} startFrame={0} size={140} />
      <div style={{ position: 'absolute', right: 80, top: 160,
        fontFamily: F.mono, fontSize: 14, color: C.cyan, letterSpacing: 2, zIndex: 1, textAlign: 'right',
      }}>WITH HARNESS</div>
      <ClaudeOrb x={1440} y={540} size={130} />
      {/* Context flying in */}
      {items.map((it, i) => {
        const start = i * 20;
        const p = interpolate(phaseFrame - start, [0, 30], [0, 1], {
          extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
        });
        if (phaseFrame < start) return null;
        return (
          <div key={i} style={{
            position: 'absolute',
            left: interpolate(p, [0, 1], [1920, 1200]),
            top: 340 + i * 50,
            padding: '8px 14px', borderRadius: 6,
            backgroundColor: '#101520', border: `1px solid ${C.cyan}`,
            fontFamily: F.mono, fontSize: 14, color: C.cyan, zIndex: 1, opacity: p,
          }}>
            {it}
          </div>
        );
      })}
    </>
  );
};

const FailureBeat: React.FC = () => {
  const { phaseFrame } = usePhase();
  // Red flash pulse on the error panel for first 20 frames
  const flashAlpha = phaseFrame < 20 ? (0.6 + 0.4 * Math.sin(phaseFrame * 0.8)) : 0.25;
  // Retry spinner angle
  const spinDeg = (phaseFrame * 12) % 360;
  // Screen darkens briefly — "music ducks" visual equivalent
  const duckOpacity = interpolate(phaseFrame, [0, 12, 28, 40], [0, 0.45, 0.25, 0.15], {
    extrapolateRight: 'clamp',
  });
  return (
    <>
      <Starfield />
      {/* Red duck overlay for tension */}
      <div style={{
        position: 'absolute', inset: 0, backgroundColor: C.red,
        opacity: duckOpacity * 0.12, zIndex: 0, pointerEvents: 'none',
      }} />
      <Task />
      <Divider />
      <div style={{ position: 'absolute', left: 80, top: 160, fontFamily: F.mono, fontSize: 14, color: C.dim, letterSpacing: 2, zIndex: 1 }}>NO HARNESS</div>
      <StampX x={480} y={440} startFrame={0} size={140} />
      <div style={{ position: 'absolute', right: 80, top: 160, fontFamily: F.mono, fontSize: 14, color: C.cyan, letterSpacing: 2, zIndex: 1, textAlign: 'right' }}>WITH HARNESS</div>
      <ClaudeOrb x={1440} y={540} size={130} />
      {/* Tool call — web_search — fails, with flashing red border */}
      <div style={{
        position: 'absolute', right: 120, top: 340, width: 400, padding: '12px 16px',
        borderRadius: 8,
        backgroundColor: `${C.red}${Math.floor(flashAlpha * 68).toString(16).padStart(2, '0')}`,
        border: `2px solid ${C.red}`,
        boxShadow: `0 0 ${20 + flashAlpha * 30}px ${C.red}${Math.floor(flashAlpha * 255).toString(16).padStart(2, '0')}`,
        fontFamily: F.mono, fontSize: 14, color: C.red, zIndex: 1,
      }}>
        <div>$ web_search("flights MUM to NRT")</div>
        <div style={{ marginTop: 6, color: C.red, fontWeight: 700 }}>
          ✗ ERROR: rate limit exceeded
        </div>
      </div>
      {/* Retry indicator with spinning icon */}
      {phaseFrame > 30 && (
        <div style={{
          position: 'absolute', right: 120, top: 440,
          padding: '10px 14px', borderRadius: 6,
          backgroundColor: `${C.amber}22`, border: `1.5px solid ${C.amber}`,
          fontFamily: F.mono, fontSize: 13, color: C.amber, zIndex: 1,
          opacity: interpolate(phaseFrame - 30, [0, 15], [0, 1], { extrapolateRight: 'clamp' }),
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 16, height: 16, border: `2px solid ${C.amber}`, borderTopColor: 'transparent',
            borderRadius: '50%', transform: `rotate(${spinDeg}deg)`,
          }} />
          retry 1/3 · reformatting...
        </div>
      )}
      {/* Loop counter jumps */}
      {phaseFrame > 15 && (
        <div style={{
          position: 'absolute', right: 120, top: 500,
          padding: '6px 12px', borderRadius: 4,
          backgroundColor: '#101520', border: `1px solid ${C.amber}`,
          fontFamily: F.mono, fontSize: 12, color: C.amber, zIndex: 1,
          opacity: interpolate(phaseFrame - 15, [0, 10], [0, 1], { extrapolateRight: 'clamp' }),
        }}>
          loop · {Math.min(4, Math.floor((phaseFrame - 15) / 8) + 1)}
        </div>
      )}
    </>
  );
};

const RetrySuccess: React.FC = () => {
  const { phaseFrame } = usePhase();
  return (
    <>
      <Starfield />
      <Task />
      <Divider />
      <div style={{ position: 'absolute', left: 80, top: 160, fontFamily: F.mono, fontSize: 14, color: C.dim, letterSpacing: 2, zIndex: 1 }}>NO HARNESS</div>
      <StampX x={480} y={440} startFrame={0} size={140} />
      <div style={{ position: 'absolute', right: 80, top: 160, fontFamily: F.mono, fontSize: 14, color: C.cyan, letterSpacing: 2, zIndex: 1, textAlign: 'right' }}>WITH HARNESS</div>
      <ClaudeOrb x={1440} y={540} size={130} />
      {/* Successful tool chain */}
      {[
        { label: 'web_search ✓', color: C.green, y: 280 },
        { label: 'check_calendar ✓', color: C.green, y: 340 },
        { label: 'draft_email ✓', color: C.green, y: 400 },
      ].map((t, i) => {
        const start = i * 20;
        const p = interpolate(phaseFrame - start, [0, 20], [0, 1], {
          extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
        });
        if (phaseFrame < start) return null;
        return (
          <div key={i} style={{
            position: 'absolute', right: 120, top: t.y, width: 400, padding: '10px 16px',
            borderRadius: 6, backgroundColor: `${t.color}22`, border: `1.5px solid ${t.color}`,
            fontFamily: F.mono, fontSize: 14, color: t.color, zIndex: 1, opacity: p,
          }}>
            $ {t.label}
          </div>
        );
      })}
    </>
  );
};

const StatsHero: React.FC = () => {
  const { phaseFrame } = usePhase();
  const stats = [
    { val: '9', label: 'loops' },
    { val: '3', label: 'tools' },
    { val: '1', label: 'retry' },
    { val: '22', label: 'seconds' },
  ];
  return (
    <>
      <Starfield />
      <Task />
      <Divider />
      <StampX x={480} y={540} startFrame={0} size={160} />
      <div style={{
        position: 'absolute', right: 120, top: 300,
        padding: '12px 18px', borderRadius: 8,
        backgroundColor: C.green, color: '#000',
        fontFamily: F.inter, fontSize: 20, fontWeight: 900, zIndex: 1,
      }}>
        DELIVERED
      </div>
      {/* Stats banner */}
      <div style={{
        position: 'absolute', bottom: 120, left: 0, right: 0, zIndex: 2,
        display: 'flex', justifyContent: 'center', gap: 30,
      }}>
        {stats.map((s, i) => {
          const start = i * 10;
          const p = spring({
            frame: phaseFrame - start,
            fps: 30, config: { damping: 12, stiffness: 180 },
          });
          return (
            <div key={i} style={{
              padding: '20px 32px', borderRadius: 12,
              backgroundColor: '#101520', border: `2px solid ${C.amber}`,
              boxShadow: `0 0 20px ${C.amber}66`,
              textAlign: 'center', transform: `scale(${p})`, opacity: p,
            }}>
              <div style={{ fontFamily: F.inter, fontSize: 48, fontWeight: 900, color: C.amber }}>{s.val}</div>
              <div style={{ fontFamily: F.mono, fontSize: 13, color: C.text, marginTop: 4 }}>{s.label}</div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export const RH06_LiveDemo: React.FC = () => (
  <Scene id="rh06">
    <Phase id="task_setup"><TaskSetup /></Phase>
    <Phase id="left_panel_fail"><LeftPanelFail /></Phase>
    <Phase id="context_builder"><ContextBuilder /></Phase>
    <Phase id="failure_beat"><FailureBeat /></Phase>
    <Phase id="retry_success"><RetrySuccess /></Phase>
    <Phase id="stats_hero"><StatsHero /></Phase>
  </Scene>
);
