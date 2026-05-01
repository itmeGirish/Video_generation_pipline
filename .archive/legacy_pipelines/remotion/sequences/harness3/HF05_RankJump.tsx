import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { findWordFrame, getSceneDurationFrames } from '../../utils/audioSync';
import { ModelOrb, Bg } from '../harness2/HE01_HorseNoHarness';

const C = {
  bg: '#0A1628', amber: '#F59E0B', cyan: '#22D3EE',
  violet: '#A78BFA', green: '#22C55E', red: '#EF4444',
  white: '#E8F4FF', dim: '#6B7A94', card: '#111E34',
};
const INTER = 'Inter, sans-serif';
const MONO = 'JetBrains Mono, monospace';

const HarnessRing: React.FC<{ cx: number; cy: number; r: number; density: 'sparse' | 'dense' }> = ({ cx, cy, r, density }) => {
  const frame = useCurrentFrame();
  // Simplified — fewer circles, no inner ring
  const segments = density === 'sparse' ? 4 : 8;
  return (
    <svg style={{ position: 'absolute', left: cx - r - 30, top: cy - r - 30, pointerEvents: 'none' }}
      width={2 * r + 60} height={2 * r + 60}>
      <circle cx={r + 30} cy={r + 30} r={r} fill="none" stroke={C.cyan} strokeWidth={2} opacity={0.5} />
      {Array.from({ length: segments }).map((_, i) => {
        const a = (i / segments) * Math.PI * 2 + frame * 0.012;
        const x = r + 30 + Math.cos(a) * r;
        const y = r + 30 + Math.sin(a) * r;
        return (
          <circle key={i} cx={x} cy={y} r={density === 'sparse' ? 5 : 7}
            fill={C.cyan} opacity={density === 'sparse' ? 0.6 : 1} />
        );
      })}
    </svg>
  );
};

const HF05_Inner: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const KEY = 'hf05';
  const total = getSceneDurationFrames(KEY);

  const splitStart = findWordFrame(KEY, 'Same model', 180);
  const runsStart = findWordFrame(KEY, 'They run it', splitStart + 150);
  const revealStart = findWordFrame(KEY, 'Same exact model', total * 0.55);
  const secondDataStart = findWordFrame(KEY, 'research team', total * 0.78);
  const thesisStart = total - 120;

  // Rank counters
  const runsFrame = Math.max(0, frame - runsStart);
  const leftRank = Math.floor(interpolate(runsFrame, [0, 60, 120, 180], [48, 42, 36, 31], { extrapolateRight: 'clamp' }));
  const rightRank = Math.floor(interpolate(runsFrame, [0, 60, 120, 180], [48, 20, 12, 5], { extrapolateRight: 'clamp' }));

  // Opening direct-address
  if (frame < splitStart) {
    const text = '"But the model is what matters, right?"';
    const chars = Math.min(Math.floor(frame * 1.2), text.length);
    const cursor = Math.floor(frame / 10) % 2 === 0;
    return (
      <div style={{
        width: 1920, height: 1080, position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Bg />
        <div style={{
          fontFamily: INTER, fontSize: 56, fontWeight: 700, color: C.white,
          maxWidth: 1400, textAlign: 'center', letterSpacing: 1, fontStyle: 'italic',
        }}>
          {text.substring(0, chars)}
          {chars < text.length && cursor && <span style={{ color: C.cyan }}>▊</span>}
        </div>
      </div>
    );
  }

  if (frame < revealStart) {
    return (
      <div style={{ width: 1920, height: 1080, position: 'relative', overflow: 'hidden' }}>
        <Bg />
        {/* Header */}
        <div style={{
          position: 'absolute', top: 40, left: 0, right: 0, textAlign: 'center',
          fontFamily: INTER, fontSize: 22, fontWeight: 700, color: C.white, letterSpacing: 2,
          opacity: interpolate(frame - splitStart, [0, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
        }}>
          SAME MODEL: <span style={{ color: C.amber, fontFamily: MONO }}>GPT-5.2 Codex</span>
        </div>

        {/* Vertical split line */}
        <div style={{
          position: 'absolute', top: 110, bottom: 100, left: '50%',
          width: 2, background: `linear-gradient(180deg, transparent, ${C.white}33, transparent)`,
        }} />

        {/* LEFT — sparse harness */}
        <div style={{ position: 'absolute', left: 0, top: 90, width: '50%', height: 880 }}>
          <div style={{
            position: 'absolute', top: 40, left: 0, right: 0, textAlign: 'center',
            fontFamily: MONO, fontSize: 14, color: C.cyan, letterSpacing: 2,
          }}>HARNESS v1 — default</div>
          <ModelOrb x={480} y={370} size={120} />
          <HarnessRing cx={480} cy={370} r={120} density="sparse" />

          {/* Benchmark track */}
          {frame >= runsStart && Array.from({ length: 8 }).map((_, i) => {
            const taskStart = runsStart + i * 20;
            const p = interpolate(frame, [taskStart, taskStart + 40], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
            if (frame < taskStart) return null;
            const success = i === 2 || i === 5;
            return (
              <div key={i} style={{
                position: 'absolute', top: 560, left: interpolate(p, [0, 1], [20, 860]),
                fontFamily: MONO, fontSize: 11, padding: '4px 10px', borderRadius: 4,
                backgroundColor: success ? C.card : `${C.red}22`,
                color: C.white, border: `1px solid ${success ? C.dim : C.red}`,
              }}>
                task {i + 1} {success ? '✓' : '✗'}
              </div>
            );
          })}

          {/* Rank */}
          <div style={{ position: 'absolute', top: 640, left: 0, right: 0, textAlign: 'center' }}>
            <div style={{ fontFamily: MONO, fontSize: 12, color: C.dim, letterSpacing: 2, marginBottom: 8 }}>LEADERBOARD</div>
            <div style={{ fontFamily: INTER, fontSize: 90, fontWeight: 900, color: C.red, lineHeight: 1 }}>
              #{leftRank}+
            </div>
            <div style={{
              fontFamily: MONO, fontSize: 13, color: C.red, letterSpacing: 3, marginTop: 16,
              opacity: runsFrame > 180 ? 1 : 0,
            }}>OUT OF TOP 30</div>
          </div>
        </div>

        {/* RIGHT — dense harness */}
        <div style={{ position: 'absolute', right: 0, top: 90, width: '50%', height: 880 }}>
          <div style={{
            position: 'absolute', top: 40, left: 0, right: 0, textAlign: 'center',
            fontFamily: MONO, fontSize: 14, color: C.cyan, letterSpacing: 2,
          }}>HARNESS v2 — tuned</div>
          <ModelOrb x={480} y={370} size={120} />
          <HarnessRing cx={480} cy={370} r={140} density="dense" />

          {frame >= runsStart && Array.from({ length: 8 }).map((_, i) => {
            const taskStart = runsStart + i * 20;
            const p = interpolate(frame, [taskStart, taskStart + 40], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
            if (frame < taskStart) return null;
            const success = i !== 3;
            return (
              <div key={i} style={{
                position: 'absolute', top: 560, left: interpolate(p, [0, 1], [20, 860]),
                fontFamily: MONO, fontSize: 11, padding: '4px 10px', borderRadius: 4,
                backgroundColor: success ? `${C.green}22` : `${C.red}22`,
                color: C.white, border: `1px solid ${success ? C.green : C.red}`,
              }}>
                task {i + 1} {success ? '✓' : '✗'}
              </div>
            );
          })}

          <div style={{ position: 'absolute', top: 640, left: 0, right: 0, textAlign: 'center' }}>
            <div style={{ fontFamily: MONO, fontSize: 12, color: C.dim, letterSpacing: 2, marginBottom: 8 }}>LEADERBOARD</div>
            <div style={{ fontFamily: INTER, fontSize: 90, fontWeight: 900, color: C.green, lineHeight: 1 }}>
              #{rightRank}
            </div>
            <div style={{
              fontFamily: MONO, fontSize: 13, color: C.green, letterSpacing: 3, marginTop: 16,
              opacity: runsFrame > 180 ? 1 : 0,
            }}>TOP OF LEADERBOARD</div>
          </div>
        </div>
      </div>
    );
  }

  // Reveal phase
  if (frame < secondDataStart) {
    const revFrame = frame - revealStart;
    const textSpring = spring({ frame: revFrame, fps, config: { damping: 14 } });
    return (
      <div style={{
        width: 1920, height: 1080, position: 'relative',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <Bg />
        <div style={{
          fontFamily: INTER, fontSize: 56, fontWeight: 900, color: C.white, letterSpacing: 2,
          transform: `scale(${textSpring})`, opacity: textSpring, marginBottom: 40,
        }}>
          Same. <span style={{ color: C.amber }}>Exact.</span> Model.
        </div>
        <ModelOrb x={960} y={540} size={200} />
        <div style={{
          position: 'absolute', top: '50%', left: 200, fontFamily: MONO, fontSize: 28, color: C.red, fontWeight: 700,
          opacity: revFrame > 40 ? 1 : 0,
        }}>
          ← rank 30+
        </div>
        <div style={{
          position: 'absolute', top: '50%', right: 200, fontFamily: MONO, fontSize: 28, color: C.green, fontWeight: 700,
          opacity: revFrame > 40 ? 1 : 0,
        }}>
          rank 5 →
        </div>
        <div style={{
          fontFamily: INTER, fontSize: 22, color: C.cyan, marginTop: 100, letterSpacing: 1, fontWeight: 700,
          opacity: revFrame > 80 ? 1 : 0,
        }}>
          Only the harness changed.
        </div>
      </div>
    );
  }

  if (frame < thesisStart) {
    const sFrame = frame - secondDataStart;
    return (
      <div style={{
        width: 1920, height: 1080, position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Bg />
        <div style={{
          width: 1100, padding: 50, borderRadius: 24,
          backgroundColor: C.card, border: `2px solid ${C.violet}`,
          textAlign: 'center', boxShadow: `0 0 40px ${C.violet}33`,
          opacity: interpolate(sFrame, [0, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
        }}>
          <div style={{
            fontFamily: MONO, fontSize: 14, color: C.violet, letterSpacing: 3, marginBottom: 16,
          }}>RESEARCH TEAM · LLM-OPTIMIZED HARNESS</div>
          <div style={{ fontFamily: INTER, fontSize: 130, fontWeight: 900, color: C.green, lineHeight: 1 }}>
            76%
          </div>
          <div style={{ fontFamily: INTER, fontSize: 20, color: C.white, marginTop: 16, fontWeight: 600 }}>
            task pass rate — beat every human-built system.
          </div>
          <svg width={500} height={80} style={{ marginTop: 30 }}>
            <path
              d={`M 0 70 L 120 65 L 240 55 L 340 35 L 420 15 L 500 5`}
              fill="none" stroke={C.green} strokeWidth={3}
              strokeDasharray={600}
              strokeDashoffset={interpolate(sFrame, [0, 80], [600, 0], { extrapolateRight: 'clamp' })}
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
    );
  }

  // Thesis
  const tFrame = frame - thesisStart;
  return (
    <div style={{
      width: 1920, height: 1080, position: 'relative',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 30,
    }}>
      <Bg />
      <div style={{
        fontFamily: INTER, fontSize: 80, fontWeight: 900, color: C.amber, letterSpacing: 1,
        opacity: interpolate(tFrame, [0, 15], [0, 1], { extrapolateRight: 'clamp' }),
      }}>
        The model is the horse.
      </div>
      <div style={{
        fontFamily: INTER, fontSize: 80, fontWeight: 900, color: C.cyan, letterSpacing: 1,
        textShadow: `0 0 40px ${C.cyan}66`,
        opacity: interpolate(tFrame, [20, 40], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
      }}>
        The harness is the race.
      </div>
    </div>
  );
};

import { Scene, Phase } from '../../storyboard/Scene';
export const HF05_RankJump: React.FC = () => (
  <Scene id="hf05"><Phase id="full_scene"><HF05_Inner /></Phase></Scene>
);
