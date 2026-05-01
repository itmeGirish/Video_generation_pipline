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

// Vignette components
const AgentsMD: React.FC<{ relFrame: number }> = ({ relFrame }) => {
  const content = ['## Architecture', '## Code style', '## How to run tests'];
  return (
    <div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: C.dim, marginBottom: 6 }}>AGENTS.md</div>
      {content.map((line, i) => {
        const appearAt = 10 + i * 30;
        const chars = Math.max(0, Math.floor((relFrame - appearAt) * 1.5));
        return (
          <div key={i} style={{ fontFamily: MONO, fontSize: 13, color: C.white, marginBottom: 4 }}>
            {line.substring(0, Math.min(chars, line.length))}
          </div>
        );
      })}
    </div>
  );
};

const SkillFolder: React.FC<{ relFrame: number }> = ({ relFrame }) => {
  return (
    <div>
      <div style={{ fontFamily: MONO, fontSize: 13, color: C.cyan, marginBottom: 6 }}>/skills/refactor-api</div>
      {relFrame > 20 && (
        <div style={{
          padding: '6px 10px', backgroundColor: C.bg, border: `1px solid ${C.dim}`, borderRadius: 4,
          fontFamily: MONO, fontSize: 11, color: C.white,
        }}>SKILL.md</div>
      )}
      {relFrame > 50 && (
        <div style={{ fontFamily: MONO, fontSize: 10, color: C.violet, marginTop: 6 }}>
          loads only when agent needs it
        </div>
      )}
    </div>
  );
};

const Sandbox: React.FC<{ relFrame: number }> = ({ relFrame }) => {
  return (
    <div style={{ border: `1px dashed ${C.cyan}66`, borderRadius: 6, padding: 10 }}>
      <div style={{ fontFamily: MONO, fontSize: 10, color: C.dim, marginBottom: 6 }}>$ bash</div>
      {relFrame > 10 && <div style={{ fontFamily: MONO, fontSize: 12, color: C.green }}>npm test ✓</div>}
      {relFrame > 35 && <div style={{ fontFamily: MONO, fontSize: 12, color: C.green }}>python check.py ✓</div>}
      {relFrame > 55 && (
        <div style={{ fontFamily: MONO, fontSize: 12, color: C.red, position: 'relative', display: 'inline-block' }}>
          🛡️ rm -rf /
          <span style={{ position: 'absolute', right: -20, top: 0, color: C.red }}>✗</span>
        </div>
      )}
    </div>
  );
};

const ReviewAgent: React.FC<{ relFrame: number }> = ({ relFrame }) => {
  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
      <div style={{
        width: 50, height: 50, borderRadius: '50%',
        background: `radial-gradient(circle, ${C.amber}, ${C.amber}44)`,
        boxShadow: `0 0 15px ${C.amber}88`,
      }} />
      <div style={{ fontSize: 24, color: C.violet }}>→</div>
      <div style={{
        width: 50, height: 50, borderRadius: '50%',
        background: `radial-gradient(circle, ${C.amber}, ${C.amber}44)`,
        boxShadow: `0 0 15px ${C.amber}88`,
      }} />
      {relFrame > 25 && (
        <div style={{
          padding: '6px 12px', borderRadius: 8,
          backgroundColor: `${C.violet}22`, border: `1px solid ${C.violet}`,
          fontFamily: MONO, fontSize: 11, color: C.violet, maxWidth: 150,
        }}>
          "function too long — split"
        </div>
      )}
    </div>
  );
};

const PreCommit: React.FC<{ relFrame: number }> = ({ relFrame }) => {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ fontSize: 22 }}>🌿</div>
        <div style={{ fontFamily: MONO, fontSize: 12, color: C.white }}>commit abc123</div>
        {relFrame > 20 && (
          <>
            <div style={{
              padding: '4px 8px', borderRadius: 4,
              backgroundColor: `${C.cyan}22`, border: `1px solid ${C.cyan}`,
              fontFamily: MONO, fontSize: 10, color: C.cyan,
            }}>gate</div>
            {relFrame < 50 && <div style={{ color: C.red, fontSize: 18 }}>✗</div>}
            {relFrame >= 50 && <div style={{ color: C.green, fontSize: 18 }}>✓</div>}
          </>
        )}
      </div>
      {relFrame > 28 && relFrame < 55 && (
        <div style={{ fontFamily: MONO, fontSize: 11, color: C.red, marginTop: 6 }}>
          "fix first"
        </div>
      )}
      {relFrame >= 55 && (
        <div style={{ fontFamily: MONO, fontSize: 11, color: C.green, marginTop: 6 }}>
          self-corrected ✓
        </div>
      )}
    </div>
  );
};

const SteeringLoop: React.FC<{ relFrame: number }> = ({ relFrame }) => {
  const stages = [
    { text: 'agent fails once', color: C.red },
    { text: 'engineer updates harness', color: C.cyan },
    { text: 'failure impossible — forever', color: C.green },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {stages.map((s, i) => {
        const start = i * 20;
        const opacity = relFrame > start ? 1 : 0;
        return (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            opacity,
          }}>
            <div style={{
              width: 20, height: 20, borderRadius: '50%',
              backgroundColor: s.color, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: MONO, fontSize: 11, color: C.bg, fontWeight: 800,
            }}>{i + 1}</div>
            <div style={{ fontFamily: MONO, fontSize: 12, color: s.color, fontWeight: 700 }}>
              {s.text}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const VIGNETTES = [
  { emoji: '✍️', title: 'Writing AGENTS.md',     Viz: AgentsMD,     phrase: 'AGENTS.md files' },
  { emoji: '🎒', title: 'Authoring a Skill',     Viz: SkillFolder,  phrase: 'build skills' },
  { emoji: '📦', title: 'Configuring sandbox',   Viz: Sandbox,      phrase: 'configure sandboxes' },
  { emoji: '🤖', title: 'Review agent',          Viz: ReviewAgent,  phrase: 'review agents' },
  { emoji: '🌿', title: 'Pre-commit hook',       Viz: PreCommit,    phrase: 'pre-commit hooks' },
  { emoji: '🔁', title: 'The steering loop',     Viz: SteeringLoop, phrase: 'fix the harness' },
];

export const HE06_NewJob: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const KEY = 'he06';
  const total = getSceneDurationFrames(KEY);

  const zoomOutStart = findWordFrame(KEY, 'coding got automated', total - 300);

  return (
    <div style={{ width: 1920, height: 1080, position: 'relative', overflow: 'hidden' }}>
      <Bg />

      {/* Header */}
      <div style={{
        position: 'absolute', top: 40, left: 0, right: 0, textAlign: 'center',
        fontFamily: INTER, fontSize: 32, fontWeight: 900, color: C.white, letterSpacing: 4,
        opacity: interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' }),
      }}>
        A DAY AS A HARNESS ENGINEER
      </div>

      {/* 3x2 vignettes grid */}
      <div style={{
        position: 'absolute', top: 130, left: 60, right: 60, bottom: 100,
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'repeat(2, 1fr)',
        gap: 24,
      }}>
        {VIGNETTES.map((v, i) => {
          const appearFrame = findWordFrame(KEY, v.phrase, 100 + i * 180);
          const enter = spring({ frame: frame - appearFrame, fps, config: { damping: 14 } });
          if (frame < appearFrame) return null;

          // Zoom out animation — shrinks + docks
          const zoom = frame > zoomOutStart ? spring({ frame: frame - zoomOutStart, fps, config: { damping: 16 } }) : 0;
          const scale = interpolate(zoom, [0, 1], [1, 0.7]);

          const { Viz } = v;
          return (
            <div key={i} style={{
              padding: 24, borderRadius: 16,
              backgroundColor: C.card, border: `1px solid ${C.cyan}44`,
              boxShadow: frame > zoomOutStart ? `0 0 15px ${C.cyan}44` : 'none',
              display: 'flex', flexDirection: 'column', gap: 12,
              transform: `scale(${enter * scale})`, opacity: enter,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 28 }}>{v.emoji}</div>
                <div style={{ fontFamily: INTER, fontSize: 18, fontWeight: 800, color: C.white }}>
                  {v.title}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <Viz relFrame={frame - appearFrame} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Central harness label when zoomed out */}
      {frame >= zoomOutStart && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          opacity: interpolate(frame - zoomOutStart, [0, 30], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
          width: 200, height: 200, borderRadius: '50%',
          background: `radial-gradient(circle, ${C.cyan}33, transparent)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <div style={{ fontFamily: INTER, fontSize: 20, fontWeight: 900, color: C.cyan, textAlign: 'center', letterSpacing: 2 }}>
            THE<br/>HARNESS
          </div>
        </div>
      )}

      {/* Takeaway */}
      {frame >= zoomOutStart + 120 && (
        <div style={{
          position: 'absolute', bottom: 30, left: 0, right: 0, textAlign: 'center',
          opacity: interpolate(frame - zoomOutStart - 120, [0, 30], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
        }}>
          <div style={{ fontFamily: INTER, fontSize: 24, fontWeight: 700, color: C.white }}>
            The coding got automated. <span style={{ color: C.cyan }}>The thinking got bigger.</span>
          </div>
        </div>
      )}
    </div>
  );
};
