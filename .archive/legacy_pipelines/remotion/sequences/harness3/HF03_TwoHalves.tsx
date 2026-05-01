import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { findWordFrame, getSceneDurationFrames } from '../../utils/audioSync';
import { ModelOrb, Bg } from '../harness2/HE01_HorseNoHarness';
import { Scene, Phase } from '../../storyboard/Scene';

const C = {
  bg: '#0A1628', amber: '#F59E0B', cyan: '#22D3EE',
  violet: '#A78BFA', green: '#22C55E', red: '#EF4444',
  white: '#E8F4FF', dim: '#6B7A94', card: '#111E34',
};
const INTER = 'Inter, sans-serif';
const MONO = 'JetBrains Mono, monospace';

const GUIDES = [
  { icon: '📄', text: 'AGENTS.md',        phrase: 'AGENTS.md' },
  { icon: '⚙️', text: 'system_prompt',    phrase: 'first-day' },
  { icon: '📚', text: '/skills/api-errors', phrase: 'API errors' },
  { icon: '📏', text: 'linter rules',     phrase: 'chances the agent' },
  { icon: '📖', text: 'team conventions', phrase: 'first try' },
];

const SENSORS = [
  { icon: '🧪', text: 'unit tests',     phrase: 'Tests',        verdict: 'pass' as const },
  { icon: '<T>', text: 'type checker', phrase: 'type checkers', verdict: 'pass' as const },
  { icon: '🔎', text: 'static analysis', phrase: 'Linters',      verdict: 'fail' as const },
  { icon: '🤖', text: 'review agent',   phrase: 'reviews',      verdict: 'violet' as const },
  { icon: '🔀', text: 'pre-commit hook', phrase: 'fix itself',   verdict: 'pass' as const },
];

const HF03_Inner: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const KEY = 'hf03';
  const total = getSceneDurationFrames(KEY);

  const guidesStart = findWordFrame(KEY, 'first half', 60);
  const sensorsStart = findWordFrame(KEY, 'second half', total * 0.35);
  const loopStart = findWordFrame(KEY, 'need both', total * 0.72);
  const takeawayStart = total - 60;

  const centerX = 960;
  const centerY = 540;

  // Flash on arrow hit (violet flash = guide hitting orb)
  const lastGuideHit = Math.max(...GUIDES.map((_, i) => findWordFrame(KEY, GUIDES[i].phrase, guidesStart + (i + 1) * 30)));
  const violetFlash = interpolate(Math.max(0, frame - lastGuideHit), [0, 10, 30], [0, 1, 0]);

  // Closed-loop path animation
  const loopP = interpolate(frame - loopStart, [0, 60], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <div style={{ width: 1920, height: 1080, position: 'relative', overflow: 'hidden' }}>
      <Bg />

      {/* Split seam */}
      <div style={{
        position: 'absolute', top: 120, bottom: 120, left: '50%',
        width: 1, background: `linear-gradient(180deg, transparent, ${C.white}, transparent)`,
        opacity: interpolate(frame, [0, 30], [0, 0.4], { extrapolateRight: 'clamp' }),
      }} />

      {/* GUIDES side label */}
      <div style={{
        position: 'absolute', left: 60, top: 80,
        fontFamily: INTER, fontSize: 24, fontWeight: 900, color: C.violet, letterSpacing: 4,
      }}>GUIDES · BEFORE</div>

      {/* SENSORS side label */}
      <div style={{
        position: 'absolute', right: 60, top: 80, textAlign: 'right',
        fontFamily: INTER, fontSize: 24, fontWeight: 900, color: C.green, letterSpacing: 4,
      }}>SENSORS · AFTER</div>

      {/* Orb with flash */}
      <div style={{
        position: 'absolute', left: centerX - 80, top: centerY - 80,
        width: 160, height: 160, borderRadius: '50%',
        backgroundColor: violetFlash > 0 ? `${C.violet}44` : 'transparent',
        transition: 'background-color 0.1s',
      }} />
      <ModelOrb x={centerX} y={centerY} size={140} />

      {/* GUIDES */}
      {frame >= guidesStart && (
        <>
          <div style={{
            position: 'absolute', left: 80, top: 150,
            fontFamily: MONO, fontSize: 15, color: C.dim, fontStyle: 'italic',
          }}>"here's how we do things."</div>

          {GUIDES.map((g, i) => {
            const appearAt = findWordFrame(KEY, g.phrase, guidesStart + (i + 1) * 25);
            const p = spring({ frame: frame - appearAt, fps, config: { damping: 14 } });
            if (frame < appearAt) return null;
            const y = 220 + i * 90;

            return (
              <React.Fragment key={i}>
                {/* Card */}
                <div style={{
                  position: 'absolute', left: 80, top: y,
                  width: 260, padding: '14px 18px', borderRadius: 10,
                  backgroundColor: C.card, border: `1px solid ${C.violet}`,
                  display: 'flex', alignItems: 'center', gap: 10,
                  transform: `translateX(${interpolate(p, [0, 1], [-60, 0])}px)`, opacity: p,
                }}>
                  <div style={{ fontSize: 22 }}>{g.icon}</div>
                  <div style={{ fontFamily: MONO, fontSize: 14, color: C.white }}>{g.text}</div>
                </div>
                {/* Arrow to orb */}
                <svg style={{ position: 'absolute', left: 340, top: y + 24, pointerEvents: 'none' }} width={540} height={4}>
                  <line x1={0} y1={2} x2={interpolate(p, [0, 1], [0, 540])} y2={2}
                    stroke={C.violet} strokeWidth={1.5} opacity={0.7} />
                </svg>
              </React.Fragment>
            );
          })}
        </>
      )}

      {/* SENSORS */}
      {frame >= sensorsStart && (
        <>
          <div style={{
            position: 'absolute', right: 80, top: 150, textAlign: 'right',
            fontFamily: MONO, fontSize: 15, color: C.dim, fontStyle: 'italic',
          }}>"nope — try again."</div>

          {SENSORS.map((s, i) => {
            const appearAt = findWordFrame(KEY, s.phrase, sensorsStart + (i + 1) * 25);
            const p = spring({ frame: frame - appearAt, fps, config: { damping: 14 } });
            if (frame < appearAt) return null;
            const y = 220 + i * 90;
            const verdictFlip = spring({ frame: frame - appearAt - 20, fps, config: { damping: 10 } });
            const color = s.verdict === 'pass' ? C.green : s.verdict === 'fail' ? C.red : C.violet;
            const mark = s.verdict === 'pass' ? '✓' : s.verdict === 'fail' ? '✗' : '✨';

            return (
              <React.Fragment key={i}>
                <div style={{
                  position: 'absolute', right: 80, top: y,
                  width: 260, padding: '14px 18px', borderRadius: 10,
                  backgroundColor: C.card, border: `1px solid ${color}`,
                  display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end',
                  transform: `translateX(${interpolate(p, [0, 1], [60, 0])}px)`, opacity: p,
                }}>
                  <div style={{ fontFamily: MONO, fontSize: 14, color: C.white }}>{s.text}</div>
                  <div style={{ fontSize: 20 }}>{s.icon}</div>
                  <div style={{
                    fontSize: 18, fontWeight: 900, color,
                    transform: `rotateY(${interpolate(verdictFlip, [0, 1], [0, 180])}deg)`,
                  }}>{mark}</div>
                </div>
                {/* Feedback arrow from sensor → orb (right-to-left) */}
                <svg style={{ position: 'absolute', right: 340, top: y + 24, pointerEvents: 'none' }} width={540} height={4}>
                  <line x1={540} y1={2} x2={540 - interpolate(p, [0, 1], [0, 540])} y2={2}
                    stroke={color} strokeWidth={1.5} opacity={0.6} />
                </svg>
              </React.Fragment>
            );
          })}
        </>
      )}

      {/* THE CLOSED LOOP — simplified (removed huge dashArray gradient) */}
      {loopP > 0 && (
        <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} width={1920} height={1080}>
          <ellipse
            cx={960} cy={540} rx={780} ry={420}
            fill="none" stroke={C.cyan} strokeWidth={2}
            opacity={0.4 * loopP}
          />
        </svg>
      )}

      {/* Takeaway */}
      {frame >= takeawayStart && (
        <div style={{
          position: 'absolute', bottom: 40, left: 0, right: 0, textAlign: 'center',
          opacity: interpolate(frame - takeawayStart, [0, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
        }}>
          <div style={{ fontFamily: INTER, fontSize: 36, fontWeight: 900, color: C.white, letterSpacing: 1 }}>
            This loop <span style={{ color: C.cyan }}>is the magic.</span>
          </div>
        </div>
      )}
    </div>
  );
};

export const HF03_TwoHalves: React.FC = () => (
  <Scene id="hf03">
    <Phase id="guides_sensors_split"><HF03_Inner /></Phase>
  </Scene>
);
