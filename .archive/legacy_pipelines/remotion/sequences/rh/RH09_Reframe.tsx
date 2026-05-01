import React from 'react';
import { interpolate, spring, useVideoConfig } from 'remotion';
import { Scene, Phase, usePhase } from '../../storyboard/Scene';
import { C, F, Starfield } from '../../components/rh/primitives';

const TierRow: React.FC<{ label: string; count: number; color: string; baseY: number; show: boolean }> = ({
  label, count, color, baseY, show,
}) => (
  <div style={{
    position: 'absolute', top: baseY, left: 100, right: 100, zIndex: 1,
    display: 'flex', alignItems: 'center', gap: 30,
    opacity: show ? 1 : 0.4,
  }}>
    <div style={{
      fontFamily: F.inter, fontSize: 18, fontWeight: 700, color, letterSpacing: 2, width: 140,
    }}>
      {label}
    </div>
    <div style={{ flex: 1, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{
          width: 36, height: 36, borderRadius: 6,
          backgroundColor: `${color}33`, border: `1px solid ${color}`,
        }} />
      ))}
    </div>
  </div>
);

const IndustryMap: React.FC = () => {
  const { phaseFrame, progress } = usePhase();
  // Camera pullback: scale 1.0 → 0.6 across the phase, driven by progress
  // so it auto-fits whatever duration the phase receives.
  const scale = interpolate(progress, [0, 1], [1.0, 0.6]);
  return (
    <>
      <Starfield />
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
      }}>
        <div style={{
          position: 'absolute', top: 40, left: 0, right: 0, textAlign: 'center',
          fontFamily: F.inter, fontSize: 32, fontWeight: 900, color: C.text, letterSpacing: 3,
        }}>
          THE AI PRODUCT LANDSCAPE
        </div>
        <TierRow label="Level 1" count={12} color={C.cyan}    baseY={200} show={phaseFrame > 20} />
        <TierRow label="Level 2" count={6}  color={C.amber}   baseY={440} show={phaseFrame > 60} />
        <TierRow label="Level 3" count={3}  color={C.magenta} baseY={680} show={phaseFrame > 100} />
      </div>
    </>
  );
};

const CaptionReveal: React.FC = () => {
  const { phaseFrame } = usePhase();
  return (
    <>
      <Starfield />
      <div style={{
        position: 'absolute', top: 40, left: 0, right: 0, textAlign: 'center', zIndex: 1,
        fontFamily: F.inter, fontSize: 22, color: C.dim, letterSpacing: 2, opacity: 0.5,
      }}>
        THE AI PRODUCT LANDSCAPE
      </div>
      <TierRow label="Level 1" count={12} color={C.cyan}    baseY={200} show={true} />
      <TierRow label="Level 2" count={6}  color={C.amber}   baseY={340} show={true} />
      <TierRow label="Level 3" count={3}  color={C.magenta} baseY={480} show={true} />
      <div style={{
        position: 'absolute', bottom: 180, left: 0, right: 0, textAlign: 'center', zIndex: 2,
        opacity: interpolate(phaseFrame, [0, 25], [0, 1], { extrapolateRight: 'clamp' }),
      }}>
        <div style={{
          fontFamily: F.inter, fontSize: 42, fontWeight: 900, color: C.text, letterSpacing: 1,
          lineHeight: 1.3, maxWidth: 1400, margin: '0 auto',
        }}>
          The model is just <span style={{ color: C.claude }}>one power tool</span>.
          <br />
          The harness is the <span style={{ color: C.cyan }}>workshop</span>.
        </div>
      </div>
    </>
  );
};

export const RH09_Reframe: React.FC = () => (
  <Scene id="rh09">
    <Phase id="industry_map"><IndustryMap /></Phase>
    <Phase id="caption_reveal"><CaptionReveal /></Phase>
  </Scene>
);
