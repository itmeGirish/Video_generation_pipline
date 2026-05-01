import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { Bg } from '../harness2/HE01_HorseNoHarness';
import { Scene, Phase, usePhase } from '../../storyboard/Scene';

// Thin adapter: existing phase components expect `relFrame`. Hoist from usePhase.
const PhaseAdapter: React.FC<{ Component: React.FC<{ relFrame: number; total?: number }> }> = ({ Component }) => {
  const { phaseFrame, phaseDuration } = usePhase();
  return <Component relFrame={phaseFrame} total={phaseDuration} />;
};

const C = {
  bg: '#0A1628', amber: '#F59E0B', cyan: '#22D3EE',
  violet: '#A78BFA', green: '#22C55E', red: '#EF4444',
  white: '#E8F4FF', dim: '#6B7A94', card: '#111E34',
};
const INTER = 'Inter, sans-serif';
const MONO = 'JetBrains Mono, monospace';

// ─── PHASE A: Two-line reveal ───
const TwoLineReveal: React.FC<{ relFrame: number }> = ({ relFrame }) => {
  const line1 = 'For 60 years, the job was to write code.';
  const line2 = 'That era is ending.';
  const ch1 = Math.min(Math.floor(relFrame * 1.3), line1.length);
  const ch2 = Math.max(0, Math.min(Math.floor((relFrame - 100) * 1.3), line2.length));

  return (
    <div style={{
      width: 1920, height: 1080, position: 'relative',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 50,
    }}>
      <Bg />
      <div style={{
        fontFamily: INTER, fontSize: 56, fontWeight: 700, color: C.white, whiteSpace: 'pre', textAlign: 'center', letterSpacing: 1,
      }}>
        {line1.substring(0, ch1)}
      </div>
      {ch2 > 0 && (
        <div style={{
          fontFamily: INTER, fontSize: 80, fontWeight: 900, color: C.cyan, whiteSpace: 'pre', textAlign: 'center',
          textShadow: `0 0 40px ${C.cyan}`,
        }}>
          {line2.substring(0, ch2)}
        </div>
      )}
    </div>
  );
};

// ─── PHASE B: Evolution timeline ───
const EvolutionTimeline: React.FC<{ relFrame: number }> = ({ relFrame }) => {
  const { fps } = useVideoConfig();
  const nodes = [
    { year: '2020', label: 'Prompt Engineering',  sub: 'ask the right question',     color: C.violet, delay: 0 },
    { year: '2023', label: 'Context Engineering', sub: 'give the right information', color: C.amber,  delay: 35 },
    { year: '2025', label: 'Harness Engineering', sub: 'build the right system',     color: C.cyan,   delay: 70, glow: true },
    { year: '2026', label: '???',                 sub: 'you are here',                color: C.green,  delay: 120 },
  ];

  return (
    <div style={{ width: 1920, height: 1080, position: 'relative' }}>
      <Bg />

      {/* Compressed header */}
      <div style={{
        position: 'absolute', top: 80, left: 0, right: 0, textAlign: 'center',
        fontFamily: INTER, fontSize: 22, color: C.white, opacity: 0.6,
      }}>
        For 60 years, the job was to write code. <span style={{ color: C.cyan }}>That era is ending.</span>
      </div>

      {/* Timeline */}
      <div style={{
        position: 'absolute', top: '50%', left: 0, right: 0,
        transform: 'translateY(-50%)',
      }}>
        {/* Horizontal line */}
        <div style={{
          position: 'absolute', left: 140, right: 140, top: 100,
          height: 2, backgroundColor: C.dim,
        }} />
        {/* Nodes */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          padding: '0 140px',
        }}>
          {nodes.map((n, i) => {
            const p = spring({ frame: relFrame - n.delay, fps, config: { damping: 12 } });
            const pulse = n.glow ? 1 + Math.sin(relFrame * 0.2) * 0.1 : 1;
            return (
              <div key={i} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                width: 320,
              }}>
                <div style={{ fontFamily: MONO, fontSize: 18, fontWeight: 800, color: n.color, marginBottom: 20, opacity: p }}>
                  {n.year} →
                </div>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  backgroundColor: n.color,
                  boxShadow: `0 0 ${n.glow ? 30 : 15}px ${n.color}`,
                  transform: `scale(${p * pulse})`, opacity: p,
                }} />
                <div style={{
                  fontFamily: INTER, fontSize: 22, fontWeight: 800, color: C.white,
                  marginTop: 30, opacity: p, textAlign: 'center',
                }}>
                  {n.label}
                </div>
                <div style={{ fontFamily: MONO, fontSize: 13, color: C.dim, marginTop: 8, opacity: p, textAlign: 'center' }}>
                  {n.sub}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ─── PHASE C: Two teams ───
const TwoTeams: React.FC<{ relFrame: number }> = ({ relFrame }) => {
  const progressA = interpolate(relFrame, [30, 300], [0, 0.22], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const progressB = interpolate(relFrame, [30, 300], [0, 0.95], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <div style={{ width: 1920, height: 1080, position: 'relative' }}>
      <Bg />

      {/* Team A — 5 engineers, no harness */}
      <div style={{ position: 'absolute', top: 140, left: 100, width: 800 }}>
        <div style={{ fontFamily: INTER, fontSize: 22, fontWeight: 800, color: C.red, marginBottom: 16 }}>
          Team A · 5 engineers · no harness
        </div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 30 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ fontSize: 48 }}>👤</div>
          ))}
        </div>
        <div style={{ fontFamily: MONO, fontSize: 11, color: C.dim, marginBottom: 6 }}>productivity</div>
        <div style={{ height: 32, width: 700, backgroundColor: C.card, borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ width: `${progressA * 100}%`, height: '100%', backgroundColor: C.red, opacity: 0.7 }} />
        </div>
      </div>

      {/* Team B — 2 engineers, harness stack */}
      <div style={{ position: 'absolute', top: 140, right: 100, width: 800, textAlign: 'right' }}>
        <div style={{ fontFamily: INTER, fontSize: 22, fontWeight: 800, color: C.green, marginBottom: 16 }}>
          Team B · 2 engineers · full harness
        </div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 30, justifyContent: 'flex-end' }}>
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} style={{ position: 'relative', fontSize: 48 }}>
              👤
              <div style={{
                position: 'absolute', top: -10, right: -10,
                fontSize: 16, color: C.cyan,
              }}>⚙️</div>
            </div>
          ))}
        </div>
        <div style={{ fontFamily: MONO, fontSize: 11, color: C.dim, marginBottom: 6 }}>productivity</div>
        <div style={{ height: 32, width: 700, backgroundColor: C.card, borderRadius: 6, overflow: 'hidden', marginLeft: 'auto' }}>
          <div style={{ width: `${progressB * 100}%`, height: '100%', backgroundColor: C.green }} />
        </div>
      </div>

      {/* Caption */}
      {relFrame > 220 && (
        <div style={{
          position: 'absolute', bottom: 120, left: 0, right: 0, textAlign: 'center',
          opacity: interpolate(relFrame - 220, [0, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
        }}>
          <div style={{ fontFamily: INTER, fontSize: 24, fontWeight: 700, color: C.white, letterSpacing: 1 }}>
            Small teams with great harnesses <span style={{ color: C.cyan }}>out-build large teams without them.</span>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── PHASE D: Monday checklist ───
const MondayChecklist: React.FC<{ relFrame: number }> = ({ relFrame }) => {
  const { fps } = useVideoConfig();
  const items = [
    { phrase: 'Anatomy of an Agent Harness',  text: 'Read "The Anatomy of an Agent Harness" — LangChain', emoji: '📘' },
    { phrase: 'Harness Engineering',          text: 'Read "Harness Engineering" — OpenAI, Ryan Lopopolo', emoji: '📗' },
    { phrase: 'AGENTS.md in your next project', text: 'Write an AGENTS.md in your next project', emoji: '✍️' },
    { phrase: 'fix the harness, not the output', text: 'Next failure → fix the harness, not the output', emoji: '🔧' },
  ];

  return (
    <div style={{ width: 1920, height: 1080, position: 'relative', overflow: 'hidden' }}>
      <Bg />

      {/* Header */}
      <div style={{
        position: 'absolute', top: 80, left: 0, right: 0, textAlign: 'center',
        fontFamily: INTER, fontSize: 48, fontWeight: 900, color: C.white, letterSpacing: 2,
        opacity: interpolate(relFrame, [0, 20], [0, 1], { extrapolateRight: 'clamp' }),
      }}>
        MONDAY. <span style={{ color: C.cyan }}>Do these four things.</span>
      </div>

      {/* Checklist */}
      <div style={{
        position: 'absolute', top: 220, left: 0, right: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24,
      }}>
        {items.map((item, i) => {
          const appearAt = i * 50;
          const p = spring({ frame: relFrame - appearAt, fps, config: { damping: 12 } });
          const checkAt = appearAt + 30;
          const checkSpring = spring({ frame: relFrame - checkAt, fps, config: { damping: 8, stiffness: 200 } });
          if (relFrame < appearAt) return null;

          const checked = relFrame >= checkAt;

          return (
            <div key={i} style={{
              width: 1200, padding: '22px 30px', borderRadius: 14,
              backgroundColor: C.card, border: `1px solid ${checked ? C.green : C.dim}`,
              display: 'flex', alignItems: 'center', gap: 24,
              transform: `translateY(${interpolate(p, [0, 1], [30, 0])}px) scale(${p})`,
              opacity: p,
              boxShadow: checked ? `0 0 15px ${C.green}33` : 'none',
            }}>
              {/* Checkbox */}
              <div style={{
                width: 44, height: 44, borderRadius: 8,
                border: `2px solid ${checked ? C.green : C.dim}`,
                backgroundColor: checked ? `${C.green}22` : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {checked && (
                  <div style={{
                    fontSize: 32, color: C.green, fontWeight: 900,
                    transform: `scale(${checkSpring})`,
                  }}>✓</div>
                )}
              </div>
              {/* Emoji */}
              <div style={{ fontSize: 34 }}>{item.emoji}</div>
              {/* Text */}
              <div style={{
                fontFamily: INTER, fontSize: 22, fontWeight: 600, color: C.white,
                textDecoration: checked ? 'none' : 'none',
                flex: 1,
              }}>
                {item.text}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── PHASE E: Urgency close ───
const UrgencyClose: React.FC<{ relFrame: number }> = ({ relFrame }) => {
  const { fps } = useVideoConfig();
  const bigSpring = spring({ frame: relFrame, fps, config: { damping: 10, stiffness: 160 } });
  return (
    <div style={{
      width: 1920, height: 1080, position: 'relative',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Bg />
      <div style={{
        textAlign: 'center',
        transform: `scale(${bigSpring})`, opacity: bigSpring,
      }}>
        <div style={{
          fontFamily: INTER, fontSize: 120, fontWeight: 900, color: C.cyan, letterSpacing: -2,
          textShadow: `0 0 60px ${C.cyan}88`,
        }}>
          You're early.
        </div>
        <div style={{
          fontFamily: INTER, fontSize: 120, fontWeight: 900, color: C.white, letterSpacing: -2,
          marginTop: 20,
        }}>
          Don't blow it.
        </div>
      </div>
    </div>
  );
};

// ─── PHASE F: Final title ───
const FinalTitle: React.FC<{ relFrame: number; total: number }> = ({ relFrame, total }) => {
  const { fps } = useVideoConfig();
  const titleSpring = spring({ frame: relFrame, fps, config: { damping: 14 } });
  const tag = 'The model is the horse. The harness is the discipline.';
  const tagChars = Math.max(0, Math.floor((relFrame - 50) * 1));
  const fadeOut = interpolate(relFrame, [total - 20, total], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <div style={{
      width: 1920, height: 1080, position: 'relative',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 50,
      opacity: fadeOut,
    }}>
      <Bg />
      <div style={{
        fontFamily: INTER, fontSize: 64, fontWeight: 900, color: C.white,
        textAlign: 'center', lineHeight: 1.2, letterSpacing: -1,
        transform: `scale(${interpolate(titleSpring, [0, 1], [0.9, 1])})`, opacity: titleSpring,
      }}>
        THE RISE OF <span style={{ color: C.cyan }}>HARNESS ENGINEERING</span> IN AI
      </div>
      <div style={{
        fontFamily: MONO, fontSize: 20, color: C.amber, letterSpacing: 1, whiteSpace: 'pre',
      }}>
        {tag.substring(0, Math.min(tagChars, tag.length))}
      </div>
    </div>
  );
};

/**
 * Declarative scene structure driven by storyboard/timelines/hf07.json.
 * Phase IDs MUST match the YAML. Missing phases throw at mount, not silently.
 * Edit timing? Edit storyboard/scenes/hf07.yaml, re-run `python storyboard/compile.py hf07`.
 */
export const HF07_MondayChecklist: React.FC = () => (
  <Scene id="hf07">
    <Phase id="two_line_reveal">
      <PhaseAdapter Component={TwoLineReveal} />
    </Phase>
    <Phase id="evolution_timeline">
      <PhaseAdapter Component={EvolutionTimeline} />
    </Phase>
    <Phase id="two_teams">
      <PhaseAdapter Component={TwoTeams} />
    </Phase>
    <Phase id="monday_checklist">
      <PhaseAdapter Component={MondayChecklist} />
    </Phase>
    <Phase id="urgency_and_title">
      <PhaseAdapter Component={UrgencyClose} />
    </Phase>
  </Scene>
);
