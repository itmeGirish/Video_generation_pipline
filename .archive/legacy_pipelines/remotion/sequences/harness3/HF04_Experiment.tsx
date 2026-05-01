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

const UPGRADES = [
  '+ new tool: semantic_search',
  '+ AGENTS.md v2 (shorter, sharper)',
  '+ custom linter: no inline SQL',
  '+ review agent: complexity check',
  '+ sandbox: allow-list commands',
  '+ skill: how-to-test-this-codebase',
];

const HF04_Inner: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const KEY = 'hf04';
  const total = getSceneDurationFrames(KEY);

  const callbackStart = 0;
  const timelineStart = findWordFrame(KEY, 'August 2025', 150);
  const month1Start = findWordFrame(KEY, 'Month one', timelineStart + 300);
  const compoundStart = findWordFrame(KEY, 'did not fix the code', month1Start + 100);
  const statsStart = findWordFrame(KEY, 'one million lines', total - 400);
  const quoteStart = findWordFrame(KEY, 'wild', total - 150);

  // Counters
  const tlFrame = Math.max(0, frame - timelineStart);
  const tlProgress = interpolate(tlFrame, [0, 500], [0, 1], { extrapolateRight: 'clamp' });
  // Pause during month1 "disaster"
  const pausedAt = interpolate(frame - month1Start, [0, 30], [0.2, 0.2], { extrapolateRight: 'clamp' });
  const pauseHold = frame > month1Start && frame < compoundStart;
  const effectiveProgress = pauseHold ? 0.2 : (frame > compoundStart ? 0.2 + interpolate(frame - compoundStart, [0, 400], [0, 0.8], { extrapolateRight: 'clamp' }) : tlProgress);

  const prCount = Math.floor(interpolate(effectiveProgress, [0, 1], [0, 1500]));
  const locCount = Math.floor(Math.pow(effectiveProgress, 2.3) * 1_000_000);

  // Upgrade blocks (Tetris)
  const upgradeBlocks = UPGRADES.map((u, i) => ({
    text: u,
    dropFrame: compoundStart + 20 + i * 25,
  }));

  return (
    <div style={{ width: 1920, height: 1080, position: 'relative', overflow: 'hidden' }}>
      <Bg />

      {/* Callback header */}
      <div style={{
        position: 'absolute', top: 30, left: 60, right: 60,
        opacity: interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' }),
        display: 'flex', gap: 20, alignItems: 'center',
      }}>
        <div style={{
          padding: '8px 14px', borderRadius: 6, backgroundColor: C.card,
          fontFamily: MONO, fontSize: 12, color: C.amber, letterSpacing: 1,
        }}>1,000,000 · 5 months · 0 humans</div>
        <div style={{ fontFamily: INTER, fontSize: 16, fontWeight: 700, color: C.cyan }}>How they did it.</div>
      </div>

      {/* Counters */}
      <div style={{
        position: 'absolute', top: 120, right: 60, display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        <div style={{ padding: '12px 18px', borderRadius: 10, backgroundColor: C.card, border: `1px solid ${C.green}` }}>
          <div style={{ fontFamily: MONO, fontSize: 10, color: C.green, letterSpacing: 2 }}>LINES OF CODE</div>
          <div style={{ fontFamily: INTER, fontSize: 34, fontWeight: 900, color: C.white }}>{locCount.toLocaleString()}</div>
        </div>
        <div style={{ padding: '12px 18px', borderRadius: 10, backgroundColor: C.card, border: `1px solid ${C.cyan}` }}>
          <div style={{ fontFamily: MONO, fontSize: 10, color: C.cyan, letterSpacing: 2 }}>PULL REQUESTS</div>
          <div style={{ fontFamily: INTER, fontSize: 34, fontWeight: 900, color: C.white }}>{prCount.toLocaleString()}</div>
        </div>
        <div style={{
          padding: '12px 18px', borderRadius: 10, backgroundColor: C.card,
          border: `2px solid ${C.red}`,
        }}>
          <div style={{ fontFamily: MONO, fontSize: 10, color: C.red, letterSpacing: 2 }}>HUMAN-WRITTEN</div>
          <div style={{ fontFamily: INTER, fontSize: 34, fontWeight: 900, color: C.red,
            opacity: 0.7 + 0.3 * Math.sin(frame * 0.1) }}>0</div>
        </div>
      </div>

      {/* Timeline */}
      {frame >= timelineStart && frame < statsStart && (
        <>
          <div style={{
            position: 'absolute', bottom: 130, left: 120, right: 240,
            height: 4, backgroundColor: C.dim, borderRadius: 2,
          }}>
            <div style={{
              width: `${effectiveProgress * 100}%`, height: '100%',
              background: `linear-gradient(90deg, ${C.amber}, ${C.cyan})`, borderRadius: 2,
            }} />
            {/* Playhead */}
            <div style={{
              position: 'absolute', top: -8, left: `${effectiveProgress * 100}%`,
              width: 4, height: 20, backgroundColor: C.cyan, borderRadius: 2,
              boxShadow: `0 0 10px ${C.cyan}`,
            }} />
          </div>
          <div style={{
            position: 'absolute', bottom: 100, left: 120, fontFamily: MONO, fontSize: 12, color: C.dim,
          }}>Aug 2025</div>
          <div style={{
            position: 'absolute', bottom: 100, right: 240, fontFamily: MONO, fontSize: 12, color: C.dim,
          }}>Jan 2026</div>
        </>
      )}

      {/* Month 1 disaster */}
      {frame >= month1Start && frame < compoundStart && (
        <div style={{
          position: 'absolute', top: 320, left: 120, right: 280, textAlign: 'center',
          opacity: interpolate(frame - month1Start, [0, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
        }}>
          <div style={{ fontSize: 120 }}>❌</div>
          <div style={{ fontFamily: INTER, fontSize: 36, fontWeight: 900, color: C.red, marginTop: 10, letterSpacing: 2 }}>
            MONTH 1: moving at 1/10 speed
          </div>
        </div>
      )}

      {/* Compounding key line */}
      {frame >= compoundStart && frame < statsStart && (
        <div style={{
          position: 'absolute', top: 180, left: 120, right: 280, textAlign: 'center',
          opacity: interpolate(frame - compoundStart, [0, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
        }}>
          <div style={{
            display: 'inline-block', padding: '12px 24px', borderRadius: 8,
            backgroundColor: C.card, border: `2px solid ${C.cyan}`,
            fontFamily: INTER, fontSize: 22, fontWeight: 800, color: C.white, letterSpacing: 1,
          }}>
            They didn't fix the code. They fixed the <span style={{ color: C.cyan }}>HARNESS.</span>
          </div>
        </div>
      )}

      {/* Tetris upgrade blocks */}
      {frame >= compoundStart && frame < statsStart && upgradeBlocks.map((u, i) => {
        if (frame < u.dropFrame) return null;
        const fall = spring({ frame: frame - u.dropFrame, fps, config: { damping: 10 } });
        return (
          <div key={i} style={{
            position: 'absolute', left: 120 + i * 240, top: interpolate(fall, [0, 1], [-100, 280]),
            padding: '10px 14px', borderRadius: 6,
            backgroundColor: C.cyan, color: C.bg,
            fontFamily: MONO, fontSize: 11, fontWeight: 800, whiteSpace: 'nowrap',
            opacity: fall,
          }}>
            {u.text}
          </div>
        );
      })}

      {/* Final stats */}
      {frame >= statsStart && frame < quoteStart && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30,
          padding: 120, alignItems: 'center', justifyItems: 'center',
        }}>
          {[
            { big: '1,000,000+', label: 'lines of code', color: C.green },
            { big: '1,500+', label: 'pull requests', color: C.cyan },
            { big: '0', label: 'human-written lines', color: C.red },
            { big: '10×', label: 'faster than manual', color: C.amber },
          ].map((stat, i) => {
            const p = spring({ frame: frame - statsStart - i * 15, fps, config: { damping: 12, stiffness: 140 } });
            return (
              <div key={i} style={{
                width: 400, padding: 40, borderRadius: 20,
                backgroundColor: C.card, border: `2px solid ${stat.color}`,
                boxShadow: `0 0 30px ${stat.color}44`,
                textAlign: 'center',
                transform: `scale(${p})`, opacity: p,
              }}>
                <div style={{ fontFamily: INTER, fontSize: 72, fontWeight: 900, color: stat.color, lineHeight: 1 }}>{stat.big}</div>
                <div style={{ fontFamily: MONO, fontSize: 13, color: C.white, marginTop: 12 }}>{stat.label}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quote */}
      {frame >= quoteStart && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: interpolate(frame - quoteStart, [0, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
        }}>
          <div style={{
            maxWidth: 1200, padding: 50, borderRadius: 20,
            backgroundColor: C.card, border: `1px solid ${C.violet}`,
            textAlign: 'center',
          }}>
            <div style={{ fontFamily: INTER, fontSize: 32, fontStyle: 'italic', color: C.white, lineHeight: 1.4 }}>
              "We didn't write the code. We designed the environment that let the agent write it."
            </div>
            <div style={{ fontFamily: MONO, fontSize: 16, color: C.violet, marginTop: 20 }}>
              — Ryan Lopopolo, OpenAI Frontier
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import { Scene, Phase } from '../../storyboard/Scene';
export const HF04_Experiment: React.FC = () => (
  <Scene id="hf04"><Phase id="full_scene"><HF04_Inner /></Phase></Scene>
);
