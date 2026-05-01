import React from 'react';
import { interpolate } from 'remotion';
import { Scene, Phase, usePhase } from '../../storyboard/Scene';
import { C, F, Starfield } from '../../components/rh/primitives';

const CracksAndCost: React.FC = () => {
  const { phaseFrame } = usePhase();
  const tokens = Math.floor(interpolate(phaseFrame, [0, 80], [0, 47000], { extrapolateRight: 'clamp' }));
  const cost = interpolate(phaseFrame, [0, 80], [0, 0.89], { extrapolateRight: 'clamp' });
  const seconds = Math.floor(interpolate(phaseFrame, [0, 80], [0, 22], { extrapolateRight: 'clamp' }));
  return (
    <>
      <Starfield />
      <div style={{
        position: 'absolute', top: 80, left: 0, right: 0, textAlign: 'center', zIndex: 1,
      }}>
        <div style={{
          fontFamily: F.inter, fontSize: 42, fontWeight: 900, color: C.red, letterSpacing: 2,
        }}>
          THE TRADE-OFFS
        </div>
      </div>
      {/* 3 warning triangles */}
      <div style={{
        position: 'absolute', top: 220, left: 0, right: 0, zIndex: 1,
        display: 'flex', justifyContent: 'center', gap: 40,
      }}>
        {['Cost 10-50x', "Slower", "Fails weird"].map((w, i) => {
          const p = interpolate(phaseFrame - i * 15, [0, 20], [0, 1], {
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
          });
          return (
            <div key={i} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
              opacity: p,
            }}>
              <div style={{ fontSize: 60 }}>⚠️</div>
              <div style={{ fontFamily: F.mono, fontSize: 16, color: C.amber, fontWeight: 700 }}>
                {w}
              </div>
            </div>
          );
        })}
      </div>
      {/* Counters */}
      <div style={{
        position: 'absolute', bottom: 120, left: 0, right: 0, zIndex: 1,
        display: 'flex', justifyContent: 'center', gap: 40,
      }}>
        {[
          { label: 'Tokens', val: `${tokens.toLocaleString()}` },
          { label: 'Cost',   val: `$${cost.toFixed(2)}` },
          { label: 'Time',   val: `${seconds}s` },
        ].map((c, i) => (
          <div key={i} style={{
            padding: '18px 26px', borderRadius: 10,
            backgroundColor: '#101520', border: `1.5px solid ${C.red}`,
            fontFamily: F.mono, textAlign: 'center', minWidth: 140,
          }}>
            <div style={{ fontSize: 12, color: C.dim, letterSpacing: 2 }}>{c.label}</div>
            <div style={{ fontSize: 28, color: C.red, fontWeight: 900, marginTop: 4 }}>{c.val}</div>
          </div>
        ))}
      </div>
    </>
  );
};

const FailModeGauge: React.FC = () => {
  const { phaseFrame } = usePhase();
  // Needle swings from green (left, -60°) to red (right, +60°)
  const needleAngle = interpolate(phaseFrame, [0, 80], [-60, 60], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const showLabel = phaseFrame > 80;
  return (
    <>
      <Starfield />
      <div style={{
        position: 'absolute', top: 60, left: 0, right: 0, textAlign: 'center', zIndex: 1,
        fontFamily: F.inter, fontSize: 28, fontWeight: 900, color: C.text,
      }}>
        FAIL MODE
      </div>
      {/* Gauge */}
      <div style={{
        position: 'absolute', top: 240, left: '50%', transform: 'translateX(-50%)',
        width: 500, height: 260, zIndex: 1,
      }}>
        <svg width="500" height="260" viewBox="0 0 500 260">
          {/* Arc — green to red */}
          <defs>
            <linearGradient id="gauge" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={C.green} />
              <stop offset="50%" stopColor={C.amber} />
              <stop offset="100%" stopColor={C.red} />
            </linearGradient>
          </defs>
          <path d="M 50 230 A 200 200 0 0 1 450 230"
            fill="none" stroke="url(#gauge)" strokeWidth={18} strokeLinecap="round" />
          {/* Needle */}
          <g transform={`translate(250 230) rotate(${needleAngle})`}>
            <line x1="0" y1="0" x2="0" y2="-180" stroke={C.text} strokeWidth={4} strokeLinecap="round" />
            <circle cx="0" cy="0" r="10" fill={C.text} />
          </g>
        </svg>
        {/* Labels */}
        <div style={{
          position: 'absolute', bottom: -20, left: 0,
          fontFamily: F.mono, fontSize: 14, color: C.green, fontWeight: 700,
        }}>loud fail</div>
        <div style={{
          position: 'absolute', bottom: -20, right: 0,
          fontFamily: F.mono, fontSize: 14, color: C.red, fontWeight: 700,
        }}>silent + confident</div>
      </div>
      {showLabel && (
        <div style={{
          position: 'absolute', bottom: 120, left: 0, right: 0, textAlign: 'center', zIndex: 1,
          opacity: interpolate(phaseFrame - 80, [0, 20], [0, 1], { extrapolateRight: 'clamp' }),
          fontFamily: F.inter, fontSize: 22, color: C.red, fontWeight: 700,
        }}>
          the most dangerous kind
        </div>
      )}
    </>
  );
};

export const RH07_Tradeoffs: React.FC = () => (
  <Scene id="rh07">
    <Phase id="cracks_and_cost"><CracksAndCost /></Phase>
    <Phase id="fail_mode_gauge"><FailModeGauge /></Phase>
  </Scene>
);
