import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { Scene, Phase, usePhase } from '../../storyboard/Scene';
import { C, F, Starfield, ClaudeOrb, TypewriterText, StampX, ToolRing } from '../../components/rh/primitives';

const QUESTION = 'Write me a report on Q3 revenue.';

const Terminal: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{
    position: 'absolute', inset: 0, zIndex: 1,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: 50,
  }}>
    {children}
  </div>
);

// Phase 1: question types + orb appears, fails
const QuestionTyped: React.FC = () => {
  const { phaseFrame, phaseDuration } = usePhase();
  return (
    <>
      <Starfield />
      <Terminal>
        <div style={{ fontFamily: F.mono, fontSize: 36, color: C.text }}>
          <TypewriterText text={QUESTION} startFrame={10} cps={20} />
        </div>
      </Terminal>
    </>
  );
};

const NoHarnessFail: React.FC = () => {
  const { phaseFrame, phaseDuration } = usePhase();
  const { fps } = useVideoConfig();
  const orbScale = spring({ frame: phaseFrame, fps, config: { damping: 12, stiffness: 180 } });
  return (
    <>
      <Starfield />
      <Terminal>
        <div style={{ fontFamily: F.mono, fontSize: 36, color: C.text, opacity: 0.4 }}>
          {QUESTION}
        </div>
        <div style={{ position: 'relative', transform: `scale(${orbScale})` }}>
          <ClaudeOrb x={0} y={0} size={140} />
        </div>
        <div style={{
          fontFamily: F.mono, fontSize: 32, color: C.red, marginTop: 20,
          opacity: interpolate(phaseFrame, [15, 25], [0, 1], { extrapolateRight: 'clamp' }),
        }}>
          &ldquo;I don&rsquo;t have access to your data.&rdquo;
        </div>
      </Terminal>
      {phaseFrame > 35 && <StampX x={960} y={540} startFrame={0} />}
    </>
  );
};

const WithHarnessSuccess: React.FC = () => {
  const { phaseFrame } = usePhase();
  const reportLines = [
    'Q3 2025 Revenue Report',
    '─────────────────────',
    'Total Revenue: $4.2M  (+18% YoY)',
    'Top segment: Enterprise',
    'Forecast Q4: $4.8M – $5.1M',
  ];
  // Absolute layout: question top, orb+tools left-center, report right-center. No overlap.
  return (
    <>
      <Starfield />
      {/* Question persists at top */}
      <div style={{
        position: 'absolute', top: 80, left: 0, right: 0, textAlign: 'center', zIndex: 1,
        fontFamily: F.mono, fontSize: 28, color: C.text, opacity: 0.35,
      }}>
        {QUESTION}
      </div>
      {/* Orb + tool ring on LEFT half */}
      <ClaudeOrb x={560} y={560} size={130} />
      <ToolRing cx={560} cy={560} r={200} startFrame={5} />
      {/* Report card on RIGHT half, outside orbit radius */}
      {phaseFrame > 50 && (
        <div style={{
          position: 'absolute', left: 1040, top: 400, width: 700,
          fontFamily: F.mono, fontSize: 22, color: C.green, lineHeight: 1.6,
          padding: '20px 28px', backgroundColor: '#101520', borderRadius: 10,
          border: `1.5px solid ${C.green}66`, boxShadow: `0 0 20px ${C.green}33`, zIndex: 2,
          opacity: interpolate(phaseFrame, [50, 70], [0, 1], { extrapolateRight: 'clamp' }),
        }}>
          {reportLines.map((l, i) => {
            const start = 50 + i * 12;
            return phaseFrame > start ? <div key={i}>{l}</div> : null;
          })}
        </div>
      )}
    </>
  );
};

export const RH01_ColdOpen: React.FC = () => (
  <Scene id="rh01">
    <Phase id="question_typed"><QuestionTyped /></Phase>
    <Phase id="no_harness_fail"><NoHarnessFail /></Phase>
    <Phase id="with_harness_success"><WithHarnessSuccess /></Phase>
  </Scene>
);
