import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { findWordFrame, getSceneDurationFrames } from '../../utils/audioSync';
import { ModelOrb, Bg } from '../harness2/HE01_HorseNoHarness';

const C = {
  bg: '#0A1628', amber: '#F59E0B', cyan: '#22D3EE',
  violet: '#A78BFA', green: '#22C55E', white: '#E8F4FF', dim: '#6B7A94', card: '#111E34',
};
const INTER = 'Inter, sans-serif';
const MONO = 'JetBrains Mono, monospace';

// Horse icon
// Horse icon rendered from the system emoji font. Filter removed — Chrome
// headless struggles with `filter:` on large emoji over many frames (crashes).
const HorseIcon: React.FC<{ x: number; y: number; scale?: number }> = ({ x, y, scale = 1 }) => {
  const frame = useCurrentFrame();
  const breathe = 1 + Math.sin(frame * 0.1) * 0.02;
  const size = 300 * scale;
  return (
    <div style={{
      position: 'absolute',
      left: x - size / 2, top: y - size / 2,
      width: size, height: size,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.85, lineHeight: 1,
      fontFamily: '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif',
      transform: `scale(${breathe})`,
    }}>
      🐎
    </div>
  );
};

// ─── PANEL A: Horse fades in ───
const HorseIntro: React.FC<{ relFrame: number }> = ({ relFrame }) => {
  const opacity = interpolate(relFrame, [0, 30], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <div style={{
      width: 1920, height: 1080, backgroundColor: '#000',
      opacity,
    }}>
      <HorseIcon x={960} y={540} scale={2} />
    </div>
  );
};

// ─── PANEL B: Horse runs wildly ───
const HorseRuns: React.FC<{ relFrame: number }> = ({ relFrame }) => {
  // Wild circular motion
  const t = relFrame * 0.03;
  const x = 960 + Math.cos(t) * 400 + Math.sin(t * 2.1) * 200;
  const y = 540 + Math.sin(t * 1.4) * 200 + Math.cos(t * 0.8) * 100;

  const words = ['powerful.', 'fast.', 'useless.'];
  return (
    <div style={{ width: 1920, height: 1080, backgroundColor: '#000', position: 'relative' }}>
      <HorseIcon x={x} y={y} scale={1.3} />
      <div style={{
        position: 'absolute', bottom: 120, left: 0, right: 0, textAlign: 'center',
        display: 'flex', justifyContent: 'center', gap: 40,
      }}>
        {words.map((w, i) => {
          const appearAt = 30 + i * 60;
          const p = relFrame > appearAt ? interpolate(relFrame - appearAt, [0, 8], [0, 1], { extrapolateRight: 'clamp' }) : 0;
          return (
            <div key={i} style={{
              fontFamily: INTER, fontSize: 56, fontWeight: 900, color: C.white,
              opacity: p, transform: `scale(${interpolate(p, [0, 1], [1.5, 1])})`,
              textShadow: `0 0 30px ${C.amber}66`,
            }}>
              {w}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── PANEL C: Horse → Orb dissolve ───
const HorseToOrb: React.FC<{ relFrame: number }> = ({ relFrame }) => {
  const { fps } = useVideoConfig();
  const dissolveP = interpolate(relFrame, [20, 60], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const label1Spring = spring({ frame: relFrame - 70, fps, config: { damping: 14 } });
  const harnessLineStart = 140;
  const harnessP = relFrame > harnessLineStart ? interpolate(relFrame - harnessLineStart, [0, 80], [0, 1], { extrapolateRight: 'clamp' }) : 0;
  const label2Spring = spring({ frame: relFrame - 210, fps, config: { damping: 14 } });

  const cx = 960;
  const cy = 500;

  // Harness outline path segments that draw in
  const harnessSegs = [
    { d: `M ${cx - 100} ${cy + 50} Q ${cx - 140} ${cy}, ${cx - 80} ${cy - 80}` }, // collar curve
    { d: `M ${cx + 100} ${cy + 50} Q ${cx + 140} ${cy}, ${cx + 80} ${cy - 80}` },
    { d: `M ${cx - 80} ${cy - 80} Q ${cx} ${cy - 120}, ${cx + 80} ${cy - 80}` }, // top reins
    { d: `M ${cx - 100} ${cy + 50} L ${cx + 100} ${cy + 50}` }, // saddle bottom
  ];

  return (
    <div style={{ width: 1920, height: 1080, backgroundColor: '#000', position: 'relative' }}>
      {/* Horse fading out */}
      <div style={{ opacity: 1 - dissolveP }}>
        <HorseIcon x={cx} y={cy} scale={1.3} />
      </div>
      {/* Orb fading in */}
      <div style={{ opacity: dissolveP }}>
        <ModelOrb x={cx} y={cy} size={150} />
      </div>

      {/* Labels */}
      <div style={{
        position: 'absolute', top: 700, left: 0, right: 0, textAlign: 'center',
        fontFamily: INTER, fontSize: 28, fontWeight: 800, color: C.amber,
        letterSpacing: 4, opacity: label1Spring,
      }}>
        THE AI MODEL → THE HORSE
      </div>

      {/* Cyan harness draws */}
      {harnessP > 0 && (
        <svg style={{ position: 'absolute', inset: 0 }} width={1920} height={1080}>
          {harnessSegs.map((s, i) => {
            const localP = Math.max(0, Math.min(1, (harnessP - i * 0.15) * 1.5));
            return (
              <path key={i} d={s.d}
                fill="none" stroke={C.cyan} strokeWidth={3} strokeLinecap="round"
                strokeDasharray={300} strokeDashoffset={300 - localP * 300}
                opacity={0.9}
              />
            );
          })}
        </svg>
      )}

      {/* Harness label */}
      {label2Spring > 0 && (
        <div style={{
          position: 'absolute', top: 760, left: 0, right: 0, textAlign: 'center',
          fontFamily: INTER, fontSize: 28, fontWeight: 800, color: C.cyan,
          letterSpacing: 4, opacity: label2Spring,
        }}>
          THE HARNESS → EVERYTHING ELSE
        </div>
      )}
    </div>
  );
};

// ─── PANEL D: Formula drop ───
const FormulaDrop: React.FC<{ relFrame: number }> = ({ relFrame }) => {
  const { fps } = useVideoConfig();
  const words = [
    { text: 'AGENT', color: C.white },
    { text: '=', color: C.white },
    { text: 'MODEL', color: C.amber },
    { text: '+', color: C.white },
    { text: 'HARNESS', color: C.cyan },
  ];

  return (
    <div style={{
      width: 1920, height: 1080, position: 'relative',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Bg />
      <div style={{ display: 'flex', gap: 30 }}>
        {words.map((w, i) => {
          const p = spring({ frame: relFrame - i * 8, fps, config: { damping: 8, stiffness: 250 } });
          return (
            <div key={i} style={{
              fontFamily: INTER, fontSize: 120, fontWeight: 900,
              color: w.color, letterSpacing: 2,
              transform: `scale(${p}) translateY(${interpolate(p, [0, 1], [40, 0])}px)`,
              opacity: p,
              textShadow: w.color !== C.white ? `0 0 40px ${w.color}66` : 'none',
            }}>
              {w.text}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── PANEL E: Harness components + products ───
const HarnessAssembly: React.FC<{ relFrame: number }> = ({ relFrame }) => {
  const { fps } = useVideoConfig();

  const COMPONENTS = [
    { icon: '🔁', label: 'Loop',       sub: 'runs over and over' },
    { icon: '🔧', label: 'Tools',      sub: 'read, bash, search' },
    { icon: '🧠', label: 'Memory',     sub: 'what it learned yesterday' },
    { icon: '📦', label: 'Sandbox',    sub: 'safe execution' },
    { icon: '🛡️', label: 'Guardrails', sub: 'no dangerous commands' },
    { icon: '📡', label: 'Feedback',   sub: 'did it work?' },
  ];

  const centerX = 960;
  const centerY = 500;
  const ringRadius = 320;

  // Compressed formula at top
  const formulaY = interpolate(relFrame, [0, 20], [-200, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Products appear at the end
  const productsStart = 280;
  const PRODUCTS = ['Claude Code', 'Cursor', 'Codex', 'Aider', 'Deep Agents', 'OpenCode'];

  return (
    <div style={{ width: 1920, height: 1080, position: 'relative', overflow: 'hidden' }}>
      <Bg />

      {/* Compressed formula top */}
      <div style={{
        position: 'absolute', top: 40 + formulaY, left: 0, right: 0, textAlign: 'center',
      }}>
        <div style={{
          fontFamily: INTER, fontSize: 38, fontWeight: 900, letterSpacing: 1,
        }}>
          <span style={{ color: C.white }}>AGENT = </span>
          <span style={{ color: C.amber }}>MODEL</span>
          <span style={{ color: C.white }}> + </span>
          <span style={{ color: C.cyan }}>HARNESS</span>
        </div>
      </div>

      {/* Orb */}
      <ModelOrb x={centerX} y={centerY} size={140} />

      {/* 6 harness components */}
      {COMPONENTS.map((c, i) => {
        const appearAt = 30 + i * 10;
        const p = spring({ frame: relFrame - appearAt, fps, config: { damping: 14, stiffness: 120 } });
        if (relFrame < appearAt) return null;

        const angle = (i / COMPONENTS.length) * Math.PI * 2 - Math.PI / 2;
        const x = centerX + Math.cos(angle) * ringRadius;
        const y = centerY + Math.sin(angle) * ringRadius;

        // All-lines pulse after all land
        const pulseActive = relFrame > 30 + COMPONENTS.length * 10 + 10;
        const pulse = pulseActive ? interpolate(Math.sin((relFrame - 140) * 0.4), [-1, 1], [0.4, 1]) : 0.6;

        return (
          <React.Fragment key={i}>
            <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} width={1920} height={1080}>
              <line x1={centerX} y1={centerY} x2={x} y2={y}
                stroke={C.cyan} strokeWidth={1.5} opacity={p * pulse} strokeDasharray={4} />
            </svg>
            <div style={{
              position: 'absolute', left: x - 110, top: y - 50,
              width: 220, height: 100, borderRadius: 14,
              backgroundColor: C.card, border: `1.5px solid ${C.cyan}`,
              boxShadow: `0 0 ${pulse * 25}px ${C.cyan}66`,
              padding: 10, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 4,
              transform: `scale(${p})`, opacity: p,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 22 }}>{c.icon}</span>
                <span style={{ fontFamily: INTER, fontSize: 16, fontWeight: 800, color: C.white }}>{c.label}</span>
              </div>
              <div style={{ fontFamily: MONO, fontSize: 11, color: C.dim }}>{c.sub}</div>
            </div>
          </React.Fragment>
        );
      })}

      {/* Products */}
      {relFrame >= productsStart && (
        <div style={{
          position: 'absolute', bottom: 40, left: 0, right: 0,
          display: 'flex', justifyContent: 'center', gap: 16,
          opacity: interpolate(relFrame - productsStart, [0, 30], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
        }}>
          {PRODUCTS.map((p, i) => {
            const s = spring({ frame: relFrame - productsStart - i * 8, fps, config: { damping: 14 } });
            return (
              <div key={i} style={{
                padding: '8px 18px', fontFamily: MONO, fontSize: 14, fontWeight: 700,
                color: C.cyan, backgroundColor: C.card, border: `1px solid ${C.cyan}66`, borderRadius: 6,
                transform: `scale(${s})`, opacity: s,
              }}>
                {p}
              </div>
            );
          })}
        </div>
      )}
      {relFrame >= productsStart + 80 && (
        <div style={{
          position: 'absolute', bottom: 10, left: 0, right: 0, textAlign: 'center',
          fontFamily: INTER, fontSize: 14, color: C.dim,
        }}>
          All different models. All harnesses.
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

export const HF02_Horse: React.FC = () => (
  <Scene id="hf02">
    <Phase id="horse_intro"><Adapter C={HorseIntro} /></Phase>
    <Phase id="horse_runs"><Adapter C={HorseRuns} /></Phase>
    <Phase id="horse_to_orb"><Adapter C={HorseToOrb} /></Phase>
    <Phase id="formula_drop"><Adapter C={FormulaDrop} /></Phase>
    <Phase id="harness_assembly"><Adapter C={HarnessAssembly} /></Phase>
  </Scene>
);
