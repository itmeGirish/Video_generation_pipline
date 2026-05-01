import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { findWordFrame, getSceneDurationFrames } from '../../utils/audioSync';

const C = {
  bg: '#0A1628', blue: '#00ADE4', violet: '#7C5CFF',
  green: '#22C55E', amber: '#F59E0B',
  white: '#E8F4FF', dim: '#4A5568', card: '#111E34',
};
const MONO = 'JetBrains Mono, monospace';
const SANS = 'Inter, sans-serif';

const Background: React.FC = () => (
  <>
    <div style={{ position: 'absolute', inset: 0, backgroundColor: C.bg }} />
    <div style={{
      position: 'absolute', inset: 0, opacity: 0.3,
      backgroundImage: 'radial-gradient(circle, rgba(0,173,228,0.1) 1px, transparent 1px)',
      backgroundSize: '40px 40px',
    }} />
  </>
);

const STATS = [
  { big: '8', unit: '×', label: 'faster builds',              icon: '⚡', phrase: 'Build times' },
  { big: '80', unit: '%', label: 'shorter test cycles',       icon: '🧪', phrase: 'Test cycles' },
  { big: '50+', unit: '%', label: 'fewer deploy failures',    icon: '🛡️', phrase: 'Deployment failure' },
  { big: '80', unit: ':1', label: 'pipeline updates — Ancestry', icon: '🌳', phrase: 'Ancestry' },
  { big: 'min', unit: 's', label: 'PR → prod — Citibank',     icon: '🏦', phrase: 'Citibank' },
];

const StatCard: React.FC<{ stat: typeof STATS[0]; appearFrame: number }> = ({ stat, appearFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - appearFrame, fps, config: { damping: 14 } });

  if (frame < appearFrame) return null;

  // Big number counts up
  const isNumeric = /^\d/.test(stat.big);
  const target = isNumeric ? parseInt(stat.big) : 0;
  const counted = isNumeric ? Math.floor(interpolate(frame - appearFrame - 10, [0, 30], [0, target], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })) : stat.big;
  const displayBig = isNumeric ? `${counted}${stat.big.endsWith('+') ? '+' : ''}` : stat.big;

  return (
    <div style={{
      width: 280, height: 220, borderRadius: 20,
      backgroundColor: C.card, border: `1px solid ${C.blue}66`,
      padding: 28, display: 'flex', flexDirection: 'column', gap: 8,
      transform: `translateY(${interpolate(enter, [0, 1], [40, 0])}px) scale(${interpolate(enter, [0, 1], [0.9, 1])})`,
      opacity: enter,
      boxShadow: `0 0 30px ${C.blue}22`,
    }}>
      <div style={{ fontSize: 40 }}>{stat.icon}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <div style={{ fontFamily: SANS, fontSize: 68, fontWeight: 900, color: C.blue, lineHeight: 1 }}>{displayBig}</div>
        <div style={{ fontFamily: SANS, fontSize: 36, fontWeight: 800, color: C.violet }}>{stat.unit}</div>
      </div>
      <div style={{ fontFamily: SANS, fontSize: 14, color: C.white, opacity: 0.85 }}>{stat.label}</div>
    </div>
  );
};

const LOGOS = ['JPMorgan', 'Goldman', 'Santander', 'UBS', 'BNP', 'Nasdaq',
                'Walmart', 'Target', 'Nordstrom', 'Lowes',
                'Verizon', 'AT&T', 'T-Mobile',
                'Oracle', 'IBM', 'Cisco', 'VMware', 'Nvidia'];

export const H05_Numbers: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const KEY = 'h05';
  const total = getSceneDurationFrames(KEY);

  const statsStart   = findWordFrame(KEY, 'release cycles', 200);
  const logosStart   = findWordFrame(KEY, 'Hundreds of enterprises', total - 500);
  const categoryStart = findWordFrame(KEY, 'new category', total - 200);

  // Header banner
  const headerSpring = spring({ frame, fps, config: { damping: 14 } });
  const headerY = frame < statsStart ? 0 : -380; // slams in center then moves up

  return (
    <div style={{ width: 1920, height: 1080, position: 'relative', overflow: 'hidden' }}>
      <Background />

      {/* BY THE NUMBERS header */}
      <div style={{
        position: 'absolute', top: '50%', left: 0, right: 0,
        transform: `translateY(${headerY}px) scale(${interpolate(headerSpring, [0, 1], [0.8, 1])})`,
        textAlign: 'center', transition: 'transform 0.5s',
        opacity: headerSpring,
      }}>
        <div style={{
          fontFamily: SANS, fontSize: 100, fontWeight: 900, color: C.blue,
          letterSpacing: 8, textShadow: `0 0 40px ${C.blue}66`,
        }}>
          BY THE NUMBERS
        </div>
      </div>

      {/* Stats grid */}
      {frame >= statsStart && (
        <div style={{
          position: 'absolute', top: 180, left: 0, right: 0, bottom: 300,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 30, flexWrap: 'wrap', padding: '0 80px',
        }}>
          {STATS.map((stat, i) => {
            const appearFrame = findWordFrame(KEY, stat.phrase, statsStart + i * 60);
            return <StatCard key={i} stat={stat} appearFrame={appearFrame} />;
          })}
        </div>
      )}

      {/* Logo scroll reel */}
      {frame >= logosStart && (
        <div style={{
          position: 'absolute', bottom: 140, left: 0, right: 0, height: 80,
          overflow: 'hidden',
          opacity: interpolate(frame - logosStart, [0, 30], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
        }}>
          <div style={{
            display: 'flex', gap: 60, alignItems: 'center',
            transform: `translateX(${-(frame - logosStart) * 3 % (LOGOS.length * 180)}px)`,
          }}>
            {[...LOGOS, ...LOGOS].map((logo, i) => (
              <div key={i} style={{
                padding: '12px 24px', fontFamily: SANS, fontSize: 20, fontWeight: 600,
                color: C.dim, backgroundColor: C.card, borderRadius: 8,
                border: `1px solid ${C.dim}`, whiteSpace: 'nowrap',
              }}>
                {logo}
              </div>
            ))}
          </div>
          <div style={{
            position: 'absolute', top: -32, left: 0, right: 0, textAlign: 'center',
            fontFamily: SANS, fontSize: 16, color: C.violet, letterSpacing: 2,
          }}>
            Hundreds of enterprises run software delivery on Harness.
          </div>
        </div>
      )}

      {/* Category wipe */}
      {frame >= categoryStart && (
        <div style={{
          position: 'absolute', bottom: 40, left: 0, right: 0, textAlign: 'center',
          opacity: interpolate(frame - categoryStart, [0, 30], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
        }}>
          <div style={{
            fontFamily: SANS, fontSize: 32, fontWeight: 800, color: C.white,
            letterSpacing: 1,
          }}>
            AI-native software delivery → a new category.
          </div>
        </div>
      )}
    </div>
  );
};
