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
  <div style={{ position: 'absolute', inset: 0, backgroundColor: C.bg }} />
);

// ─── PHASE A: Two-line reveal ───
const TwoLineOpener: React.FC<{ relFrame: number }> = ({ relFrame }) => {
  const line1Chars = Math.min(Math.floor(relFrame * 1.2), 43);
  const line2Appear = relFrame - 100;
  const line2Chars = Math.max(0, Math.min(Math.floor(line2Appear * 1.2), 46));

  return (
    <div style={{
      width: 1920, height: 1080, position: 'relative',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    }}>
      <Background />
      <div style={{
        fontFamily: SANS, fontSize: 52, fontWeight: 700, color: C.white,
        whiteSpace: 'pre', textAlign: 'center', letterSpacing: 1,
      }}>
        {'Everyone talks about AI that writes code.'.substring(0, line1Chars)}
      </div>
      {line2Appear > 0 && (
        <div style={{
          fontFamily: SANS, fontSize: 52, fontWeight: 800, color: C.violet,
          marginTop: 40, whiteSpace: 'pre', textAlign: 'center', letterSpacing: 1,
          textShadow: `0 0 30px ${C.violet}66`,
        }}>
          {'Almost nobody talks about AI that ships it.'.substring(0, line2Chars)}
        </div>
      )}
    </div>
  );
};

// ─── PHASE B: Bottleneck diagram ───
const BottleneckDiagram: React.FC<{ relFrame: number }> = ({ relFrame }) => {
  const { fps } = useVideoConfig();
  const boxes = ['IDEA', 'CODE', 'SHIP', 'USERS'];
  // Boxes spring in staggered
  const boxSprings = boxes.map((_, i) => spring({ frame: relFrame - i * 10, fps, config: { damping: 14 } }));
  // Arrow between CODE and SHIP pulses
  const pulse = interpolate(Math.sin(relFrame * 0.15), [-1, 1], [0.4, 1]);

  return (
    <div style={{ width: 1920, height: 1080, position: 'relative' }}>
      <Background />

      {/* Header (compressed from prior phase) */}
      <div style={{
        position: 'absolute', top: 120, left: 0, right: 0, textAlign: 'center',
        fontFamily: SANS, fontSize: 24, color: C.white, opacity: 0.6, lineHeight: 1.5,
      }}>
        Everyone talks about AI that writes code.<br />
        <span style={{ color: C.violet }}>Almost nobody talks about AI that ships it.</span>
      </div>

      {/* Diagram */}
      <div style={{
        position: 'absolute', top: '50%', left: 0, right: 0,
        transform: 'translateY(-50%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 30,
      }}>
        {boxes.map((name, i) => {
          const highlight = (name === 'CODE' || name === 'SHIP');
          return (
            <React.Fragment key={i}>
              <div style={{
                width: 180, height: 100, borderRadius: 12,
                backgroundColor: C.card,
                border: `2px solid ${highlight && name === 'SHIP' ? C.violet : C.blue}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: SANS, fontSize: 22, fontWeight: 800, color: C.white, letterSpacing: 2,
                transform: `scale(${boxSprings[i]})`, opacity: boxSprings[i],
                boxShadow: name === 'SHIP' ? `0 0 30px ${C.violet}66` : 'none',
              }}>
                {name}
              </div>
              {i < boxes.length - 1 && (
                <div style={{
                  fontFamily: SANS, fontSize: 40,
                  color: i === 1 ? C.violet : C.dim,
                  opacity: boxSprings[i + 1],
                  textShadow: i === 1 ? `0 0 20px ${C.violet}88 ` : 'none',
                  transform: i === 1 ? `scale(${pulse * 0.3 + 0.9})` : 'scale(1)',
                }}>
                  →
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Bottleneck label */}
      {relFrame > 60 && (
        <div style={{
          position: 'absolute', top: 650, left: 0, right: 0, textAlign: 'center',
          opacity: interpolate(relFrame - 60, [0, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
        }}>
          <div style={{
            fontFamily: SANS, fontSize: 22, fontWeight: 700, color: C.violet, letterSpacing: 1,
            opacity: pulse,
          }}>
            ↑ the real bottleneck
          </div>
        </div>
      )}
    </div>
  );
};

// ─── PHASE C: Founder card + timeline ───
const FounderTimeline: React.FC<{ relFrame: number }> = ({ relFrame }) => {
  const { fps } = useVideoConfig();
  const cardIn = spring({ frame: relFrame, fps, config: { damping: 14 } });

  const events = [
    { year: '2014', label: 'Harness founded',    delay: 30 },
    { year: '2020', label: 'Drone acquisition',  delay: 60 },
    { year: '2023', label: 'Harness AI',         delay: 90 },
    { year: 'today', label: '',                  delay: 120 },
  ];

  return (
    <div style={{ width: 1920, height: 1080, position: 'relative' }}>
      <Background />

      {/* Founder card (left) */}
      <div style={{
        position: 'absolute', left: 200, top: '50%', transform: `translateY(-50%) scale(${cardIn})`,
        opacity: cardIn,
        width: 360, padding: 30, borderRadius: 20,
        backgroundColor: C.card, border: `1px solid ${C.violet}66`,
        textAlign: 'center',
      }}>
        <div style={{
          width: 120, height: 120, borderRadius: '50%', margin: '0 auto 20px',
          background: `radial-gradient(circle, ${C.violet}, ${C.blue})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 64,
        }}>
          👤
        </div>
        <div style={{ fontFamily: SANS, fontSize: 22, fontWeight: 800, color: C.white }}>Jyoti Bansal</div>
        <div style={{ fontFamily: SANS, fontSize: 14, color: C.violet, marginTop: 4 }}>Founder, Harness</div>
        <div style={{ fontFamily: MONO, fontSize: 11, color: C.dim, marginTop: 12 }}>
          "saw this bottleneck a decade ago"
        </div>
      </div>

      {/* Timeline (right) */}
      <div style={{
        position: 'absolute', right: 100, top: '50%', transform: 'translateY(-50%)',
        width: 900, height: 300,
      }}>
        {/* Timeline bar */}
        <div style={{
          position: 'absolute', top: 140, left: 0, width: '100%', height: 2,
          backgroundColor: C.dim,
        }} />
        {/* Dotted extension */}
        <div style={{
          position: 'absolute', top: 140, left: '75%', width: '30%', height: 2,
          background: `repeating-linear-gradient(to right, ${C.violet}, ${C.violet} 8px, transparent 8px, transparent 16px)`,
        }} />

        {events.map((ev, i) => {
          const p = spring({ frame: relFrame - ev.delay, fps, config: { damping: 12 } });
          const x = (i / (events.length - 1)) * 800;
          return (
            <React.Fragment key={i}>
              <div style={{
                position: 'absolute', top: 130, left: x - 10,
                width: 20, height: 20, borderRadius: '50%',
                backgroundColor: ev.year === 'today' ? C.violet : C.blue,
                transform: `scale(${p})`, opacity: p,
                boxShadow: `0 0 15px ${ev.year === 'today' ? C.violet : C.blue}`,
              }} />
              <div style={{
                position: 'absolute', top: 100, left: x - 60, width: 120, textAlign: 'center',
                fontFamily: SANS, fontSize: 16, fontWeight: 800, color: C.blue,
                opacity: p,
              }}>
                {ev.year}
              </div>
              <div style={{
                position: 'absolute', top: 170, left: x - 80, width: 160, textAlign: 'center',
                fontFamily: MONO, fontSize: 12, color: C.white, opacity: p,
              }}>
                {ev.label}
              </div>
            </React.Fragment>
          );
        })}

        {/* "what's next" label */}
        {relFrame > 150 && (
          <div style={{
            position: 'absolute', top: 150, right: 0,
            fontFamily: MONO, fontSize: 13, color: C.violet,
            opacity: interpolate(relFrame - 150, [0, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
          }}>
            what's next →
          </div>
        )}
      </div>
    </div>
  );
};

// ─── PHASE D: Everything reassembles ───
const Reassembly: React.FC<{ relFrame: number }> = ({ relFrame }) => {
  const { fps } = useVideoConfig();
  // Orbital cluster of mini icons
  const rotation = relFrame * 0.02;
  const coreScale = interpolate(relFrame, [0, 40], [0.5, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const pulse = 1 + Math.sin(relFrame * 0.1) * 0.03;

  const satellites = [
    { icon: '🔧', angle: 0 },
    { icon: '⚙️', angle: Math.PI / 4 },
    { icon: '🛡️', angle: Math.PI / 2 },
    { icon: '✨', angle: (3 * Math.PI) / 4 },
    { icon: '📊', angle: Math.PI },
    { icon: '🚀', angle: (5 * Math.PI) / 4 },
    { icon: '🧪', angle: (3 * Math.PI) / 2 },
    { icon: '💰', angle: (7 * Math.PI) / 4 },
  ];

  return (
    <div style={{ width: 1920, height: 1080, position: 'relative' }}>
      <Background />
      <div style={{
        position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
      }}>
        {/* Satellites */}
        {satellites.map((s, i) => {
          const p = spring({ frame: relFrame - i * 6, fps, config: { damping: 12 } });
          const angle = s.angle + rotation;
          const r = 250;
          return (
            <div key={i} style={{
              position: 'absolute',
              left: Math.cos(angle) * r - 25, top: Math.sin(angle) * r - 25,
              width: 50, height: 50, borderRadius: 12,
              backgroundColor: C.card, border: `1px solid ${C.blue}66`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26, transform: `scale(${p})`, opacity: p,
            }}>
              {s.icon}
            </div>
          );
        })}
        {/* Core */}
        <div style={{
          width: 260, height: 260, borderRadius: '50%',
          background: `radial-gradient(circle, ${C.violet}aa, ${C.blue}44)`,
          boxShadow: `0 0 80px ${C.violet}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transform: `translate(-50%, -50%) scale(${coreScale * pulse})`,
          position: 'absolute', left: 0, top: 0,
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: SANS, fontSize: 18, fontWeight: 900, color: C.white, letterSpacing: 2 }}>AI-NATIVE</div>
            <div style={{ fontFamily: SANS, fontSize: 18, fontWeight: 900, color: C.white, letterSpacing: 2 }}>ENGINEERING</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── PHASE E: Final title card ───
const FinalTitle: React.FC<{ relFrame: number; totalInPhase: number }> = ({ relFrame, totalInPhase }) => {
  const { fps } = useVideoConfig();
  const titleSpring = spring({ frame: relFrame, fps, config: { damping: 14 } });
  const taglineChars = Math.max(0, Math.floor((relFrame - 40) * 1.2));
  const tagline = 'The pipeline is now a thinking system.';
  const fadeOut = interpolate(relFrame, [totalInPhase - 20, totalInPhase], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <div style={{
      width: 1920, height: 1080, position: 'relative',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      opacity: fadeOut,
    }}>
      <Background />
      <div style={{
        fontFamily: SANS, fontSize: 72, fontWeight: 900, color: C.white,
        textAlign: 'center', letterSpacing: -1, lineHeight: 1.1,
        transform: `scale(${interpolate(titleSpring, [0, 1], [0.85, 1])})`,
        opacity: titleSpring,
      }}>
        The Rise of <span style={{ color: C.blue }}>Harness Engineering</span><br />in AI
      </div>
      <div style={{
        fontFamily: MONO, fontSize: 22, color: C.violet, marginTop: 50,
        letterSpacing: 2, whiteSpace: 'pre',
      }}>
        {tagline.substring(0, Math.min(taglineChars, tagline.length))}
      </div>
    </div>
  );
};

export const H07_WhyMatters: React.FC = () => {
  const frame = useCurrentFrame();
  const KEY = 'h07';
  const total = getSceneDurationFrames(KEY);

  const phaseAStart = 0;
  const phaseBStart = findWordFrame(KEY, 'becomes real', 400);
  const phaseCStart = findWordFrame(KEY, 'Jyoti Bansal', 800);
  const phaseDStart = findWordFrame(KEY, 'not a product', 1350);
  const phaseEStart = findWordFrame(KEY, 'pipeline is no longer', total - 250);

  if (frame < phaseBStart) return <TwoLineOpener relFrame={frame} />;
  if (frame < phaseCStart) return <BottleneckDiagram relFrame={frame - phaseBStart} />;
  if (frame < phaseDStart) return <FounderTimeline relFrame={frame - phaseCStart} />;
  if (frame < phaseEStart) return <Reassembly relFrame={frame - phaseDStart} />;
  return <FinalTitle relFrame={frame - phaseEStart} totalInPhase={total - phaseEStart} />;
};
