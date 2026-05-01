import React from 'react';
import { interpolate, spring, useVideoConfig } from 'remotion';
import { Scene, Phase, usePhase } from '../../storyboard/Scene';
import { C, F, Starfield, TypewriterText } from '../../components/rh/primitives';
import { SvgForEmoji } from '../../components/rh/svgIcons';

const SLOTS = [
  { label: 'INPUT',  icon: '📥', angle: -90 },
  { label: 'TOOLS',  icon: '🔧', angle: -18 },
  { label: 'MEMORY', icon: '🧠', angle: 54 },
  { label: 'LOOP',   icon: '🔁', angle: 126 },
  { label: 'OUTPUT', icon: '📤', angle: 198 },
];

const DictionaryCard: React.FC = () => {
  const { phaseFrame } = usePhase();
  return (
    <>
      <Starfield />
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          padding: '40px 60px', borderRadius: 12,
          backgroundColor: '#101520', border: `1.5px solid ${C.cyan}`,
          boxShadow: `0 0 30px ${C.cyan}44`,
          maxWidth: 900,
        }}>
          <div style={{ fontFamily: F.inter, fontSize: 36, fontWeight: 900, color: C.text, marginBottom: 4 }}>
            <TypewriterText text="harness" startFrame={10} cps={18} cursor={false} />
            <span style={{ fontSize: 20, color: C.dim, marginLeft: 12, fontStyle: 'italic' }}>(noun)</span>
          </div>
          <div style={{ fontFamily: F.inter, fontSize: 22, color: C.text, lineHeight: 1.5, marginTop: 16 }}>
            <TypewriterText
              text="Everything around the AI that decides what it sees, what it can do, and what happens next."
              startFrame={40}
              cps={24}
              cursor={false}
            />
          </div>
        </div>
      </div>
    </>
  );
};

const WorkshopMetaphor: React.FC = () => {
  const { phaseFrame, phaseDuration } = usePhase();
  const items = [
    { icon: '🛠️', label: 'the bench' },
    { icon: '🔩', label: 'the jigs' },
    { icon: '💡', label: 'the lighting' },
    { icon: '🌀', label: 'the sawdust extractor' },
  ];
  return (
    <>
      <Starfield />
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 30,
      }}>
        <div style={{ fontFamily: F.inter, fontSize: 28, color: C.text, letterSpacing: 1 }}>
          The model is <span style={{ color: C.claude }}>one power tool</span> on the bench.
        </div>
        <div style={{ display: 'flex', gap: 32, marginTop: 20 }}>
          {items.map((it, i) => {
            const p = interpolate(phaseFrame, [i * 25, i * 25 + 20], [0, 1], {
              extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
            });
            return (
              <div key={i} style={{
                padding: '18px 20px', borderRadius: 10,
                backgroundColor: '#101520', border: `1px solid ${C.cyan}66`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                transform: `scale(${p})`, opacity: p, minWidth: 160,
              }}>
                <SvgForEmoji emoji={it.icon} size={48} color={C.amber} />
                <div style={{ fontFamily: F.mono, fontSize: 14, color: C.cyan }}>{it.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

const PentagonSlots: React.FC = () => {
  const { phaseFrame } = usePhase();
  const { fps } = useVideoConfig();
  const cx = 960, cy = 540, radius = 260;
  return (
    <>
      <Starfield />
      <div style={{
        position: 'absolute', left: cx - 180, top: cy - 40, width: 360,
        textAlign: 'center', zIndex: 1,
      }}>
        <div style={{
          fontFamily: F.inter, fontSize: 26, fontWeight: 700, color: C.amber, letterSpacing: 2,
        }}>
          THE 5 PARTS
        </div>
      </div>
      {SLOTS.map((s, i) => {
        const appear = spring({
          frame: phaseFrame - i * 6, fps, config: { damping: 12, stiffness: 180 },
        });
        const rad = (s.angle * Math.PI) / 180;
        const x = cx + Math.cos(rad) * radius;
        const y = cy + Math.sin(rad) * radius;
        return (
          <div key={i} style={{
            position: 'absolute', left: x - 70, top: y - 50,
            width: 140, padding: '12px 8px', borderRadius: 10,
            backgroundColor: '#101520', border: `1.5px solid ${C.cyan}`,
            boxShadow: `0 0 14px ${C.cyan}55`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            transform: `scale(${appear})`, opacity: appear, zIndex: 1,
          }}>
            <SvgForEmoji emoji={s.icon} size={36} color={C.cyan} />
            <div style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: C.text, letterSpacing: 1 }}>
              {s.label}
            </div>
          </div>
        );
      })}
    </>
  );
};

export const RH04_Definition: React.FC = () => (
  <Scene id="rh04">
    <Phase id="dictionary_card"><DictionaryCard /></Phase>
    <Phase id="workshop_metaphor"><WorkshopMetaphor /></Phase>
    <Phase id="pentagon_slots"><PentagonSlots /></Phase>
  </Scene>
);
