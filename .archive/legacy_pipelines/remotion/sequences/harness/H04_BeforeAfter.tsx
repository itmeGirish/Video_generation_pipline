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

// ─── TRADITIONAL SIDE ───
const TraditionalSide: React.FC<{ relFrame: number; collapseOut?: boolean }> = ({ relFrame, collapseOut }) => {
  const buildProgress = interpolate(relFrame, [30, 90], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const testProgress  = interpolate(relFrame, [90, 180], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const scanProgress  = interpolate(relFrame, [180, 240], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const deployProgress = interpolate(relFrame, [240, 300], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  // Total clock counts up to 1h 47m (107 min)
  const mins = Math.floor(interpolate(relFrame, [0, 360], [0, 107], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  const shatterShow = relFrame > 260;

  return (
    <div style={{ padding: 50, height: '100%', display: 'flex', flexDirection: 'column', gap: 20, position: 'relative', opacity: collapseOut ? 0.3 : 1 }}>
      <div style={{ fontFamily: MONO, fontSize: 18, color: C.amber, letterSpacing: 4, marginBottom: 10 }}>TRADITIONAL</div>

      {/* Commit */}
      <div style={{ fontFamily: MONO, fontSize: 14, color: C.dim }}>commit a3f9b21 →</div>

      {/* Build */}
      <div>
        <div style={{ fontFamily: SANS, fontSize: 14, color: C.white, marginBottom: 4 }}>Build: 20 min</div>
        <div style={{ height: 10, backgroundColor: C.card, borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ width: `${buildProgress * 100}%`, height: '100%', backgroundColor: C.amber }} />
        </div>
      </div>
      {/* Test */}
      <div>
        <div style={{ fontFamily: SANS, fontSize: 14, color: C.white, marginBottom: 4 }}>Test: 40 min</div>
        <div style={{ height: 10, backgroundColor: C.card, borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ width: `${testProgress * 100}%`, height: '100%', backgroundColor: C.amber }} />
        </div>
        <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
          {testProgress > 0.3 && Array.from({ length: 6 }).map((_, i) =>
            <span key={i} style={{ color: C.red, fontSize: 12 }}>✗</span>
          )}
        </div>
      </div>
      {/* Scan */}
      <div>
        <div style={{ fontFamily: SANS, fontSize: 14, color: C.white, marginBottom: 4 }}>Scan: 60 vulns found</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(15, 1fr)', gap: 3 }}>
          {Array.from({ length: 60 }).map((_, i) => {
            const shown = i / 60 < scanProgress;
            return shown ? <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: C.red }} /> : null;
          })}
        </div>
      </div>
      {/* Deploy */}
      <div>
        <div style={{ fontFamily: SANS, fontSize: 14, color: C.white, marginBottom: 4 }}>Deploy: staging broken</div>
        {shatterShow && <div style={{ fontSize: 40 }}>💥</div>}
      </div>

      {/* Clock */}
      <div style={{
        position: 'absolute', top: 50, right: 50,
        fontFamily: MONO, fontSize: 32, fontWeight: 800, color: C.amber,
      }}>
        {String(Math.floor(mins / 60)).padStart(1, '0')}h {String(mins % 60).padStart(2, '0')}m
      </div>

      {relFrame > 330 && (
        <div style={{ position: 'absolute', bottom: 50, right: 50, fontSize: 80 }}>😩</div>
      )}
    </div>
  );
};

// ─── HARNESS AI SIDE ───
const HarnessSide: React.FC<{ relFrame: number; collapseOut?: boolean }> = ({ relFrame, collapseOut }) => {
  const testIntShow = relFrame > 30;
  const appsecShow = relFrame > 120;
  const cvShow = relFrame > 230;
  const mins = Math.floor(interpolate(relFrame, [0, 360], [0, 8], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));

  return (
    <div style={{ padding: 50, height: '100%', display: 'flex', flexDirection: 'column', gap: 20, position: 'relative', opacity: collapseOut ? 0.3 : 1 }}>
      <div style={{ fontFamily: MONO, fontSize: 18, color: C.blue, letterSpacing: 4, marginBottom: 10 }}>HARNESS AI</div>
      <div style={{ fontFamily: MONO, fontSize: 14, color: C.dim }}>commit a3f9b21 →</div>

      {/* Test Intelligence */}
      {testIntShow && (
        <div>
          <div style={{ fontFamily: SANS, fontSize: 14, color: C.white, marginBottom: 4 }}>
            Test Intelligence <span style={{ color: C.green, marginLeft: 8 }}>-80%</span>
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {Array.from({ length: 30 }).map((_, i) => {
              const isRun = i < 6;
              return (
                <div key={i} style={{
                  width: 14, height: 18, borderRadius: 3,
                  backgroundColor: isRun ? C.green : C.dim,
                  opacity: isRun ? 1 : 0.3,
                }} />
              );
            })}
          </div>
        </div>
      )}

      {/* AppSec Agent */}
      {appsecShow && (
        <div>
          <div style={{ fontFamily: SANS, fontSize: 14, color: C.white, marginBottom: 6 }}>
            AppSec: 60 → 3 priority <span style={{ color: C.violet, marginLeft: 8 }}>AI-triaged</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(15, 1fr)', gap: 3 }}>
            {Array.from({ length: 60 }).map((_, i) => {
              const real = i < 3;
              return (
                <div key={i} style={{
                  width: 8, height: 8, borderRadius: '50%',
                  backgroundColor: real ? C.red : C.dim,
                  opacity: real ? 1 : 0.2,
                }} />
              );
            })}
          </div>
          <div style={{ fontFamily: MONO, fontSize: 11, color: C.violet, marginTop: 6 }}>💡 fix suggested</div>
        </div>
      )}

      {/* Continuous Verification */}
      {cvShow && (
        <div>
          <div style={{ fontFamily: SANS, fontSize: 14, color: C.white, marginBottom: 6 }}>Continuous Verification</div>
          <svg width={280} height={60}>
            <path d="M 0 40 L 40 38 L 80 35 L 120 34 L 160 30 L 180 15 L 200 38 L 240 38 L 280 38"
              fill="none" stroke={C.green} strokeWidth={2} />
            <circle cx={180} cy={15} r={6} fill={C.violet} opacity={0.9} />
          </svg>
          <div style={{ fontFamily: MONO, fontSize: 11, color: C.green, backgroundColor: `${C.green}22`, padding: '3px 8px', borderRadius: 4, display: 'inline-block', marginTop: 4 }}>
            auto-rollback ✓
          </div>
        </div>
      )}

      {/* Clock */}
      <div style={{
        position: 'absolute', top: 50, right: 50,
        fontFamily: MONO, fontSize: 32, fontWeight: 800, color: C.green,
      }}>
        {mins}m
      </div>

      {cvShow && <div style={{ position: 'absolute', bottom: 50, right: 50, fontSize: 80 }}>🙂</div>}
    </div>
  );
};

export const H04_BeforeAfter: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const KEY = 'h04';
  const total = getSceneDurationFrames(KEY);

  const traditionalStart = findWordFrame(KEY, 'A developer merges', 30);
  const harnessStart     = findWordFrame(KEY, 'AI-native Harness', 900);
  const collapseStart    = findWordFrame(KEY, 'Same developer', total - 250);

  const splitFade = interpolate(frame, [0, 30], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const traditionalActive = frame >= traditionalStart && frame < harnessStart;
  const collapseOut = frame > collapseStart;

  // Collapse animation: sides squeeze together
  const collapseP = spring({ frame: frame - collapseStart, fps, config: { damping: 14 } });

  return (
    <div style={{ width: 1920, height: 1080, position: 'relative' }}>
      <Background />

      {/* Title */}
      <div style={{
        position: 'absolute', top: 40, left: 0, right: 0, textAlign: 'center',
        fontFamily: SANS, fontSize: 26, fontWeight: 700, color: C.white, letterSpacing: 2,
      }}>
        Same merge. Two pipelines.
      </div>

      {/* Split container */}
      <div style={{
        position: 'absolute', top: 110, left: 0, right: 0, bottom: 150,
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        opacity: splitFade,
      }}>
        <TraditionalSide relFrame={frame - traditionalStart} collapseOut={collapseOut} />
        <HarnessSide relFrame={frame - harnessStart} collapseOut={collapseOut} />
      </div>

      {/* Vertical divider */}
      {!collapseOut && (
        <div style={{
          position: 'absolute', top: 110, bottom: 150, left: '50%',
          width: 2, background: `linear-gradient(180deg, transparent, ${C.violet}88, transparent)`,
        }} />
      )}

      {/* Collapse final card */}
      {collapseOut && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: `translate(-50%, -50%) scale(${collapseP})`,
          textAlign: 'center', opacity: collapseP,
        }}>
          <div style={{ fontFamily: SANS, fontSize: 72, fontWeight: 900, color: C.white, display: 'flex', alignItems: 'center', gap: 30 }}>
            <span style={{ color: C.amber }}>1h 47m</span>
            <span style={{ color: C.violet, fontSize: 60 }}>→</span>
            <span style={{ color: C.green }}>8m</span>
          </div>
          <div style={{ fontFamily: SANS, fontSize: 20, color: C.dim, marginTop: 20, letterSpacing: 1 }}>
            Same developer. Same code. Different pipeline.
          </div>
        </div>
      )}
    </div>
  );
};
