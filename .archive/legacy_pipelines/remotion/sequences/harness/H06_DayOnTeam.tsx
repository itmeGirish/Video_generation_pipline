import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { findWordFrame, getSceneDurationFrames } from '../../utils/audioSync';

const C = {
  bg: '#0A1628', blue: '#00ADE4', violet: '#7C5CFF',
  green: '#22C55E', amber: '#F59E0B', red: '#EF4444',
  white: '#E8F4FF', dim: '#4A5568', card: '#111E34',
};
const MONO = 'JetBrains Mono, monospace';
const SANS = 'Inter, sans-serif';

const Background: React.FC = () => (
  <div style={{ position: 'absolute', inset: 0, backgroundColor: C.bg }} />
);

// ─── Persona mini-visualizations ───
const DeveloperViz: React.FC<{ relFrame: number }> = ({ relFrame }) => {
  const yamlText = 'name: aws-deploy\nstages:\n  - build\n  - scan\n  - deploy';
  const chars = Math.floor(Math.max(0, relFrame - 40) * 1.5);
  return (
    <div>
      <div style={{
        fontFamily: MONO, fontSize: 12, color: C.white,
        backgroundColor: C.bg, padding: '6px 10px', borderRadius: 6,
        border: `1px solid ${C.violet}66`, marginBottom: 10,
      }}>
        "Create a deployment pipeline to AWS with standard scans."
      </div>
      <pre style={{
        fontFamily: MONO, fontSize: 11, color: C.green,
        backgroundColor: C.bg, padding: '8px 10px', borderRadius: 6, margin: 0,
        whiteSpace: 'pre-wrap',
      }}>
        {yamlText.substring(0, chars)}
      </pre>
      {chars >= yamlText.length && (
        <div style={{ fontFamily: MONO, fontSize: 10, color: C.green, marginTop: 6 }}>pipeline.yaml ✓</div>
      )}
    </div>
  );
};

const PlatformViz: React.FC<{ relFrame: number }> = ({ relFrame }) => {
  return (
    <div>
      <div style={{ fontFamily: SANS, fontSize: 11, color: C.dim, marginBottom: 6 }}>Pipeline Health</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 5 }}>
        {Array.from({ length: 32 }).map((_, i) => {
          const blink = i === 10 || i === 15 || i === 22;
          const isAmber = blink && Math.floor(relFrame / 15) % 2 === 0;
          return (
            <div key={i} style={{
              width: 14, height: 14, borderRadius: '50%',
              backgroundColor: isAmber ? C.amber : C.green,
            }} />
          );
        })}
      </div>
      {relFrame > 40 && (
        <div style={{
          marginTop: 10, fontFamily: MONO, fontSize: 10, color: C.violet,
          backgroundColor: `${C.violet}22`, padding: '4px 8px', borderRadius: 4,
        }}>
          ✨ drift detected — fix available
        </div>
      )}
    </div>
  );
};

const SecurityViz: React.FC<{ relFrame: number }> = ({ relFrame }) => {
  const raw = 2847;
  const refined = 3;
  const val = Math.floor(interpolate(relFrame, [20, 50], [raw, refined], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <div style={{ fontFamily: SANS, fontSize: 28, fontWeight: 900, color: val > 100 ? C.red : C.green }}>
          {val.toLocaleString()}
        </div>
        <div style={{ fontFamily: SANS, fontSize: 12, color: C.dim }}>
          {val > 100 ? 'findings' : 'priority'}
        </div>
      </div>
      {relFrame > 50 && (
        <div style={{
          marginTop: 10, padding: 8, borderRadius: 6,
          backgroundColor: `${C.violet}15`, border: `1px solid ${C.violet}66`,
        }}>
          <div style={{ fontFamily: SANS, fontSize: 10, color: C.violet, fontWeight: 700 }}>📧 Morning Digest</div>
          <div style={{ fontFamily: MONO, fontSize: 9, color: C.white, marginTop: 4 }}>3 real vulns — action required</div>
        </div>
      )}
    </div>
  );
};

const SREViz: React.FC<{ relFrame: number }> = ({ relFrame }) => {
  const incVal = Math.floor(interpolate(relFrame, [10, 40], [14, 3], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  return (
    <div>
      <div style={{ position: 'relative', display: 'inline-block', marginBottom: 10 }}>
        <div style={{ fontSize: 36 }}>📟</div>
        {relFrame > 20 && (
          <div style={{
            position: 'absolute', top: '50%', left: -5, right: -5, height: 3,
            backgroundColor: C.red, transform: 'rotate(-20deg)',
          }} />
        )}
      </div>
      <div style={{ fontFamily: SANS, fontSize: 10, color: C.dim, marginBottom: 4 }}>Incidents / week</div>
      <div style={{ fontFamily: SANS, fontSize: 24, fontWeight: 800, color: incVal < 5 ? C.green : C.amber }}>
        14 → {incVal}
      </div>
    </div>
  );
};

const ManagerViz: React.FC<{ relFrame: number }> = ({ relFrame }) => {
  const leadP = interpolate(relFrame, [10, 40], [0, 0.9], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const deployP = interpolate(relFrame, [20, 50], [0, 0.85], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <div>
      {['Lead Time', 'Deploy Frequency'].map((label, i) => {
        const p = i === 0 ? leadP : deployP;
        return (
          <div key={label} style={{ marginBottom: 10 }}>
            <div style={{ fontFamily: SANS, fontSize: 11, color: C.dim, marginBottom: 4 }}>{label}</div>
            <div style={{ height: 8, backgroundColor: C.bg, borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ width: `${p * 100}%`, height: '100%', backgroundColor: C.green }} />
            </div>
          </div>
        );
      })}
      {relFrame > 50 && (
        <div style={{
          marginTop: 6, fontFamily: MONO, fontSize: 11, fontWeight: 700,
          color: C.green, backgroundColor: `${C.green}22`, padding: '4px 8px', borderRadius: 4,
          display: 'inline-block',
        }}>
          ELITE (DORA)
        </div>
      )}
    </div>
  );
};

const PERSONAS = [
  { emoji: '👨‍💻', label: 'Developer',          phrase: 'developer types', Viz: DeveloperViz },
  { emoji: '🏗️',  label: 'Platform Engineer',   phrase: 'platform engineer', Viz: PlatformViz },
  { emoji: '🛡️',  label: 'Security Engineer',   phrase: 'security engineer', Viz: SecurityViz },
  { emoji: '🚨',  label: 'SRE',                  phrase: 'SRE gets paged',    Viz: SREViz },
  { emoji: '📊',  label: 'Engineering Manager',  phrase: 'engineering manager', Viz: ManagerViz },
];

export const H06_DayOnTeam: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const KEY = 'h06';
  const total = getSceneDurationFrames(KEY);

  const unifyStart = findWordFrame(KEY, 'entire organization', total - 220);

  return (
    <div style={{ width: 1920, height: 1080, position: 'relative', overflow: 'hidden' }}>
      <Background />

      {/* Header */}
      <div style={{
        position: 'absolute', top: 50, left: 0, right: 0, textAlign: 'center',
        opacity: interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' }),
      }}>
        <div style={{ fontFamily: SANS, fontSize: 36, fontWeight: 900, color: C.white, letterSpacing: 3 }}>
          A DAY ON AN AI-NATIVE TEAM
        </div>
      </div>

      {/* 2×3 grid of persona vignettes */}
      <div style={{
        position: 'absolute', top: 150, left: 100, right: 100, bottom: 100,
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'repeat(2, 1fr)',
        gap: 30,
      }}>
        {PERSONAS.map((persona, i) => {
          const appearFrame = findWordFrame(KEY, persona.phrase, 200 + i * 200);
          const enter = spring({ frame: frame - appearFrame, fps, config: { damping: 14 } });
          if (frame < appearFrame) return null;

          // Docking animation — scale down when unifying
          const dock = frame > unifyStart ? spring({ frame: frame - unifyStart, fps, config: { damping: 16 } }) : 0;
          const scale = interpolate(dock, [0, 1], [1, 0.7]);
          const pulseGlow = frame > unifyStart ? interpolate(Math.sin((frame - unifyStart) * 0.2), [-1, 1], [0.3, 0.8]) : 0;

          const { Viz } = persona;
          return (
            <div key={i} style={{
              padding: 28, borderRadius: 20,
              backgroundColor: C.card, border: `1px solid ${C.blue}44`,
              display: 'flex', flexDirection: 'column', gap: 12,
              transform: `scale(${enter * scale})`,
              opacity: enter,
              boxShadow: frame > unifyStart ? `0 0 ${pulseGlow * 30}px ${C.violet}66` : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 28 }}>{persona.emoji}</div>
                <div style={{ fontFamily: SANS, fontSize: 18, fontWeight: 700, color: C.white }}>{persona.label}</div>
              </div>
              <div style={{ flex: 1 }}>
                <Viz relFrame={frame - appearFrame} />
              </div>
            </div>
          );
        })}

        {/* 6th tile — "Everyone" hub */}
        {frame >= unifyStart && (
          <div style={{
            padding: 28, borderRadius: 20,
            background: `radial-gradient(circle, ${C.violet}33, ${C.card})`,
            border: `2px solid ${C.violet}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: interpolate(frame - unifyStart, [0, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
            boxShadow: `0 0 40px ${C.violet}44`,
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>✨</div>
              <div style={{ fontFamily: SANS, fontSize: 20, fontWeight: 800, color: C.white, letterSpacing: 1 }}>One platform.</div>
              <div style={{ fontFamily: SANS, fontSize: 20, fontWeight: 800, color: C.violet, letterSpacing: 1 }}>One AI. One substrate.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
