import React from 'react';
import { interpolate } from 'remotion';
import { Scene, Phase, usePhase } from '../../storyboard/Scene';
import { C, F, Starfield, ClaudeOrb, ToolRing, ImpactText, TOOLS_6_LABELED } from '../../components/rh/primitives';

const LoopbackDemo: React.FC = () => {
  const { phaseFrame } = usePhase();
  const showLabels = phaseFrame > 40;
  return (
    <>
      <Starfield />
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          fontFamily: F.mono, fontSize: 22, color: C.text, opacity: 0.4, marginBottom: 80,
        }}>
          Write me a report on Q3 revenue.
        </div>
        <div style={{ position: 'relative', height: 500, width: 500 }}>
          <ClaudeOrb x={250} y={250} size={140} />
          <ToolRing cx={250} cy={250} r={200} startFrame={10}
            tools={TOOLS_6_LABELED} showLabels={showLabels} />
        </div>
      </div>
    </>
  );
};

const MagentaSlam: React.FC = () => {
  const { phaseFrame, phaseDuration } = usePhase();
  return (
    <>
      <Starfield />
      <ImpactText text="Same model. Different harness." startFrame={5} />
    </>
  );
};

const FinalHold: React.FC = () => {
  const { phaseFrame, phaseDuration } = usePhase();
  const fade = interpolate(phaseFrame, [0, 20, phaseDuration - 20, phaseDuration], [0, 1, 1, 0]);
  return (
    <>
      <Starfield />
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: fade,
      }}>
        <div style={{
          fontFamily: F.inter, fontSize: 72, fontWeight: 900, color: C.magenta,
          letterSpacing: 1, textAlign: 'center', textShadow: `0 0 30px ${C.magenta}aa`,
        }}>
          Same model.<br />
          <span style={{ color: C.cyan }}>Different harness.</span>
        </div>
      </div>
    </>
  );
};

export const RH11_LoopbackCloser: React.FC = () => (
  <Scene id="rh11">
    <Phase id="loopback_demo"><LoopbackDemo /></Phase>
    <Phase id="magenta_slam"><MagentaSlam /></Phase>
    <Phase id="final_hold"><FinalHold /></Phase>
  </Scene>
);
