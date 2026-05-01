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

// ─── PHASE A: Two-line reveal ───
const TwoLineReveal: React.FC<{ relFrame: number }> = ({ relFrame }) => {
  const line1 = 'For 60 years, the job was to write code.';
  const line2 = 'That job just changed.';
  const chars1 = Math.min(Math.floor(relFrame * 1.3), line1.length);
  const chars2 = Math.max(0, Math.min(Math.floor((relFrame - 90) * 1.3), line2.length));

  return (
    <div style={{
      width: 1920, height: 1080, position: 'relative',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 60,
    }}>
      <Bg />
      <div style={{ fontFamily: INTER, fontSize: 56, fontWeight: 700, color: C.white, whiteSpace: 'pre', textAlign: 'center', letterSpacing: 1 }}>
        {line1.substring(0, chars1)}
      </div>
      {chars2 > 0 && (
        <div style={{
          fontFamily: INTER, fontSize: 64, fontWeight: 900, color: C.cyan,
          whiteSpace: 'pre', textAlign: 'center', letterSpacing: 1,
          textShadow: `0 0 30px ${C.cyan}66`,
        }}>
          {line2.substring(0, chars2)}
        </div>
      )}
    </div>
  );
};

// ─── PHASE B: Evolution timeline ───
const EvolutionTimeline: React.FC<{ relFrame: number }> = ({ relFrame }) => {
  const { fps } = useVideoConfig();
  const nodes = [
    { year: '2020', label: 'Prompt engineering',  sub: 'ask the right question',   color: C.violet, delay: 0 },
    { year: '2023', label: 'Context engineering', sub: 'give the right information', color: C.amber, delay: 40 },
    { year: '2025', label: 'Harness engineering', sub: 'build the right system',    color: C.cyan, delay: 80 },
    { year: '2026', label: '???',                 sub: 'next chapter',              color: C.green, delay: 140 },
  ];

  return (
    <div style={{ width: 1920, height: 1080, position: 'relative' }}>
      <Bg />

      {/* Compressed header */}
      <div style={{
        position: 'absolute', top: 80, left: 0, right: 0, textAlign: 'center',
        fontFamily: INTER, fontSize: 24, color: C.white, opacity: 0.6,
      }}>
        For 60 years, the job was to write code. <span style={{ color: C.cyan }}>That job just changed.</span>
      </div>

      {/* Timeline */}
      <div style={{
        position: 'absolute', top: '50%', left: 0, right: 0,
        transform: 'translateY(-50%)',
      }}>
        {/* Horizontal line */}
        <div style={{
          position: 'absolute', left: 200, right: 200, top: 100,
          height: 2, backgroundColor: C.dim,
        }} />

        {/* Nodes */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          padding: '0 200px', position: 'relative',
        }}>
          {nodes.map((n, i) => {
            const p = spring({ frame: relFrame - n.delay, fps, config: { damping: 12 } });
            const pulse = i === nodes.length - 1 ? 1 + Math.sin(relFrame * 0.2) * 0.15 : 1;
            return (
              <div key={i} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                position: 'relative', width: 280,
              }}>
                {/* Year label above */}
                <div style={{
                  fontFamily: MONO, fontSize: 18, fontWeight: 800, color: n.color,
                  marginBottom: 20, opacity: p,
                }}>
                  {n.year} →
                </div>
                {/* Dot */}
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  backgroundColor: n.color, boxShadow: `0 0 20px ${n.color}`,
                  transform: `scale(${p * pulse})`, opacity: p,
                }} />
                {/* Label */}
                <div style={{
                  fontFamily: INTER, fontSize: 22, fontWeight: 800, color: C.white,
                  marginTop: 30, opacity: p, textAlign: 'center',
                }}>
                  {n.label}
                </div>
                <div style={{
                  fontFamily: MONO, fontSize: 13, color: C.dim,
                  marginTop: 8, opacity: p, textAlign: 'center',
                }}>
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

// ─── PHASE C: Stakes — two teams ───
const TwoTeams: React.FC<{ relFrame: number }> = ({ relFrame }) => {
  const { fps } = useVideoConfig();
  const progressA = interpolate(relFrame, [30, 300], [0, 0.25], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const progressB = interpolate(relFrame, [30, 300], [0, 0.95], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <div style={{ width: 1920, height: 1080, position: 'relative' }}>
      <Bg />

      {/* Team A — no harness */}
      <div style={{
        position: 'absolute', top: 150, left: 100, width: 800,
      }}>
        <div style={{ fontFamily: INTER, fontSize: 24, fontWeight: 800, color: C.red, marginBottom: 20 }}>
          Team A · no harness
        </div>
        {/* Orb alone */}
        <div style={{
          width: 100, height: 100, borderRadius: '50%',
          background: `radial-gradient(circle, ${C.amber}, ${C.amber}44)`,
          boxShadow: `0 0 20px ${C.amber}88`,
          marginBottom: 30,
        }} />
        {/* Output bar */}
        <div style={{ fontFamily: MONO, fontSize: 12, color: C.dim, marginBottom: 6 }}>output</div>
        <div style={{ height: 28, width: 700, backgroundColor: C.card, borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ width: `${progressA * 100}%`, height: '100%', backgroundColor: C.red, opacity: 0.7 }} />
        </div>
      </div>

      {/* Team B — full harness */}
      <div style={{
        position: 'absolute', top: 150, right: 100, width: 800,
        textAlign: 'right',
      }}>
        <div style={{ fontFamily: INTER, fontSize: 24, fontWeight: 800, color: C.green, marginBottom: 20 }}>
          Team B · full harness
        </div>
        {/* Orb + harness ring */}
        <div style={{
          position: 'relative', width: 100, height: 100, borderRadius: '50%',
          background: `radial-gradient(circle, ${C.amber}, ${C.amber}44)`,
          boxShadow: `0 0 20px ${C.amber}88`,
          margin: '0 0 30px auto',
        }}>
          {/* Harness dots */}
          {Array.from({ length: 6 }).map((_, i) => {
            const a = (i / 6) * Math.PI * 2;
            return (
              <div key={i} style={{
                position: 'absolute', left: 50 + Math.cos(a) * 70 - 6, top: 50 + Math.sin(a) * 70 - 6,
                width: 12, height: 12, borderRadius: '50%', backgroundColor: C.cyan,
              }} />
            );
          })}
        </div>
        {/* Output bar */}
        <div style={{ fontFamily: MONO, fontSize: 12, color: C.dim, marginBottom: 6 }}>output</div>
        <div style={{ height: 28, width: 700, backgroundColor: C.card, borderRadius: 6, overflow: 'hidden', marginLeft: 'auto' }}>
          <div style={{ width: `${progressB * 100}%`, height: '100%', backgroundColor: C.green }} />
        </div>
      </div>

      {/* Caption */}
      {relFrame > 200 && (
        <div style={{
          position: 'absolute', bottom: 120, left: 0, right: 0, textAlign: 'center',
          opacity: interpolate(relFrame - 200, [0, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
        }}>
          <div style={{ fontFamily: INTER, fontSize: 24, fontWeight: 700, color: C.white }}>
            Small teams with great harnesses <span style={{ color: C.cyan }}>out-build large teams without them.</span>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── PHASE D: Call-to-action lines ───
const CTALines: React.FC<{ relFrame: number }> = ({ relFrame }) => {
  const lines = [
    { text: 'Learn the formula.', sub: 'Agent = Model + Harness', color: C.white },
    { text: 'Build guides and sensors.', color: C.violet },
    { text: 'Fix the harness, not the output.', color: C.cyan },
    { text: 'Make every mistake impossible on the next run.', color: C.green },
  ];

  return (
    <div style={{ width: 1920, height: 1080, position: 'relative' }}>
      <Bg />
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 32,
      }}>
        {lines.map((line, i) => {
          const appearAt = i * 45;
          const p = interpolate(relFrame - appearAt, [0, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          return (
            <div key={i} style={{
              textAlign: 'center', opacity: p,
              transform: `translateY(${interpolate(p, [0, 1], [20, 0])}px)`,
            }}>
              <div style={{ fontFamily: INTER, fontSize: 36, fontWeight: 800, color: line.color, letterSpacing: 1 }}>
                {line.text}
              </div>
              {line.sub && (
                <div style={{ fontFamily: MONO, fontSize: 18, color: C.amber, marginTop: 8 }}>
                  {line.sub}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── PHASE E: Final title card ───
const FinalTitle: React.FC<{ relFrame: number; total: number }> = ({ relFrame, total }) => {
  const { fps } = useVideoConfig();
  const titleSpring = spring({ frame: relFrame, fps, config: { damping: 14 } });
  const taglineChars = Math.max(0, Math.floor((relFrame - 50) * 1));
  const tagline = 'The model is the horse. The harness is the discipline.';
  const fadeOut = interpolate(relFrame, [total - 20, total], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <div style={{
      width: 1920, height: 1080, position: 'relative',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      opacity: fadeOut,
    }}>
      <Bg />
      <div style={{
        fontFamily: INTER, fontSize: 64, fontWeight: 900, color: C.white,
        textAlign: 'center', lineHeight: 1.15, letterSpacing: -1,
        transform: `scale(${interpolate(titleSpring, [0, 1], [0.9, 1])})`,
        opacity: titleSpring,
      }}>
        THE RISE OF <span style={{ color: C.cyan }}>HARNESS ENGINEERING</span> IN AI
      </div>
      <div style={{
        fontFamily: MONO, fontSize: 22, color: C.amber, marginTop: 50,
        letterSpacing: 1, whiteSpace: 'pre',
      }}>
        {tagline.substring(0, Math.min(taglineChars, tagline.length))}
      </div>
    </div>
  );
};

export const HE07_ShiftOfDecade: React.FC = () => {
  const frame = useCurrentFrame();
  const KEY = 'he07';
  const total = getSceneDurationFrames(KEY);

  const timelineStart = findWordFrame(KEY, 'uniquely human', 400);
  const stakesStart = findWordFrame(KEY, 'fastest-growing', 850);
  const ctaStart = findWordFrame(KEY, 'Learn it early', 1250);
  const finalStart = findWordFrame(KEY, 'engineering shift', total - 220);

  if (frame < timelineStart) return <TwoLineReveal relFrame={frame} />;
  if (frame < stakesStart) return <EvolutionTimeline relFrame={frame - timelineStart} />;
  if (frame < ctaStart) return <TwoTeams relFrame={frame - stakesStart} />;
  if (frame < finalStart) return <CTALines relFrame={frame - ctaStart} />;
  return <FinalTitle relFrame={frame - finalStart} total={total - finalStart} />;
};
