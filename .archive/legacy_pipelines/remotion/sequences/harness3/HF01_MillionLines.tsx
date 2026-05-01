import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { findWordFrame, getSceneDurationFrames } from '../../utils/audioSync';
import { Bg } from '../harness2/HE01_HorseNoHarness';

const C = {
  bg: '#0A1628', amber: '#F59E0B', cyan: '#22D3EE',
  violet: '#A78BFA', green: '#22C55E', red: '#EF4444',
  white: '#E8F4FF', dim: '#6B7A94', card: '#111E34',
};
const INTER = 'Inter, sans-serif';
const MONO = 'JetBrains Mono, monospace';

// ─── PANEL A: Number punches (hook) ───
const NumberPunches: React.FC<{ relFrame: number }> = ({ relFrame }) => {
  const { fps } = useVideoConfig();
  // 5 numbers, each ~30 frames, with hard impact
  const numbers = [
    { text: '1,000,000', color: C.white, size: 240 },
    { text: '5 months', color: C.white, size: 220 },
    { text: '1,500 PRs', color: C.white, size: 220 },
    { text: '0', color: C.red, size: 360, emphasis: true },
  ];
  const perNumber = 35;

  let activeIdx = Math.floor(relFrame / perNumber);
  if (activeIdx >= numbers.length) activeIdx = numbers.length - 1;
  const localFrame = relFrame - activeIdx * perNumber;

  const n = numbers[activeIdx];

  // Impact spring
  const impact = spring({ frame: localFrame, fps, config: { damping: 8, stiffness: 250 } });
  // Subtle camera shake on impact
  const shake = localFrame < 8 ? Math.sin(localFrame * 4) * 4 : 0;

  return (
    <div style={{
      width: 1920, height: 1080, backgroundColor: '#000',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transform: `translateX(${shake}px)`,
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontFamily: INTER, fontSize: n.size, fontWeight: 900, color: n.color,
          letterSpacing: -2, lineHeight: 1,
          transform: `scale(${interpolate(impact, [0, 1], [1.4, 1])})`,
          opacity: impact,
          textShadow: n.emphasis ? `0 0 80px ${n.color}aa` : 'none',
        }}>
          {n.text}
        </div>
        {activeIdx === 3 && (
          <div style={{
            fontFamily: MONO, fontSize: 28, color: C.red, letterSpacing: 6, marginTop: 20,
            opacity: interpolate(localFrame, [10, 25], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
          }}>
            HUMANS
          </div>
        )}
      </div>
    </div>
  );
};

// ─── PANEL B: Terminal flood ───
const TerminalFlood: React.FC<{ relFrame: number }> = ({ relFrame }) => {
  const fakeFiles = [
    'src/core/agent.ts',
    'src/tools/sandbox.ts',
    'infra/docker-compose.yml',
    'src/memory/store.ts',
    'scripts/harness.sh',
    'tests/integration/agent.test.ts',
  ];
  const currentFile = fakeFiles[Math.floor(relFrame / 40) % fakeFiles.length];

  // Rapid code flood
  const codeLines = [
    'export class Agent {',
    '  async run(task: Task) {',
    '    const ctx = await this.gather(task);',
    '    const plan = await this.model.plan(ctx);',
    '    for (const step of plan) {',
    '      await this.execute(step);',
    '      await this.verify(step);',
    '    }',
    '  }',
    '}',
    '',
    'function harness(agent: Agent) {',
    '  return withTools(withMemory(agent));',
    '}',
  ];

  const visibleLines = Math.min(codeLines.length * 3, Math.floor(relFrame * 0.4));
  const prCount = Math.floor(interpolate(relFrame, [0, 300], [1, 1500], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));

  return (
    <div style={{ width: 1920, height: 1080, position: 'relative', overflow: 'hidden' }}>
      <Bg />

      {/* Small corner card */}
      <div style={{
        position: 'absolute', top: 30, right: 30, padding: '10px 16px',
        borderRadius: 8, backgroundColor: C.card, border: `1px solid ${C.red}`,
      }}>
        <div style={{ fontFamily: INTER, fontSize: 42, fontWeight: 900, color: C.red, lineHeight: 1 }}>0</div>
        <div style={{ fontFamily: MONO, fontSize: 10, color: C.red, letterSpacing: 2 }}>humans</div>
      </div>

      {/* Terminal */}
      <div style={{
        position: 'absolute', top: 120, left: 120, right: 120, bottom: 120,
        backgroundColor: 'rgba(6,10,20,0.95)', borderRadius: 12,
        border: `1px solid ${C.cyan}44`, overflow: 'hidden',
      }}>
        {/* Title bar */}
        <div style={{
          padding: '12px 20px', borderBottom: `1px solid ${C.dim}`,
          fontFamily: MONO, fontSize: 13, color: C.dim,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#FF5F57' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#FEBC2E' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#28C840' }} />
          </div>
          <span style={{ flex: 1 }}>{currentFile}</span>
          <span style={{ color: C.amber }}>PR #{prCount.toLocaleString()}</span>
        </div>
        {/* Code */}
        <div style={{ padding: 24, fontFamily: MONO, fontSize: 18, lineHeight: 1.5 }}>
          {codeLines.slice(0, visibleLines / 3).map((line, i) => (
            <div key={i} style={{
              color: line.startsWith('function') || line.startsWith('export') ? C.amber : C.white,
              whiteSpace: 'pre', opacity: 0.9,
            }}>
              {line}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── PANEL C: Three engineers watching ───
const EngineersWatching: React.FC<{ relFrame: number }> = ({ relFrame }) => {
  return (
    <div style={{ width: 1920, height: 1080, position: 'relative' }}>
      <Bg />
      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        alignItems: 'center', justifyContent: 'center', gap: 120,
      }}>
        {[0, 1, 2].map((i) => {
          const orbY = Math.sin((relFrame + i * 20) * 0.1) * 15;
          return (
            <div key={i} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
              opacity: interpolate(relFrame - i * 8, [0, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
            }}>
              {/* Floating orb above desk */}
              <div style={{
                width: 70, height: 70, borderRadius: '50%',
                background: `radial-gradient(circle, ${C.amber}, ${C.amber}44)`,
                boxShadow: `0 0 30px ${C.amber}aa`,
                transform: `translateY(${orbY}px)`,
              }} />
              {/* Person silhouette */}
              <div style={{ fontSize: 100 }}>👤</div>
              {/* Screen */}
              <div style={{
                width: 140, height: 90, borderRadius: 6,
                backgroundColor: C.card, border: `1px solid ${C.cyan}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: MONO, fontSize: 11, color: C.cyan,
              }}>
                watching...
              </div>
            </div>
          );
        })}
      </div>
      <div style={{
        position: 'absolute', bottom: 120, left: 0, right: 0, textAlign: 'center',
        fontFamily: MONO, fontSize: 20, color: C.white, letterSpacing: 2,
        opacity: interpolate(relFrame - 60, [0, 30], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
      }}>
        OpenAI Frontier Team · 3 engineers · 0 keystrokes of code
      </div>
    </div>
  );
};

// ─── PANEL D: The question ───
const TheQuestion: React.FC<{ relFrame: number }> = ({ relFrame }) => {
  const text = 'How is that even possible?';
  const chars = Math.min(Math.floor(relFrame * 1.5), text.length);
  const cursorVisible = Math.floor(relFrame / 10) % 2 === 0;
  return (
    <div style={{
      width: 1920, height: 1080, position: 'relative',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Bg />
      <div style={{
        fontFamily: INTER, fontSize: 80, fontWeight: 800, color: C.white,
        letterSpacing: -1,
        position: 'relative', zIndex: 1,   // render above <Bg /> absolute layers
      }}>
        {text.substring(0, chars)}
        {chars < text.length && cursorVisible && <span style={{ color: C.cyan }}>▊</span>}
      </div>
    </div>
  );
};

// ─── PANEL E: HARNESS reveal ───
const HarnessReveal: React.FC<{ relFrame: number }> = ({ relFrame }) => {
  const { fps } = useVideoConfig();
  const textSpring = spring({ frame: relFrame, fps, config: { damping: 14, stiffness: 80 } });
  const tag = 'A discipline most engineers haven\u2019t heard of \u2014 yet.';
  const tagChars = Math.max(0, Math.floor((relFrame - 50) * 1.5));

  const promise = 'Six minutes. Everything you need to know.';
  const promiseChars = Math.max(0, Math.floor((relFrame - 140) * 1.5));

  return (
    <div style={{
      width: 1920, height: 1080, position: 'relative',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 30,
    }}>
      <Bg />
      {/* Swirling particles — trimmed 40→14 for render perf */}
      {Array.from({ length: 14 }).map((_, i) => {
        const angle = (i / 14) * Math.PI * 2 + relFrame * 0.03;
        const r = 220 + Math.sin(relFrame * 0.05 + i) * 40;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r * 0.5;
        const isAmber = i % 2 === 0;
        return (
          <div key={i} style={{
            position: 'absolute', left: '50%', top: '50%',
            width: 4, height: 4, borderRadius: '50%',
            backgroundColor: isAmber ? C.amber : C.cyan,
            transform: `translate(${x}px, ${y}px)`,
            opacity: 0.6 * textSpring,
          }} />
        );
      })}

      <div style={{
        fontFamily: INTER, fontSize: 180, fontWeight: 900,
        background: `linear-gradient(90deg, ${C.amber}, ${C.cyan})`,
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        letterSpacing: 6, transform: `scale(${textSpring})`,
      }}>
        HARNESS
      </div>

      <div style={{ fontFamily: MONO, fontSize: 20, color: C.dim, letterSpacing: 1 }}>
        {tag.substring(0, Math.min(tagChars, tag.length))}
      </div>

      {promiseChars > 0 && (
        <div style={{
          fontFamily: INTER, fontSize: 24, color: C.cyan, marginTop: 40, fontWeight: 700,
        }}>
          {promise.substring(0, Math.min(promiseChars, promise.length))}
        </div>
      )}
    </div>
  );
};

import { Scene, Phase, usePhase } from '../../storyboard/Scene';

const Adapter: React.FC<{ C: React.FC<{ relFrame: number }> }> = ({ C }) => {
  const { phaseFrame } = usePhase();
  return <C relFrame={phaseFrame} />;
};

/** Driven by storyboard/scenes/hf01.yaml. Edit that file, not frame numbers here. */
export const HF01_MillionLines: React.FC = () => (
  <Scene id="hf01">
    <Phase id="number_punches"><Adapter C={NumberPunches} /></Phase>
    <Phase id="terminal_flood"><Adapter C={TerminalFlood} /></Phase>
    <Phase id="engineers_watching"><Adapter C={EngineersWatching} /></Phase>
    <Phase id="the_question"><Adapter C={TheQuestion} /></Phase>
    <Phase id="harness_reveal"><Adapter C={HarnessReveal} /></Phase>
  </Scene>
);
