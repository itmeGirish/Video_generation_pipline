import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
} from 'remotion';

const MONO = 'JetBrains Mono, monospace';
const c = {
  bg: '#060A12', card: '#0C1220', cyan: '#00F0FF', purple: '#7C5CFC',
  red: '#FF3B5C', mythos: '#CC0000', green: '#00FF88', amber: '#FFB800',
  white: '#E8F4FF', dimWhite: '#4A5568',
};

// ─── SUB A: TIMELINE ───
const Timeline: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const dots = [
    { date: 'MAR 26', label: 'Mythos leaks', color: c.amber, delay: 100 },
    { date: 'APR 7', label: 'Glasswing announced', color: c.mythos, delay: 200 },
    { date: 'APR 16', label: 'Opus 4.7 released', color: c.purple, delay: 300 },
    { date: '???', label: 'Mythos for everyone?', color: c.white, delay: 450, pulsing: true },
  ];

  const timelineWidth = 1000;

  return (
    <div style={{ width: 1920, height: 1080, backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'relative', width: timelineWidth, height: 300 }}>
        {/* Horizontal line that draws itself */}
        {dots.map((dot, i) => {
          if (i === 0) return null;
          const prevX = ((i - 1) / (dots.length - 1)) * timelineWidth;
          const currX = (i / (dots.length - 1)) * timelineWidth;
          const lineProgress = interpolate(
            frame - dots[i - 1].delay,
            [0, dots[i].delay - dots[i - 1].delay],
            [0, 1],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
          );

          return (
            <div key={`line-${i}`} style={{
              position: 'absolute', top: 100, left: prevX,
              width: (currX - prevX) * lineProgress, height: 3,
              backgroundColor: dots[i - 1].color,
              opacity: 0.5,
            }} />
          );
        })}

        {/* Dots */}
        {dots.map((dot, i) => {
          const x = (i / (dots.length - 1)) * timelineWidth;
          const dotScale = spring({ frame: frame - dot.delay, fps, config: { damping: 10 } });

          // Current dot is the most recent one revealed
          const isMostRecent = i === dots.filter((d) => frame >= d.delay).length - 1;
          const pulseSpread = (dot as any).pulsing
            ? 5 + Math.sin(frame * 0.1) * 4
            : isMostRecent
              ? 3 + Math.sin(frame * 0.08) * 3
              : 0;

          return (
            <React.Fragment key={i}>
              {/* Dot */}
              <div style={{
                position: 'absolute', left: x - 10, top: 90,
                width: 20, height: 20, borderRadius: '50%',
                backgroundColor: dot.color,
                transform: `scale(${dotScale})`,
                boxShadow: `0 0 ${pulseSpread}px ${dot.color}`,
              }} />

              {/* Vertical stem */}
              <div style={{
                position: 'absolute', left: x, top: 115,
                width: 2,
                height: interpolate(dotScale, [0, 1], [0, 50]),
                backgroundColor: dot.color,
                opacity: 0.5,
              }} />

              {/* Labels */}
              <div style={{
                position: 'absolute', left: x - 60, top: 175, width: 120,
                textAlign: 'center', opacity: dotScale,
              }}>
                <div style={{ fontFamily: MONO, fontSize: 16, fontWeight: 700, color: dot.color }}>
                  {dot.date}
                </div>
                <div style={{ fontFamily: MONO, fontSize: 13, color: c.white, marginTop: 6 }}>
                  {dot.label}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

// ─── SUB B: FINAL IMAGE ───
const FinalImage: React.FC = () => {
  const frame = useCurrentFrame();

  const zoomScale = interpolate(frame, [0, 90], [1.1, 1.0], { extrapolateRight: 'clamp' });
  const fadeOut = interpolate(frame, [580, 600], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <div style={{
      width: 1920, height: 1080, backgroundColor: '#000',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      opacity: fadeOut,
    }}>
      <div style={{ position: 'relative', transform: `scale(${zoomScale})` }}>
        {/* MYTHOS shadow behind */}
        <div style={{
          position: 'absolute', top: -10, left: -10,
          fontFamily: MONO, fontSize: 80, fontWeight: 800,
          color: c.mythos, opacity: 0.15,
          filter: 'blur(3px)',
          letterSpacing: 6,
        }}>
          MYTHOS
        </div>

        {/* OPUS 4.7 foreground */}
        <div style={{
          fontFamily: MONO, fontSize: 72, fontWeight: 800,
          color: c.purple, letterSpacing: 6,
          position: 'relative', zIndex: 1,
        }}>
          OPUS 4.7
        </div>
      </div>
    </div>
  );
};

// ─── MAIN SCENE 8 ───
export const S08_BiggerQuestion: React.FC = () => (
  <div style={{ width: 1920, height: 1080, backgroundColor: '#000' }}>
    <Sequence from={0} durationInFrames={750}>
      <Timeline />
    </Sequence>
    <Sequence from={750} durationInFrames={600}>
      <FinalImage />
    </Sequence>
  </div>
);
