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

// ─── Vignettes ───
const WritingAgentsMD: React.FC<{ relFrame: number }> = ({ relFrame }) => {
  const lines = ['## Architecture', '## Code style', '## How to run tests'];
  return (
    <div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: C.dim, marginBottom: 8 }}>📄 AGENTS.md</div>
      {lines.map((ln, i) => {
        const appearAt = 10 + i * 30;
        const chars = Math.max(0, Math.floor((relFrame - appearAt) * 1.5));
        return (
          <div key={i} style={{ fontFamily: MONO, fontSize: 14, color: C.white, marginBottom: 6, whiteSpace: 'pre' }}>
            {ln.substring(0, Math.min(chars, ln.length))}
          </div>
        );
      })}
    </div>
  );
};

const AuthoringSkill: React.FC<{ relFrame: number }> = ({ relFrame }) => {
  return (
    <div>
      <div style={{ fontFamily: MONO, fontSize: 13, color: C.cyan, marginBottom: 8 }}>📂 /skills/refactor-api</div>
      {relFrame > 20 && (
        <div style={{
          padding: '6px 12px', backgroundColor: C.bg, border: `1px solid ${C.dim}`, borderRadius: 4,
          fontFamily: MONO, fontSize: 12, color: C.white, marginBottom: 10,
        }}>SKILL.md</div>
      )}
      {relFrame > 50 && (
        <div style={{
          fontFamily: MONO, fontSize: 10, color: C.violet, fontStyle: 'italic',
        }}>loads only when needed — saves tokens</div>
      )}
    </div>
  );
};

const Sandboxing: React.FC<{ relFrame: number }> = ({ relFrame }) => {
  return (
    <div style={{ border: `1px dashed ${C.cyan}66`, borderRadius: 6, padding: 12 }}>
      <div style={{ fontFamily: MONO, fontSize: 10, color: C.dim, marginBottom: 8 }}>📦 sandbox</div>
      {relFrame > 10 && (
        <div style={{ fontFamily: MONO, fontSize: 13, color: C.green, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>$ npm test</span>
          <span>✓</span>
        </div>
      )}
      {relFrame > 35 && (
        <div style={{
          fontFamily: MONO, fontSize: 13, color: C.red,
          display: 'flex', alignItems: 'center', gap: 6,
          position: 'relative',
        }}>
          <span>$ rm -rf /</span>
          <span style={{ fontSize: 20, marginLeft: 10 }}>🛡️</span>
          <span style={{ color: C.red, fontSize: 20 }}>✗</span>
        </div>
      )}
    </div>
  );
};

const AgentReviewing: React.FC<{ relFrame: number }> = ({ relFrame }) => {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: `radial-gradient(circle, ${C.amber}, ${C.amber}44)`,
          boxShadow: `0 0 12px ${C.amber}88`,
        }} />
        <div style={{ fontSize: 22, color: C.violet }}>⇆</div>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: `radial-gradient(circle, ${C.amber}, ${C.amber}44)`,
          boxShadow: `0 0 12px ${C.amber}88`,
        }} />
      </div>
      {relFrame > 20 && (
        <div style={{
          padding: '8px 12px', borderRadius: 8,
          backgroundColor: `${C.violet}22`, border: `1px solid ${C.violet}`,
          fontFamily: MONO, fontSize: 11, color: C.violet,
        }}>
          "this function is 200 lines. split it."
        </div>
      )}
      {relFrame > 60 && (
        <div style={{ fontFamily: MONO, fontSize: 11, color: C.green, marginTop: 8 }}>
          rewritten ✓
        </div>
      )}
    </div>
  );
};

const PreCommitHook: React.FC<{ relFrame: number }> = ({ relFrame }) => {
  return (
    <div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: C.dim, marginBottom: 8 }}>🔀 pre-commit</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontFamily: MONO, fontSize: 12, color: C.white }}>git commit</div>
        <div style={{
          padding: '4px 10px', borderRadius: 4,
          backgroundColor: `${C.cyan}22`, border: `1px solid ${C.cyan}`,
          fontFamily: MONO, fontSize: 10, color: C.cyan,
        }}>gate</div>
        {relFrame > 20 && relFrame < 55 && <div style={{ fontSize: 18, color: C.red }}>✗</div>}
        {relFrame >= 55 && <div style={{ fontSize: 18, color: C.green }}>✓</div>}
      </div>
      {relFrame > 25 && relFrame < 55 && (
        <div style={{ fontFamily: MONO, fontSize: 11, color: C.red, marginTop: 8 }}>
          → agent: "fix first"
        </div>
      )}
      {relFrame >= 55 && (
        <div style={{ fontFamily: MONO, fontSize: 11, color: C.green, marginTop: 8 }}>
          second attempt: passes ✓
        </div>
      )}
    </div>
  );
};

const TheLoop: React.FC<{ relFrame: number }> = ({ relFrame }) => {
  const stages = [
    { label: 'Agent makes a mistake.', color: C.red, bg: `${C.red}22` },
    { label: 'Engineer updates the harness.', color: C.cyan, bg: `${C.cyan}22` },
    { label: 'That mistake is now impossible.', color: C.green, bg: `${C.green}22` },
  ];
  return (
    <div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: C.cyan, fontWeight: 800, marginBottom: 10 }}>
        🔁 THE LOOP
      </div>
      {stages.map((s, i) => {
        const appearAt = i * 30;
        const active = relFrame > appearAt;
        return (
          <div key={i} style={{
            padding: '8px 10px', borderRadius: 6, marginBottom: 6,
            backgroundColor: active ? s.bg : 'transparent',
            border: `1px solid ${active ? s.color : 'transparent'}`,
            display: 'flex', alignItems: 'center', gap: 8,
            opacity: active ? 1 : 0.3,
            transition: 'all 0.2s',
          }}>
            <div style={{
              width: 18, height: 18, borderRadius: '50%',
              backgroundColor: s.color, color: C.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: INTER, fontSize: 10, fontWeight: 900,
            }}>{i + 1}</div>
            <div style={{ fontFamily: MONO, fontSize: 11, color: s.color, fontWeight: 700 }}>
              {s.label}
            </div>
          </div>
        );
      })}
      {relFrame > 90 && (
        <div style={{
          fontFamily: INTER, fontSize: 13, color: C.cyan, fontWeight: 800,
          marginTop: 10, letterSpacing: 1,
          opacity: interpolate(relFrame - 90, [0, 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
        }}>
          Fix the harness, not the output.
        </div>
      )}
    </div>
  );
};

const VIGNETTES = [
  { emoji: '✍️', title: 'Writing AGENTS.md',   Viz: WritingAgentsMD, phrase: 'AGENTS.md files' },
  { emoji: '🎒', title: 'Authoring a Skill',   Viz: AuthoringSkill,  phrase: 'build skills' },
  { emoji: '📦', title: 'Sandboxing',          Viz: Sandboxing,      phrase: 'sandboxes' },
  { emoji: '🤖', title: 'Agent reviews agent', Viz: AgentReviewing,  phrase: 'review agents' },
  { emoji: '🔀', title: 'Pre-commit hook',     Viz: PreCommitHook,   phrase: 'custom linters' },
  { emoji: '🔁', title: 'The Loop',            Viz: TheLoop,         phrase: 'fix the harness' },
];

const HF06_Inner: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const KEY = 'hf06';
  const total = getSceneDurationFrames(KEY);

  // Opening hook
  const hookEnd = findWordFrame(KEY, 'A day', 150);
  const gridStart = hookEnd;
  const zoomOutStart = findWordFrame(KEY, 'thinking work got bigger', total - 300);
  const askStart = findWordFrame(KEY, 'You in', total - 100);

  // Opening hook
  if (frame < hookEnd) {
    const line1 = 'Nobody has this job title yet.';
    const line2 = 'Which is exactly the point.';
    const ch1 = Math.min(Math.floor(frame * 1.2), line1.length);
    const ch2 = Math.max(0, Math.min(Math.floor((frame - 80) * 1.2), line2.length));
    return (
      <div style={{
        width: 1920, height: 1080, position: 'relative',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 40,
      }}>
        <Bg />
        <div style={{ fontFamily: INTER, fontSize: 56, fontWeight: 800, color: C.white, whiteSpace: 'pre' }}>
          {line1.substring(0, ch1)}
        </div>
        {ch2 > 0 && (
          <div style={{
            fontFamily: INTER, fontSize: 48, fontWeight: 700, color: C.cyan, whiteSpace: 'pre',
            textShadow: `0 0 30px ${C.cyan}66`,
          }}>
            {line2.substring(0, ch2)}
          </div>
        )}
      </div>
    );
  }

  // Zoomed-out orbit phase
  const zoomed = frame >= zoomOutStart;

  return (
    <div style={{ width: 1920, height: 1080, position: 'relative', overflow: 'hidden' }}>
      <Bg />

      {/* Header */}
      <div style={{
        position: 'absolute', top: 50, left: 0, right: 0, textAlign: 'center',
        fontFamily: INTER, fontSize: 32, fontWeight: 900, color: C.white, letterSpacing: 4,
      }}>
        A DAY AS A HARNESS ENGINEER
      </div>

      {/* Vignettes */}
      {!zoomed && (
        <div style={{
          position: 'absolute', top: 140, left: 60, right: 60, bottom: 60,
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'repeat(2, 1fr)',
          gap: 24,
        }}>
          {VIGNETTES.map((v, i) => {
            const appearAt = findWordFrame(KEY, v.phrase, gridStart + 50 + i * 200);
            const p = spring({ frame: frame - appearAt, fps, config: { damping: 14 } });
            if (frame < appearAt) return null;

            const { Viz } = v;
            // The Loop (index 5) gets extra border glow + stays 2x longer
            const isLoop = i === 5;

            return (
              <div key={i} style={{
                padding: 24, borderRadius: 16,
                backgroundColor: C.card,
                border: `${isLoop ? 2 : 1}px solid ${isLoop ? C.cyan : C.cyan + '66'}`,
                boxShadow: isLoop ? `0 0 25px ${C.cyan}44` : 'none',
                display: 'flex', flexDirection: 'column', gap: 12,
                transform: `scale(${p})`, opacity: p,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: 28 }}>{v.emoji}</div>
                  <div style={{ fontFamily: INTER, fontSize: 16, fontWeight: 800, color: C.white }}>
                    {v.title}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <Viz relFrame={frame - appearAt} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Orbit phase */}
      {zoomed && frame < askStart && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {/* Central YOUR HARNESS */}
          <div style={{
            width: 260, height: 260, borderRadius: '50%',
            background: `radial-gradient(circle, ${C.cyan}44, transparent)`,
            border: `2px solid ${C.cyan}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 60px ${C.cyan}66`,
          }}>
            <div style={{ fontFamily: INTER, fontSize: 22, fontWeight: 900, color: C.cyan, textAlign: 'center', letterSpacing: 2 }}>
              YOUR<br/>HARNESS
            </div>
          </div>

          {/* Orbiting vignette icons */}
          {VIGNETTES.map((v, i) => {
            const angle = (i / VIGNETTES.length) * Math.PI * 2 + (frame - zoomOutStart) * 0.015;
            const r = 380;
            const x = 960 + Math.cos(angle) * r;
            const y = 540 + Math.sin(angle) * r;
            const p = spring({ frame: frame - zoomOutStart - i * 5, fps, config: { damping: 14 } });
            return (
              <div key={i} style={{
                position: 'absolute', left: x - 40, top: y - 40,
                width: 80, height: 80, borderRadius: 16,
                backgroundColor: C.card, border: `1px solid ${C.cyan}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 36, transform: `scale(${p})`, opacity: p,
                boxShadow: `0 0 15px ${C.cyan}44`,
              }}>
                {v.emoji}
              </div>
            );
          })}
        </div>
      )}

      {/* Direct ask */}
      {frame >= askStart && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: interpolate(frame - askStart, [0, 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
        }}>
          <div style={{
            fontFamily: INTER, fontSize: 180, fontWeight: 900, color: C.cyan,
            textShadow: `0 0 60px ${C.cyan}66`, letterSpacing: -2,
          }}>
            You in?
          </div>
        </div>
      )}
    </div>
  );
};

import { Scene, Phase } from '../../storyboard/Scene';
export const HF06_YourJob: React.FC = () => (
  <Scene id="hf06"><Phase id="full_scene"><HF06_Inner /></Phase></Scene>
);
