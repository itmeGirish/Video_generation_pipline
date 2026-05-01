import React from 'react';
import { interpolate, spring, useVideoConfig } from 'remotion';
import { Scene, Phase, usePhase } from '../../storyboard/Scene';
import { C, F, Starfield, ClaudeOrb } from '../../components/rh/primitives';

const PartHeader: React.FC<{ num: string; title: string; color?: string }> = ({ num, title, color = C.cyan }) => (
  <div style={{
    position: 'absolute', top: 60, left: 0, right: 0, textAlign: 'center', zIndex: 1,
  }}>
    <div style={{ fontFamily: F.mono, fontSize: 18, color, letterSpacing: 4 }}>
      PART {num}
    </div>
    <div style={{ fontFamily: F.inter, fontSize: 42, fontWeight: 900, color: C.text, marginTop: 6 }}>
      {title}
    </div>
  </div>
);

// 5A — Context Builder (funnel)
const PartAContext: React.FC = () => {
  const { phaseFrame, phaseDuration } = usePhase();
  const chunks = [
    { label: 'user question', color: C.cyan },
    { label: 'system instruction', color: C.amber },
    { label: 'document snippet', color: C.green },
    { label: 'past chat', color: C.magenta },
    { label: 'tool result', color: C.claude },
  ];
  const funnelFrom = 20;
  return (
    <>
      <Starfield />
      <PartHeader num="1" title="Context" />
      {/* Funnel */}
      <svg style={{ position: 'absolute', inset: 0, zIndex: 1 }} width={1920} height={1080}>
        <path
          d={`M 720 350 L 1200 350 L 1080 650 L 840 650 Z`}
          fill="none" stroke={C.cyan} strokeWidth={2} opacity={0.7}
        />
        <rect x={840} y={650} width={240} height={8} fill={C.cyan} opacity={0.6} />
      </svg>
      {/* Chunks falling in */}
      {chunks.map((ch, i) => {
        const start = funnelFrom + i * 20;
        const p = interpolate(phaseFrame - start, [0, 30], [0, 1], {
          extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
        });
        const y = interpolate(p, [0, 1], [100, 340]);
        if (phaseFrame < start) return null;
        return (
          <div key={i} style={{
            position: 'absolute', left: 960 - 120 + (i % 2 === 0 ? -60 : 60), top: y,
            width: 240, padding: '8px 14px', borderRadius: 6,
            backgroundColor: '#101520', border: `1px solid ${ch.color}`,
            fontFamily: F.mono, fontSize: 14, color: ch.color, textAlign: 'center',
            zIndex: 1, opacity: p,
          }}>
            {ch.label}
          </div>
        );
      })}
      {/* Output stack */}
      {phaseFrame > 140 && (
        <div style={{
          position: 'absolute', top: 700, left: 0, right: 0, textAlign: 'center', zIndex: 1,
          opacity: interpolate(phaseFrame - 140, [0, 25], [0, 1], { extrapolateRight: 'clamp' }),
        }}>
          <div style={{
            fontFamily: F.inter, fontSize: 24, fontWeight: 700, color: C.amber,
            padding: '12px 30px', display: 'inline-block',
            backgroundColor: '#101520', border: `1px solid ${C.amber}`, borderRadius: 8,
            boxShadow: `0 0 20px ${C.amber}66`,
          }}>
            what the AI actually sees
          </div>
        </div>
      )}
    </>
  );
};

// 5B — Tools (toolbelt + terminal)
const PartBTools: React.FC = () => {
  const { phaseFrame } = usePhase();
  const tools = ['web_search', 'read_file', 'run_code', 'call_api', 'write_db', 'send_email'];
  const terminalShow = phaseFrame > 100;
  return (
    <>
      <Starfield />
      <PartHeader num="2" title="Tools" />
      <ClaudeOrb x={960} y={420} size={130} />
      {/* Toolbelt */}
      <div style={{
        position: 'absolute', bottom: 120, left: 0, right: 0,
        display: 'flex', justifyContent: 'center', gap: 18, zIndex: 1,
      }}>
        {tools.map((t, i) => {
          const p = interpolate(phaseFrame - 20 - i * 6, [0, 20], [0, 1], {
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
          });
          const active = t === 'run_code' && phaseFrame > 90;
          return (
            <div key={i} style={{
              padding: '10px 14px', borderRadius: 8,
              backgroundColor: active ? `${C.cyan}22` : '#101520',
              border: `1.5px solid ${active ? C.cyan : C.dim}`,
              boxShadow: active ? `0 0 14px ${C.cyan}aa` : 'none',
              fontFamily: F.mono, fontSize: 13, color: active ? C.cyan : C.text,
              opacity: p, transform: `translateY(${interpolate(p, [0, 1], [20, 0])}px)`,
            }}>
              {t}
            </div>
          );
        })}
      </div>
      {/* Terminal output */}
      {terminalShow && (
        <div style={{
          position: 'absolute', left: 560, top: 520, width: 800, padding: '14px 20px',
          borderRadius: 6, backgroundColor: '#0a1015', border: `1px solid ${C.green}`,
          fontFamily: F.mono, fontSize: 14, color: C.green, zIndex: 1,
          opacity: interpolate(phaseFrame - 100, [0, 20], [0, 1], { extrapolateRight: 'clamp' }),
        }}>
          <div style={{ color: C.cyan }}>$ run_code</div>
          <div>&gt; executing...</div>
          <div>&gt; 0 errors · 3 tests passed ✓</div>
        </div>
      )}
    </>
  );
};

// 5C — Memory (stacked layers)
const PartCMemory: React.FC = () => {
  const { phaseFrame } = usePhase();
  return (
    <>
      <Starfield />
      <PartHeader num="3" title="Memory" />
      {/* Short-term */}
      <div style={{
        position: 'absolute', left: 660, top: 320, width: 600, height: 100, zIndex: 1,
        borderRadius: 10, backgroundColor: `${C.cyan}11`, border: `1.5px solid ${C.cyan}`,
        boxShadow: `0 0 20px ${C.cyan}66`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: F.mono, fontSize: 18, color: C.cyan,
      }}>
        SHORT-TERM MEMORY
      </div>
      {/* Long-term vault */}
      <div style={{
        position: 'absolute', left: 660, top: 450, width: 600, height: 200, zIndex: 1,
        borderRadius: 10, backgroundColor: '#0a1015', border: `2px solid ${C.amber}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: F.mono, fontSize: 18, color: C.amber,
      }}>
        LONG-TERM VAULT
      </div>
      {/* Fact migrating */}
      {phaseFrame > 30 && phaseFrame < 120 && (
        <div style={{
          position: 'absolute', left: 760, top: interpolate(phaseFrame, [30, 120], [350, 530]),
          padding: '6px 12px', borderRadius: 4, backgroundColor: C.green, color: '#000',
          fontFamily: F.mono, fontSize: 14, fontWeight: 700, zIndex: 2,
        }}>
          "user prefers morning flights"
        </div>
      )}
      {phaseFrame > 150 && (
        <div style={{
          position: 'absolute', top: 700, left: 0, right: 0, textAlign: 'center', zIndex: 1,
          fontFamily: F.mono, fontSize: 18, color: C.cyan,
          opacity: interpolate(phaseFrame - 150, [0, 20], [0, 1], { extrapolateRight: 'clamp' }),
        }}>
          → 2 weeks later → retrieved for new conversation
        </div>
      )}
    </>
  );
};

// Pattern break — silence + push-in
const PatternBreak: React.FC = () => {
  const { phaseFrame, phaseDuration } = usePhase();
  const zoom = interpolate(phaseFrame, [0, phaseDuration], [1.0, 1.05]);
  return (
    <>
      <Starfield />
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1, transform: `scale(${zoom})`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 40,
      }}>
        <div style={{ display: 'flex', gap: 24 }}>
          {['CONTEXT', 'TOOLS', 'MEMORY'].map((label, i) => (
            <div key={i} style={{
              padding: '12px 20px', borderRadius: 8,
              backgroundColor: `${C.cyan}22`, border: `1.5px solid ${C.cyan}`,
              boxShadow: `0 0 14px ${C.cyan}66`,
              fontFamily: F.mono, fontSize: 16, color: C.cyan, fontWeight: 700,
            }}>
              {label} ✓
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          {['LOOP', 'OUTPUT'].map((label, i) => {
            const pulse = 0.5 + 0.5 * Math.sin(phaseFrame * 0.15 + i);
            return (
              <div key={i} style={{
                padding: '12px 20px', borderRadius: 8,
                backgroundColor: `${C.red}22`, border: `1.5px solid ${C.red}`,
                fontFamily: F.mono, fontSize: 16, color: C.red, fontWeight: 700,
                opacity: 0.5 + 0.5 * pulse,
              }}>
                {label} — incomplete
              </div>
            );
          })}
        </div>
        <div style={{
          fontFamily: F.inter, fontSize: 24, color: C.text, opacity: 0.6, marginTop: 20,
        }}>
          this is where it gets interesting...
        </div>
      </div>
    </>
  );
};

// 5D — The Loop (circular path with stations)
const PartDLoop: React.FC = () => {
  const { phaseFrame } = usePhase();
  const cx = 960, cy = 540, r = 180;
  const stations = [
    { label: 'Think',   angle: -90 },
    { label: 'Act',     angle: 0 },
    { label: 'Observe', angle: 90 },
    { label: 'Decide',  angle: 180 },
  ];
  const counterVal = Math.min(12, Math.floor(phaseFrame / 12) + 1);
  const tokenAngle = (phaseFrame / 60) * Math.PI * 2;
  const tx = cx + Math.cos(tokenAngle - Math.PI / 2) * r;
  const ty = cy + Math.sin(tokenAngle - Math.PI / 2) * r;
  const done = phaseFrame > 180;

  return (
    <>
      <Starfield />
      <PartHeader num="4" title="The Loop" />
      {/* Circular path */}
      <svg style={{ position: 'absolute', inset: 0, zIndex: 1 }} width={1920} height={1080}>
        <circle cx={cx} cy={cy} r={r}
          fill="none" stroke={C.cyan} strokeWidth={2} opacity={0.6} strokeDasharray="6 6" />
      </svg>
      {/* Stations */}
      {stations.map((s, i) => {
        const rad = (s.angle * Math.PI) / 180;
        const x = cx + Math.cos(rad) * r;
        const y = cy + Math.sin(rad) * r;
        return (
          <div key={i} style={{
            position: 'absolute', left: x - 50, top: y - 20,
            width: 100, textAlign: 'center',
            fontFamily: F.mono, fontSize: 14, color: C.text, fontWeight: 700, zIndex: 2,
            textShadow: `0 0 6px ${C.bg}`,
          }}>
            {s.label}
          </div>
        );
      })}
      {/* Token */}
      {!done && (
        <div style={{
          position: 'absolute', left: tx - 10, top: ty - 10,
          width: 20, height: 20, borderRadius: '50%',
          backgroundColor: C.claude, boxShadow: `0 0 15px ${C.claude}`, zIndex: 2,
        }} />
      )}
      {/* Counter */}
      <div style={{
        position: 'absolute', top: cy - 30, left: cx - 80, width: 160, textAlign: 'center', zIndex: 2,
        fontFamily: F.mono, fontSize: 48, color: C.amber, fontWeight: 900,
      }}>
        {counterVal}
        <div style={{ fontSize: 12, color: C.dim, marginTop: -6 }}>iteration</div>
      </div>
      {done && (
        <div style={{
          position: 'absolute', left: cx - 60, top: cy + 140, width: 120, padding: '8px 14px',
          borderRadius: 6, backgroundColor: C.green, color: '#000',
          fontFamily: F.inter, fontSize: 20, fontWeight: 900, textAlign: 'center', zIndex: 2,
        }}>
          DONE ✓
        </div>
      )}
    </>
  );
};

// 5E — Guardrails + output
const PartEGuardrails: React.FC = () => {
  const { phaseFrame } = usePhase();
  const gates = ['Schema', 'Safety', 'Cost'];
  return (
    <>
      <Starfield />
      <PartHeader num="5" title="Guardrails" />
      <ClaudeOrb x={420} y={540} size={110} />
      {/* Centered pipeline: orb → Schema → Safety → Cost → DELIVERED */}
      <div style={{
        position: 'absolute', top: 520, left: 540, right: 240, height: 40,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 30, zIndex: 1,
      }}>
        {gates.map((g, i) => {
          const passFrame = 30 + i * 40;
          const passed = phaseFrame > passFrame;
          return (
            <React.Fragment key={i}>
              <div style={{
                padding: '14px 20px', borderRadius: 8,
                backgroundColor: passed ? `${C.green}22` : '#101520',
                border: `2px solid ${passed ? C.green : C.cyan}66`,
                boxShadow: passed ? `0 0 14px ${C.green}aa` : 'none',
                fontFamily: F.mono, fontSize: 15, color: passed ? C.green : C.cyan, fontWeight: 700,
              }}>
                {g} {passed ? '✓' : ''}
              </div>
              {i < gates.length - 1 && (
                <div style={{ color: C.cyan, fontSize: 20 }}>→</div>
              )}
            </React.Fragment>
          );
        })}
      </div>
      {/* Final delivered */}
      {phaseFrame > 160 && (
        <div style={{
          position: 'absolute', right: 80, top: 520,
          padding: '12px 18px', borderRadius: 8,
          backgroundColor: C.green, color: '#000',
          fontFamily: F.inter, fontSize: 18, fontWeight: 900, zIndex: 1,
          opacity: interpolate(phaseFrame - 160, [0, 20], [0, 1], { extrapolateRight: 'clamp' }),
        }}>
          DELIVERED
        </div>
      )}
    </>
  );
};

export const RH05_FiveParts: React.FC = () => (
  <Scene id="rh05">
    <Phase id="part_a_context"><PartAContext /></Phase>
    <Phase id="part_b_tools"><PartBTools /></Phase>
    <Phase id="part_c_memory"><PartCMemory /></Phase>
    <Phase id="pattern_break"><PatternBreak /></Phase>
    <Phase id="part_d_loop"><PartDLoop /></Phase>
    <Phase id="part_e_guardrails"><PartEGuardrails /></Phase>
  </Scene>
);
