import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { findWordFrame, getSceneDurationFrames } from '../../utils/audioSync';
import { ModelOrb, Bg } from './HE01_HorseNoHarness';

const C = {
  bg: '#0A1628', amber: '#F59E0B', cyan: '#22D3EE',
  violet: '#A78BFA', green: '#22C55E', red: '#EF4444',
  white: '#E8F4FF', dim: '#6B7A94', card: '#111E34',
};
const INTER = 'Inter, sans-serif';
const MONO = 'JetBrains Mono, monospace';

const GUIDES = [
  { icon: '📄', text: 'AGENTS.md',            phrase: 'AGENTS' },
  { icon: '⚙️', text: 'system_prompt.txt',    phrase: 'system prompt' },
  { icon: '📁', text: '/skills/code-review',  phrase: 'skill describing' },
  { icon: '📏', text: 'linter rules',         phrase: 'linter rule' },
  { icon: '📖', text: 'coding conventions',   phrase: 'coding convention' },
];

const SENSORS = [
  { icon: '🧪', text: 'unit tests',          phrase: 'tests',         verdict: 'pass' as const },
  { icon: '<T>',text: 'type checker',        phrase: 'type checkers', verdict: 'pass' as const },
  { icon: '🔍', text: 'static analysis',     phrase: 'static analysis', verdict: 'fail' as const },
  { icon: '🤖', text: 'review agent',        phrase: 'review agent',  verdict: 'pass' as const },
  { icon: '🌿', text: 'pre-commit hook',     phrase: 'runs every commit', verdict: 'pass' as const },
];

export const HE03_GuidesSensors: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const KEY = 'he03';
  const total = getSceneDurationFrames(KEY);

  const guidesStart  = findWordFrame(KEY, 'first half is guides', 150);
  const sensorsStart  = findWordFrame(KEY, 'second half is sensors', total * 0.4);
  const loopStart    = findWordFrame(KEY, 'Together they form', total - 400);

  const centerX = 960;
  const centerY = 540;

  return (
    <div style={{ width: 1920, height: 1080, position: 'relative', overflow: 'hidden' }}>
      <Bg />

      {/* BEFORE / AFTER spine */}
      <div style={{
        position: 'absolute', left: 200, top: 120,
        fontFamily: INTER, fontSize: 18, fontWeight: 700, color: C.violet, letterSpacing: 4,
      }}>
        BEFORE
      </div>
      <div style={{
        position: 'absolute', right: 200, top: 120,
        fontFamily: INTER, fontSize: 18, fontWeight: 700, color: C.green, letterSpacing: 4,
      }}>
        AFTER
      </div>

      {/* Model orb in center */}
      <ModelOrb x={centerX} y={centerY} size={140} />

      {/* Guides on left */}
      {frame >= guidesStart && (
        <>
          <div style={{
            position: 'absolute', left: 60, top: 180,
            fontFamily: INTER, fontSize: 22, fontWeight: 800, color: C.violet, letterSpacing: 1,
          }}>
            GUIDES → feedforward
          </div>
          <div style={{
            position: 'absolute', left: 60, top: 215,
            fontFamily: MONO, fontSize: 14, color: C.dim,
          }}>
            steer the model before it acts.
          </div>

          {GUIDES.map((g, i) => {
            const appearFrame = findWordFrame(KEY, g.phrase, guidesStart + (i + 1) * 50);
            const p = spring({ frame: frame - appearFrame, fps, config: { damping: 14 } });
            if (frame < appearFrame) return null;
            const y = 270 + i * 80;

            return (
              <React.Fragment key={i}>
                <div style={{
                  position: 'absolute', left: 60, top: y,
                  width: 260, padding: '12px 16px', borderRadius: 10,
                  backgroundColor: C.card, border: `1px solid ${C.violet}`,
                  display: 'flex', alignItems: 'center', gap: 10,
                  transform: `translateX(${interpolate(p, [0, 1], [-40, 0])}px)`,
                  opacity: p,
                }}>
                  <div style={{ fontSize: 20 }}>{g.icon}</div>
                  <div style={{ fontFamily: MONO, fontSize: 13, color: C.white }}>{g.text}</div>
                </div>
                {/* Arrow */}
                <svg style={{ position: 'absolute', left: 320, top: y + 24, pointerEvents: 'none' }} width={560} height={4}>
                  <line x1={0} y1={2} x2={interpolate(p, [0, 1], [0, 560])} y2={2}
                    stroke={C.violet} strokeWidth={1.5} opacity={0.7} />
                </svg>
              </React.Fragment>
            );
          })}
        </>
      )}

      {/* Sensors on right */}
      {frame >= sensorsStart && (
        <>
          <div style={{
            position: 'absolute', right: 60, top: 180,
            fontFamily: INTER, fontSize: 22, fontWeight: 800, color: C.green, letterSpacing: 1,
            textAlign: 'right',
          }}>
            SENSORS → feedback
          </div>
          <div style={{
            position: 'absolute', right: 60, top: 215,
            fontFamily: MONO, fontSize: 14, color: C.dim, textAlign: 'right',
          }}>
            catch mistakes — feed them back.
          </div>

          {SENSORS.map((s, i) => {
            const appearFrame = findWordFrame(KEY, s.phrase, sensorsStart + (i + 1) * 50);
            const p = spring({ frame: frame - appearFrame, fps, config: { damping: 14 } });
            if (frame < appearFrame) return null;
            const y = 270 + i * 80;

            const verdictFlip = spring({ frame: frame - appearFrame - 20, fps, config: { damping: 10 } });
            const color = s.verdict === 'pass' ? C.green : C.red;

            return (
              <React.Fragment key={i}>
                <div style={{
                  position: 'absolute', right: 60, top: y,
                  width: 260, padding: '12px 16px', borderRadius: 10,
                  backgroundColor: C.card, border: `1px solid ${color}`,
                  display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end',
                  transform: `translateX(${interpolate(p, [0, 1], [40, 0])}px)`,
                  opacity: p,
                }}>
                  <div style={{ fontFamily: MONO, fontSize: 13, color: C.white }}>{s.text}</div>
                  <div style={{ fontSize: 20 }}>{s.icon}</div>
                  {/* Verdict badge */}
                  <div style={{
                    fontSize: 18, fontWeight: 900, color,
                    transform: `rotateY(${interpolate(verdictFlip, [0, 1], [0, 180])}deg)`,
                    marginLeft: 4,
                  }}>
                    {s.verdict === 'pass' ? '✓' : '✗'}
                  </div>
                </div>
                {/* Feedback arrow (from sensor to orb) */}
                <svg style={{ position: 'absolute', right: 320, top: y + 24, pointerEvents: 'none' }} width={560} height={4}>
                  <line x1={560} y1={2} x2={560 - interpolate(p, [0, 1], [0, 560])} y2={2}
                    stroke={color} strokeWidth={1.5} opacity={0.6} />
                </svg>
              </React.Fragment>
            );
          })}
        </>
      )}

      {/* Closing loop */}
      {frame >= loopStart && (
        <div style={{
          position: 'absolute', bottom: 70, left: 0, right: 0, textAlign: 'center',
          opacity: interpolate(frame - loopStart, [0, 30], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
        }}>
          <div style={{ fontFamily: INTER, fontSize: 26, fontWeight: 700, color: C.white, letterSpacing: 1 }}>
            This loop <span style={{ color: C.cyan }}>— not the model —</span> is where reliability comes from.
          </div>
        </div>
      )}
    </div>
  );
};
