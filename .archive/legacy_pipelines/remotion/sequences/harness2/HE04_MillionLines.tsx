import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { findWordFrame, getSceneDurationFrames } from '../../utils/audioSync';
import { Bg } from './HE01_HorseNoHarness';

const C = {
  bg: '#0A1628', amber: '#F59E0B', cyan: '#22D3EE',
  violet: '#A78BFA', green: '#22C55E', red: '#EF4444',
  white: '#E8F4FF', dim: '#6B7A94', card: '#111E34',
};
const INTER = 'Inter, sans-serif';
const MONO = 'JetBrains Mono, monospace';

export const HE04_MillionLines: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const KEY = 'he04';
  const total = getSceneDurationFrames(KEY);

  // Phase markers
  const growStart = findWordFrame(KEY, 'empty repository', 150);
  const compoundStart = findWordFrame(KEY, 'moved at one-tenth', 700);
  const statsStart = findWordFrame(KEY, 'paid the upfront', 1150);
  const quoteStart = findWordFrame(KEY, 'rise of harness engineering', total - 300);

  // Counters during grow phase
  const growFrame = frame - growStart;
  const prCount = Math.floor(interpolate(growFrame, [0, 420], [0, 1500], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  // Log-curve for LOC
  const locP = interpolate(growFrame, [0, 420], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const locCurve = Math.pow(locP, 2.2);
  const locCount = Math.floor(locCurve * 1_000_000);

  // After compound moment, speed increases
  const afterCompound = frame >= compoundStart;
  const compoundBoost = afterCompound ? interpolate(frame - compoundStart, [0, 180], [1, 2.5], { extrapolateRight: 'clamp' }) : 1;

  // PR node dots
  const prDotCount = Math.min(60, Math.floor((frame - growStart) / 8));

  return (
    <div style={{ width: 1920, height: 1080, position: 'relative', overflow: 'hidden' }}>
      <Bg />

      {/* Timestamp card top-left */}
      <div style={{
        position: 'absolute', top: 40, left: 60,
        padding: '16px 24px', borderRadius: 10,
        backgroundColor: C.card, border: `1px solid ${C.amber}66`,
        opacity: interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' }),
      }}>
        <div style={{ fontFamily: INTER, fontSize: 16, fontWeight: 800, color: C.amber, letterSpacing: 2 }}>
          OpenAI Frontier Team · Aug 2025
        </div>
        <div style={{ fontFamily: MONO, fontSize: 13, color: C.dim, marginTop: 6 }}>
          Experiment: Zero Human-Written Code
        </div>
      </div>

      {/* Center repo viz */}
      {frame >= growStart && frame < statsStart && (
        <div style={{
          position: 'absolute', left: '50%', top: 320,
          transform: 'translateX(-50%)', textAlign: 'center',
        }}>
          <div style={{ fontFamily: MONO, fontSize: 14, color: C.cyan, marginBottom: 16 }}>main</div>
          {/* PR cluster */}
          <div style={{ position: 'relative', width: 500, height: 180 }}>
            {Array.from({ length: prDotCount }).map((_, i) => {
              const angle = (i * 137.5) * Math.PI / 180;
              const r = 10 + Math.sqrt(i) * 12;
              const x = 250 + Math.cos(angle) * r;
              const y = 90 + Math.sin(angle) * r;
              return (
                <div key={i} style={{
                  position: 'absolute', left: x - 3, top: y - 3,
                  width: 6, height: 6, borderRadius: '50%',
                  backgroundColor: afterCompound ? C.green : C.amber,
                  opacity: 0.8,
                }} />
              );
            })}
            {/* Main node */}
            <div style={{
              position: 'absolute', left: 240, top: 80,
              width: 20, height: 20, borderRadius: '50%',
              backgroundColor: C.cyan,
              boxShadow: `0 0 15px ${C.cyan}`,
            }} />
          </div>
        </div>
      )}

      {/* Counters */}
      {frame >= growStart && frame < statsStart && (
        <div style={{
          position: 'absolute', top: 120, right: 60,
          display: 'flex', flexDirection: 'column', gap: 16,
        }}>
          {/* Human lines */}
          <div style={{
            padding: '16px 24px', borderRadius: 12,
            backgroundColor: C.card, border: `2px solid ${C.red}`,
            boxShadow: `0 0 20px ${C.red}44`,
          }}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: C.red, letterSpacing: 2 }}>HUMAN LINES</div>
            <div style={{ fontFamily: INTER, fontSize: 48, fontWeight: 900, color: C.red, lineHeight: 1 }}>0</div>
          </div>
          {/* PR count */}
          <div style={{
            padding: '16px 24px', borderRadius: 12,
            backgroundColor: C.card, border: `1px solid ${C.cyan}`,
          }}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: C.cyan, letterSpacing: 2 }}>PULL REQUESTS</div>
            <div style={{ fontFamily: INTER, fontSize: 40, fontWeight: 800, color: C.white, lineHeight: 1 }}>
              {prCount.toLocaleString()}
            </div>
          </div>
          {/* LOC */}
          <div style={{
            padding: '16px 24px', borderRadius: 12,
            backgroundColor: C.card, border: `1px solid ${C.green}`,
          }}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: C.green, letterSpacing: 2 }}>LINES OF CODE</div>
            <div style={{ fontFamily: INTER, fontSize: 40, fontWeight: 800, color: C.white, lineHeight: 1 }}>
              {locCount.toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {/* Compound moment */}
      {frame >= compoundStart && frame < statsStart && (
        <>
          <div style={{
            position: 'absolute', bottom: 240, left: 60, right: 60, textAlign: 'center',
            opacity: interpolate(frame - compoundStart, [0, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
          }}>
            <div style={{
              padding: '14px 24px', display: 'inline-block',
              backgroundColor: C.card, border: `1px solid ${C.amber}`, borderRadius: 8,
              fontFamily: INTER, fontSize: 18, fontWeight: 700, color: C.amber,
            }}>
              Week 6: moving at 1/10 speed.
            </div>
          </div>
          <div style={{
            position: 'absolute', bottom: 180, left: 0, right: 0, textAlign: 'center',
            opacity: interpolate(frame - compoundStart - 40, [0, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
            fontFamily: MONO, fontSize: 20, color: C.cyan, letterSpacing: 2,
          }}>
            Every failure → fix the harness, not the output.
          </div>

          {/* Cascading cyan harness fixes */}
          {['new tool','clearer AGENTS.md','better linter','review skill','sandbox policy'].map((label, i) => {
            const dropFrame = compoundStart + 80 + i * 20;
            const fall = spring({ frame: frame - dropFrame, fps, config: { damping: 12 } });
            if (frame < dropFrame) return null;
            return (
              <div key={i} style={{
                position: 'absolute', left: 150 + i * 300, bottom: 80,
                padding: '8px 14px', borderRadius: 6,
                backgroundColor: C.cyan, color: C.bg,
                fontFamily: MONO, fontSize: 12, fontWeight: 700,
                transform: `translateY(${interpolate(fall, [0, 1], [-50, 0])}px)`,
                opacity: fall,
              }}>
                {label}
              </div>
            );
          })}
        </>
      )}

      {/* Final stats phase */}
      {frame >= statsStart && frame < quoteStart && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 30 }}>
            {[
              { big: '1,000,000+', label: 'lines of code', color: C.green },
              { big: '1,500+', label: 'pull requests', color: C.cyan },
              { big: '0', label: 'lines written by humans', color: C.red },
              { big: '10×', label: 'faster than by hand', color: C.amber },
            ].map((stat, i) => {
              const p = spring({ frame: frame - statsStart - i * 15, fps, config: { damping: 14 } });
              return (
                <div key={i} style={{
                  width: 400, padding: 40, borderRadius: 20,
                  backgroundColor: C.card, border: `2px solid ${stat.color}`,
                  boxShadow: `0 0 30px ${stat.color}22`,
                  transform: `scale(${p})`, opacity: p,
                  textAlign: 'center',
                }}>
                  <div style={{ fontFamily: INTER, fontSize: 64, fontWeight: 900, color: stat.color, lineHeight: 1 }}>
                    {stat.big}
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 13, color: C.white, marginTop: 12, letterSpacing: 1 }}>
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quote */}
      {frame >= quoteStart && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: interpolate(frame - quoteStart, [0, 30], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
        }}>
          <div style={{
            maxWidth: 1200, padding: 50, borderRadius: 16,
            backgroundColor: C.card, border: `1px solid ${C.violet}`,
            textAlign: 'center',
          }}>
            <div style={{
              fontFamily: INTER, fontSize: 32, fontWeight: 500, color: C.white,
              lineHeight: 1.4, fontStyle: 'italic',
            }}>
              "We didn't write the code. We designed the environment that let the agent write it."
            </div>
            <div style={{
              fontFamily: MONO, fontSize: 16, color: C.violet, marginTop: 24,
            }}>
              — Ryan Lopopolo, OpenAI Frontier
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
