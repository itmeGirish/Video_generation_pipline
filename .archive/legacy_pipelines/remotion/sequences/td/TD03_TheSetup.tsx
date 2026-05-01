import React from 'react';
import { interpolate, spring, useVideoConfig } from 'remotion';
import { Scene, Phase, usePhase } from '../../storyboard/Scene';
import { TC, TF, Backdrop } from '../../components/td/primitives';

const RoadmapCard: React.FC<{
  rank: string; title: string; appearAt: number; phaseFrame: number; redacted?: boolean;
  highlighted?: boolean;
}> = ({ rank, title, appearAt, phaseFrame, redacted = false, highlighted = false }) => {
  const opacity = interpolate(phaseFrame - appearAt, [0, 14], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const x = interpolate(phaseFrame - appearAt, [0, 20], [-60, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const color = highlighted ? TC.amber : redacted ? TC.red : TC.cyan;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 24, padding: '20px 32px',
      backgroundColor: TC.panel, border: `2px solid ${color}66`, borderRadius: 10,
      width: 720, opacity, transform: `translateX(${x}px)`,
      boxShadow: highlighted ? `0 0 30px ${color}88` : 'none',
    }}>
      <div style={{
        fontFamily: TF.mono, fontSize: 36, fontWeight: 900, color,
        minWidth: 60, textAlign: 'center',
      }}>
        #{rank}
      </div>
      {redacted ? (
        // Proper redacted bar — solid black rectangle with "REDACTED" stamp,
        // not unicode block characters. Reads cleanly at any resolution.
        <div style={{
          flex: 1, height: 36, position: 'relative',
          backgroundColor: '#000', borderRadius: 4,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
        }}>
          <div style={{
            fontFamily: TF.mono, fontSize: 13, fontWeight: 900,
            color: TC.red, letterSpacing: 6, textShadow: `0 0 8px ${TC.red}88`,
          }}>
            ▮ R E D A C T E D ▮
          </div>
        </div>
      ) : (
        <div style={{
          fontFamily: TF.inter, fontSize: 26, color: TC.text, fontWeight: 700,
        }}>
          {title}
        </div>
      )}
    </div>
  );
};

const FourWorkflows: React.FC = () => {
  const { phaseFrame } = usePhase();
  return (
    <>
      <Backdrop />
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 18,
      }}>
        <div style={{
          fontFamily: TF.mono, fontSize: 14, color: TC.cyan, letterSpacing: 4, marginBottom: 12,
          opacity: interpolate(phaseFrame, [0, 10], [0, 1], { extrapolateRight: 'clamp' }),
        }}>
          THE 4 WORKFLOWS · RANKED
        </div>
        <RoadmapCard rank="4" title="Post-Trade Journal"      appearAt={10} phaseFrame={phaseFrame} />
        <RoadmapCard rank="3" title="News Triage"             appearAt={20} phaseFrame={phaseFrame} />
        <RoadmapCard rank="2" title="Earnings Call Analysis"  appearAt={30} phaseFrame={phaseFrame} />
        <RoadmapCard rank="1" title="█ █ █ █ █ █ █ █ █"        appearAt={40} phaseFrame={phaseFrame} redacted />
      </div>
    </>
  );
};

const RedactedReveal: React.FC = () => {
  const { phaseFrame } = usePhase();
  return (
    <>
      <Backdrop />
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 18,
      }}>
        <RoadmapCard rank="4" title="Post-Trade Journal"      appearAt={0} phaseFrame={phaseFrame} />
        <RoadmapCard rank="3" title="News Triage"             appearAt={0} phaseFrame={phaseFrame} />
        <RoadmapCard rank="2" title="Earnings Call Analysis"  appearAt={0} phaseFrame={phaseFrame} />
        <RoadmapCard rank="1" title="█ █ █ █ █ █ █ █ █"        appearAt={0} phaseFrame={phaseFrame} redacted />
        {phaseFrame > 30 && (
          <div style={{
            marginTop: 30,
            fontFamily: TF.inter, fontSize: 26, color: TC.amber, fontWeight: 700,
            opacity: interpolate(phaseFrame - 30, [0, 18], [0, 1], { extrapolateRight: 'clamp' }),
          }}>
            #1 — saved for the end. Wish I'd known a year ago.
          </div>
        )}
      </div>
    </>
  );
};

export const TD03_TheSetup: React.FC = () => (
  <Scene id="td03">
    <Phase id="four_workflows"><FourWorkflows /></Phase>
    <Phase id="redacted_reveal"><RedactedReveal /></Phase>
  </Scene>
);
