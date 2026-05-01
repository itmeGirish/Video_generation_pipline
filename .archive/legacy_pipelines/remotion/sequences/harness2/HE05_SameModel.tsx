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

// Compact harness ring visualization
const HarnessRing: React.FC<{ cx: number; cy: number; r: number; density: 'simple' | 'dense' }> = ({ cx, cy, r, density }) => {
  const frame = useCurrentFrame();
  const segments = density === 'simple' ? 4 : 10;
  return (
    <svg style={{ position: 'absolute', left: cx - r - 20, top: cy - r - 20, pointerEvents: 'none' }}
      width={2 * r + 40} height={2 * r + 40}>
      <circle cx={r + 20} cy={r + 20} r={r} fill="none"
        stroke={C.cyan} strokeWidth={2} opacity={0.6} />
      {Array.from({ length: segments }).map((_, i) => {
        const angle = (i / segments) * Math.PI * 2 + frame * 0.01;
        const x = r + 20 + Math.cos(angle) * r;
        const y = r + 20 + Math.sin(angle) * r;
        return (
          <circle key={i} cx={x} cy={y} r={density === 'simple' ? 5 : 7}
            fill={C.cyan} opacity={density === 'simple' ? 0.6 : 1} />
        );
      })}
    </svg>
  );
};

export const HE05_SameModel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const KEY = 'he05';
  const total = getSceneDurationFrames(KEY);

  // Phases
  const runStart = findWordFrame(KEY, 'benchmark called', 150);
  const mergeStart = findWordFrame(KEY, 'Same exact model', total * 0.55);
  const secondPointStart = findWordFrame(KEY, 'seventy-six percent', total * 0.75);
  const thesisStart = findWordFrame(KEY, 'harness is the race', total - 180);

  // Run benchmark counters
  const runFrame = frame - runStart;
  const leftRank = Math.floor(interpolate(runFrame, [0, 180], [50, 30], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  const rightRank = Math.floor(interpolate(runFrame, [0, 180], [50, 5], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));

  return (
    <div style={{ width: 1920, height: 1080, position: 'relative', overflow: 'hidden' }}>
      <Bg />

      {/* Header */}
      <div style={{
        position: 'absolute', top: 50, left: 0, right: 0, textAlign: 'center',
        fontFamily: INTER, fontSize: 22, fontWeight: 700, color: C.white, letterSpacing: 2,
        opacity: interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' }),
      }}>
        SAME MODEL — <span style={{ color: C.amber, fontFamily: MONO }}>gpt-5.2-codex</span>
      </div>

      {frame < mergeStart && (
        <>
          {/* Vertical divider */}
          <div style={{
            position: 'absolute', top: 120, bottom: 120, left: '50%',
            width: 1, backgroundColor: C.dim,
          }} />

          {/* LEFT side — Simple harness */}
          <div style={{ position: 'absolute', left: 0, top: 110, width: '50%', height: 850 }}>
            <div style={{
              position: 'absolute', top: 30, left: 0, right: 0, textAlign: 'center',
              fontFamily: MONO, fontSize: 14, color: C.cyan, letterSpacing: 2,
            }}>HARNESS v1 — default</div>
            <ModelOrb x={480} y={380} size={120} />
            <HarnessRing cx={480} cy={380} r={120} density="simple" />

            {/* Task flows */}
            {frame >= runStart && Array.from({ length: 5 }).map((_, i) => {
              const taskStart = runStart + i * 30;
              const p = interpolate(frame, [taskStart, taskStart + 40], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
              if (frame < taskStart) return null;
              const success = i === 0 || i === 3;
              return (
                <React.Fragment key={i}>
                  <div style={{
                    position: 'absolute', top: 550, left: interpolate(p, [0, 1], [60, 820]),
                    fontFamily: MONO, fontSize: 11, color: C.white,
                    padding: '4px 10px', borderRadius: 4, backgroundColor: C.card,
                  }}>
                    task #{i + 1}
                  </div>
                  {p >= 1 && (
                    <div style={{
                      position: 'absolute', top: 546, left: 830,
                      fontSize: 20, color: success ? C.green : C.red,
                    }}>{success ? '✓' : '✗'}</div>
                  )}
                </React.Fragment>
              );
            })}

            {/* Rank */}
            <div style={{
              position: 'absolute', top: 650, left: 0, right: 0, textAlign: 'center',
              fontFamily: INTER, fontSize: 72, fontWeight: 900, color: C.red,
            }}>
              #{leftRank}+
            </div>
            <div style={{
              position: 'absolute', top: 740, left: 0, right: 0, textAlign: 'center',
              fontFamily: MONO, fontSize: 13, color: C.red, letterSpacing: 2,
              opacity: runFrame > 180 ? 1 : 0,
            }}>OUT OF TOP 30</div>
          </div>

          {/* RIGHT side — Tuned harness */}
          <div style={{ position: 'absolute', right: 0, top: 110, width: '50%', height: 850 }}>
            <div style={{
              position: 'absolute', top: 30, left: 0, right: 0, textAlign: 'center',
              fontFamily: MONO, fontSize: 14, color: C.cyan, letterSpacing: 2,
            }}>HARNESS v2 — tuned</div>
            <ModelOrb x={480} y={380} size={120} />
            <HarnessRing cx={480} cy={380} r={140} density="dense" />
            <HarnessRing cx={480} cy={380} r={110} density="dense" />

            {/* Task flows (mostly green) */}
            {frame >= runStart && Array.from({ length: 5 }).map((_, i) => {
              const taskStart = runStart + i * 30;
              const p = interpolate(frame, [taskStart, taskStart + 40], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
              if (frame < taskStart) return null;
              const success = i !== 1;
              return (
                <React.Fragment key={i}>
                  <div style={{
                    position: 'absolute', top: 550, left: interpolate(p, [0, 1], [60, 820]),
                    fontFamily: MONO, fontSize: 11, color: C.white,
                    padding: '4px 10px', borderRadius: 4, backgroundColor: C.card,
                  }}>
                    task #{i + 1}
                  </div>
                  {p >= 1 && (
                    <div style={{
                      position: 'absolute', top: 546, left: 830,
                      fontSize: 20, color: success ? C.green : C.red,
                    }}>{success ? '✓' : '✗'}</div>
                  )}
                </React.Fragment>
              );
            })}

            {/* Rank */}
            <div style={{
              position: 'absolute', top: 650, left: 0, right: 0, textAlign: 'center',
              fontFamily: INTER, fontSize: 72, fontWeight: 900, color: C.green,
            }}>
              #{rightRank}
            </div>
            <div style={{
              position: 'absolute', top: 740, left: 0, right: 0, textAlign: 'center',
              fontFamily: MONO, fontSize: 13, color: C.green, letterSpacing: 2,
              opacity: runFrame > 180 ? 1 : 0,
            }}>RANK #5 — TOP TIER</div>
          </div>
        </>
      )}

      {/* Merge phase */}
      {frame >= mergeStart && frame < secondPointStart && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            fontFamily: INTER, fontSize: 42, fontWeight: 900, color: C.white, letterSpacing: 2,
            marginBottom: 30,
          }}>Same. Exact. Model.</div>
          <ModelOrb x={960} y={520} size={180} />
          {/* Arrows pointing both ways */}
          <div style={{
            position: 'absolute', top: 540, left: 200, right: 200,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div style={{ fontFamily: MONO, fontSize: 22, color: C.red }}>← → #30+</div>
            <div style={{ fontFamily: MONO, fontSize: 22, color: C.green }}>→ #5 →</div>
          </div>
          <div style={{ marginTop: 80, fontFamily: INTER, fontSize: 20, color: C.cyan, letterSpacing: 1 }}>
            Only the harness changed.
          </div>
        </div>
      )}

      {/* Second data point */}
      {frame >= secondPointStart && frame < thesisStart && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: interpolate(frame - secondPointStart, [0, 30], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
        }}>
          <div style={{
            padding: 50, borderRadius: 20, width: 900,
            backgroundColor: C.card, border: `1px solid ${C.violet}`,
            textAlign: 'center',
          }}>
            <div style={{ fontFamily: MONO, fontSize: 14, color: C.violet, letterSpacing: 2, marginBottom: 12 }}>
              RESEARCH GROUP · LLM-OPTIMIZED HARNESS
            </div>
            <div style={{ fontFamily: INTER, fontSize: 80, fontWeight: 900, color: C.green }}>
              76%
            </div>
            <div style={{ fontFamily: INTER, fontSize: 18, color: C.white, marginTop: 12 }}>
              task pass rate — beat every hand-built system.
            </div>
            {/* Sparkline */}
            <svg width={400} height={60} style={{ marginTop: 24 }}>
              <path
                d={`M 0 50 L 100 48 L 200 40 L 280 30 L 360 10 L 400 5`}
                fill="none" stroke={C.green} strokeWidth={2.5}
                strokeDasharray={500}
                strokeDashoffset={interpolate(frame - secondPointStart, [0, 80], [500, 0], { extrapolateRight: 'clamp' })}
              />
            </svg>
          </div>
        </div>
      )}

      {/* Thesis */}
      {frame >= thesisStart && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: interpolate(frame - thesisStart, [0, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
          textAlign: 'center',
        }}>
          <div>
            <div style={{ fontFamily: INTER, fontSize: 64, fontWeight: 900, color: C.amber, letterSpacing: 1 }}>
              The model is the horse.
            </div>
            <div style={{ fontFamily: INTER, fontSize: 64, fontWeight: 900, color: C.cyan, letterSpacing: 1, marginTop: 20 }}>
              The harness is the race.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
