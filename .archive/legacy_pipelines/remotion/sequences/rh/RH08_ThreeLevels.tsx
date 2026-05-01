import React from 'react';
import { interpolate, spring, useVideoConfig } from 'remotion';
import { Scene, Phase, usePhase } from '../../storyboard/Scene';
import { C, F, Starfield } from '../../components/rh/primitives';

const LEVELS = [
  {
    num: '1',
    title: 'WRAPPER',
    desc: 'One AI, one tool, no memory.',
    examples: 'Chat apps · Q&A · writing helpers',
    detail: '80% of AI products on Product Hunt. Ship in a weekend.',
  },
  {
    num: '2',
    title: 'AGENT',
    desc: 'Tools + loop + short-term memory.',
    examples: 'Cursor · Claude Code · Mumbai demo',
    detail: '10× harder. 100× more useful.',
  },
  {
    num: '3',
    title: 'SYSTEM',
    desc: 'Multiple agents, long-term memory, eval loops.',
    examples: 'Autonomous workflows',
    detail: 'Overkill for most. Essential for a few.',
  },
];

const LevelCard: React.FC<{ level: typeof LEVELS[0]; active: boolean; highlight?: boolean }> = ({ level, active, highlight }) => (
  <div style={{
    padding: '28px 36px', borderRadius: 14,
    backgroundColor: '#101520',
    border: `2px solid ${highlight ? C.amber : C.cyan}${active ? '' : '66'}`,
    boxShadow: highlight ? `0 0 30px ${C.amber}88` : (active ? `0 0 20px ${C.cyan}66` : 'none'),
    display: 'flex', gap: 24, alignItems: 'center',
    transform: active ? 'scale(1.0)' : 'scale(0.92)',
    opacity: active ? 1 : 0.5, zIndex: 1,
  }}>
    <div style={{
      width: 72, height: 72, borderRadius: '50%',
      backgroundColor: highlight ? C.amber : C.cyan, color: '#000',
      fontFamily: F.inter, fontSize: 42, fontWeight: 900,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      {level.num}
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontFamily: F.inter, fontSize: 26, fontWeight: 900, color: C.text, letterSpacing: 2 }}>
        {level.title}
      </div>
      <div style={{ fontFamily: F.mono, fontSize: 14, color: C.cyan, marginTop: 4 }}>
        {level.desc}
      </div>
      <div style={{ fontFamily: F.mono, fontSize: 13, color: C.dim, marginTop: 8 }}>
        {level.examples}
      </div>
      <div style={{ fontFamily: F.mono, fontSize: 12, color: highlight ? C.amber : C.text, marginTop: 6, fontStyle: 'italic' }}>
        {level.detail}
      </div>
    </div>
  </div>
);

const TitleBar: React.FC = () => (
  <>
    <Starfield />
    <div style={{
      position: 'absolute', inset: 0, zIndex: 1,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        fontFamily: F.inter, fontSize: 96, fontWeight: 900, color: C.text, letterSpacing: 6,
      }}>
        THREE LEVELS
      </div>
    </div>
  </>
);

const Level1: React.FC = () => (
  <>
    <Starfield />
    <div style={{
      position: 'absolute', inset: 0, zIndex: 1, padding: '40px 120px',
      display: 'flex', flexDirection: 'column', gap: 20, justifyContent: 'center',
    }}>
      <LevelCard level={LEVELS[0]} active={true} highlight />
      <LevelCard level={LEVELS[1]} active={false} />
      <LevelCard level={LEVELS[2]} active={false} />
    </div>
  </>
);

const Level2: React.FC = () => (
  <>
    <Starfield />
    <div style={{
      position: 'absolute', inset: 0, zIndex: 1, padding: '40px 120px',
      display: 'flex', flexDirection: 'column', gap: 20, justifyContent: 'center',
    }}>
      <LevelCard level={LEVELS[0]} active={false} />
      <LevelCard level={LEVELS[1]} active={true} highlight />
      <LevelCard level={LEVELS[2]} active={false} />
    </div>
  </>
);

const Level3: React.FC = () => {
  const { phaseFrame } = usePhase();
  const unison = phaseFrame > 120;
  return (
    <>
      <Starfield />
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1, padding: '40px 120px',
        display: 'flex', flexDirection: 'column', gap: 20, justifyContent: 'center',
      }}>
        <LevelCard level={LEVELS[0]} active={unison} highlight={unison} />
        <LevelCard level={LEVELS[1]} active={unison} highlight={unison} />
        <LevelCard level={LEVELS[2]} active={true} highlight />
      </div>
    </>
  );
};

export const RH08_ThreeLevels: React.FC = () => (
  <Scene id="rh08">
    <Phase id="title_bar"><TitleBar /></Phase>
    <Phase id="level_1_wrapper"><Level1 /></Phase>
    <Phase id="level_2_agent"><Level2 /></Phase>
    <Phase id="level_3_system"><Level3 /></Phase>
  </Scene>
);
