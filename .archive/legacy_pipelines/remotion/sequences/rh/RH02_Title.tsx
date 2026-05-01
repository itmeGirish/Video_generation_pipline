import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { Scene, Phase, usePhase } from '../../storyboard/Scene';
import { C, F, Starfield } from '../../components/rh/primitives';

const TierIcon: React.FC<{ level: 1 | 2 | 3; x: number; y: number; opacity: number }> = ({ level, x, y, opacity }) => {
  const size = 64;
  return (
    <div style={{
      position: 'absolute', left: x - size / 2, top: y - size / 2,
      width: size, height: size, opacity, zIndex: 1,
    }}>
      {level === 1 && (
        <div style={{
          width: '100%', height: '100%', border: `2px solid ${C.cyan}`, borderRadius: '50%',
        }} />
      )}
      {level === 2 && (
        <>
          <div style={{
            position: 'absolute', inset: 0, border: `2px solid ${C.cyan}`, borderRadius: '50%',
          }} />
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            width: 20, height: 20, borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: C.claude,
          }} />
          {[0, 90, 180, 270].map((angle) => (
            <div key={angle} style={{
              position: 'absolute',
              left: 32 + Math.cos(angle * Math.PI / 180) * 40 - 4,
              top: 32 + Math.sin(angle * Math.PI / 180) * 40 - 4,
              width: 8, height: 8, borderRadius: '50%',
              backgroundColor: C.cyan,
            }} />
          ))}
        </>
      )}
      {level === 3 && (
        <>
          <div style={{ position: 'absolute', inset: 0, border: `2px solid ${C.cyan}`, borderRadius: '50%' }} />
          {[0, 60, 120, 180, 240, 300].map((angle) => (
            <div key={angle} style={{
              position: 'absolute',
              left: 32 + Math.cos(angle * Math.PI / 180) * 32 - 5,
              top: 32 + Math.sin(angle * Math.PI / 180) * 32 - 5,
              width: 10, height: 10, borderRadius: 2,
              backgroundColor: C.cyan, opacity: 0.9,
            }} />
          ))}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            width: 16, height: 16, borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: C.claude,
          }} />
        </>
      )}
    </div>
  );
};

const TitleCard: React.FC = () => {
  const { phaseFrame, phaseDuration } = usePhase();
  const { fps } = useVideoConfig();

  // Title assembles letter-by-letter
  const title = 'THE AI HARNESS';
  const titleProgress = Math.min(
    Math.max(0, Math.floor((phaseFrame - 20) * 0.5)),
    title.length,
  );
  const subtitleOpacity = interpolate(phaseFrame, [50, 80], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  // Three tier icons flash at 30% through, one at a time
  const tierIconStart = Math.round(phaseDuration * 0.35);
  const tierDur = 50;
  const tierFlashOpacity = (i: number) => {
    const start = tierIconStart + i * (tierDur + 10);
    return interpolate(
      phaseFrame,
      [start, start + 8, start + tierDur - 8, start + tierDur],
      [0, 0.7, 0.7, 0],
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
    );
  };

  return (
    <>
      <Starfield />
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 30,
      }}>
        <div style={{
          fontFamily: F.inter, fontSize: 128, fontWeight: 900, color: C.text,
          letterSpacing: 8, textShadow: `0 0 40px ${C.cyan}aa`,
        }}>
          {title.substring(0, titleProgress)}
        </div>
        <div style={{
          fontFamily: F.mono, fontSize: 22, color: C.cyan,
          opacity: subtitleOpacity, letterSpacing: 2,
        }}>
          The scaffolding that turns an AI into a product.
        </div>
      </div>
      {/* Three tier icons teased along bottom */}
      <TierIcon level={1} x={800}  y={920} opacity={tierFlashOpacity(0)} />
      <TierIcon level={2} x={960}  y={920} opacity={tierFlashOpacity(1)} />
      <TierIcon level={3} x={1120} y={920} opacity={tierFlashOpacity(2)} />
    </>
  );
};

export const RH02_Title: React.FC = () => (
  <Scene id="rh02">
    <Phase id="title_card"><TitleCard /></Phase>
  </Scene>
);
