import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
} from 'remotion';
import { deriveSubSequences } from '../utils/audioSync';

const MONO = 'JetBrains Mono, monospace';
const c = {
  bg: '#060A12', card: '#0C1220', cyan: '#00F0FF', purple: '#7C5CFC',
  red: '#FF3B5C', mythos: '#CC0000', green: '#00FF88', amber: '#FFB800',
  white: '#E8F4FF', dimWhite: '#4A5568', gpt: '#10A37F', gemini: '#4285F4',
};

// ─── SUB A: CONVERGENCE GRAPH ───
const ConvergenceGraph: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const models = [
    { name: 'GPT-5.4', score: 94.4, color: c.gpt },
    { name: 'Gemini 3.1', score: 94.3, color: c.gemini },
    { name: 'Opus 4.7', score: 94.2, color: c.purple },
  ];

  const graphWidth = 600;
  const graphHeight = 200;
  const labelOpacity = spring({ frame: frame - 150, fps, config: { damping: 12 } });

  return (
    <div style={{ width: 1920, height: 1080, backgroundColor: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: MONO, fontSize: 22, color: c.dimWhite, marginBottom: 30, letterSpacing: 2 }}>
        GPQA Diamond — Reasoning
      </div>

      <div style={{ position: 'relative', width: graphWidth, height: graphHeight }}>
        {/* Y-axis markers */}
        {[90, 92, 94, 96].map((val) => (
          <div key={val} style={{
            position: 'absolute', left: -40, top: graphHeight - ((val - 90) / 6) * graphHeight - 6,
            fontFamily: MONO, fontSize: 11, color: c.dimWhite,
          }}>
            {val}%
          </div>
        ))}

        {/* Grid lines */}
        {[90, 92, 94, 96].map((val) => (
          <div key={val} style={{
            position: 'absolute', left: 0, width: '100%',
            top: graphHeight - ((val - 90) / 6) * graphHeight,
            height: 1, backgroundColor: 'rgba(255,255,255,0.05)',
          }} />
        ))}

        {/* Dots */}
        {models.map((model, i) => {
          const dotSpring = spring({ frame: frame - 30 - i * 15, fps, config: { damping: 10 } });
          const x = (i + 0.5) / models.length * graphWidth;
          const y = graphHeight - ((model.score - 90) / 6) * graphHeight;

          return (
            <React.Fragment key={i}>
              <div style={{
                position: 'absolute', left: x - 8, top: y - 8,
                width: 16, height: 16, borderRadius: '50%',
                backgroundColor: model.color,
                boxShadow: `0 0 12px ${model.color}66`,
                transform: `scale(${dotSpring})`,
              }} />
              <div style={{
                position: 'absolute', left: x - 40, top: y + 20,
                fontFamily: MONO, fontSize: 12, color: model.color,
                textAlign: 'center', width: 80, opacity: dotSpring,
              }}>
                {model.name}
                <br />
                <span style={{ color: c.white, fontSize: 14, fontWeight: 700 }}>{model.score}%</span>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      <div style={{
        fontFamily: MONO, fontSize: 24, color: c.white, marginTop: 60,
        opacity: labelOpacity, letterSpacing: 2, textAlign: 'center',
      }}>
        REASONING IS SOLVED. THE NEW RACE IS EXECUTION.
      </div>
    </div>
  );
};

// ─── SUB B: PODIUM ───
const Podium: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bars = [
    {
      name: 'GEMINI 3.1 PRO', height: 240, color: c.gemini, opacity: 0.7,
      topLabel: '80.6% SWE-bench', bottomLabel: 'BEST VALUE — $2/MTok',
      delay: 0,
    },
    {
      name: 'GPT-5.4', height: 260, color: c.gpt, opacity: 0.8,
      topLabel: '~80% SWE-bench', bottomLabel: 'BEST GENERALIST',
      delay: 15,
    },
    {
      name: 'OPUS 4.7', height: 320, color: c.purple, opacity: 1,
      topLabel: '87.6% SWE-bench', bottomLabel: 'BEST AVAILABLE ✓', bottomColor: c.green,
      delay: 30,
    },
    {
      name: 'MYTHOS', height: 380, color: c.mythos, opacity: 0.8,
      topLabel: '93.9% SWE-bench', bottomLabel: 'NOT AVAILABLE', bottomColor: c.mythos,
      delay: 45, locked: true,
    },
  ];

  return (
    <div style={{ width: 1920, height: 1080, backgroundColor: '#000', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 120, gap: 40 }}>
      {bars.map((bar, i) => {
        const grow = spring({ frame: frame - bar.delay, fps, config: { damping: 14, stiffness: 60 } });
        const barHeight = interpolate(grow, [0, 1], [0, bar.height]);

        // Glass overlay for Mythos
        const glassSlide = bar.locked ? spring({ frame: frame - bar.delay - 40, fps, config: { damping: 20 } }) : 0;
        const lockScale = bar.locked ? spring({ frame: frame - bar.delay - 60, fps, config: { damping: 10 } }) : 0;

        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Top label */}
            <div style={{
              fontFamily: MONO, fontSize: 13, color: bar.color, marginBottom: 10,
              opacity: grow, whiteSpace: 'nowrap',
            }}>
              {bar.topLabel}
            </div>

            {/* Bar */}
            <div style={{
              width: 100, height: barHeight, borderRadius: '12px 12px 4px 4px',
              position: 'relative', overflow: 'hidden',
              opacity: bar.opacity,
              background: bar.locked
                ? `repeating-linear-gradient(45deg, ${bar.color}, ${bar.color} 4px, ${bar.color}88 4px, ${bar.color}88 8px)`
                : bar.color,
              boxShadow: bar.name === 'OPUS 4.7'
                ? `0 0 30px ${bar.color}44`
                : bar.locked
                  ? `0 0 ${10 + Math.sin(frame * 0.1) * 5}px ${bar.color}44`
                  : 'none',
            }}>
              {/* Glass overlay for Mythos */}
              {bar.locked && (
                <div style={{
                  position: 'absolute', inset: 0,
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  transform: `translateY(${interpolate(glassSlide, [0, 1], [-100, 0])}%)`,
                }} />
              )}
              {/* Lock icon */}
              {bar.locked && (
                <div style={{
                  position: 'absolute', top: '50%', left: '50%',
                  transform: `translate(-50%, -50%) scale(${lockScale})`,
                  fontSize: 32,
                }}>
                  🔒
                </div>
              )}
            </div>

            {/* Name */}
            <div style={{
              fontFamily: MONO, fontSize: 14, fontWeight: 700, color: bar.color,
              marginTop: 12, opacity: grow,
            }}>
              {bar.name}
            </div>

            {/* Bottom label */}
            <div style={{
              fontFamily: MONO, fontSize: 11,
              color: (bar as any).bottomColor || c.dimWhite,
              backgroundColor: (bar as any).bottomColor ? `${(bar as any).bottomColor}22` : 'transparent',
              padding: '3px 10px', borderRadius: 4, marginTop: 6,
              opacity: grow,
            }}>
              {bar.bottomLabel}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const S07_MARKERS = [
  { name: 'convergence', phrase: "Let's zoom out" },
  { name: 'podium',      phrase: 'new race' },
];

const S07_COMPONENTS: Record<string, React.FC> = {
  convergence: ConvergenceGraph, podium: Podium,
};

export const S07_CompetitiveLandscape: React.FC = () => {
  const subs = deriveSubSequences('s07', S07_MARKERS);
  return (
    <div style={{ width: 1920, height: 1080, backgroundColor: '#000' }}>
      {subs.map((s) => {
        const Comp = S07_COMPONENTS[s.name];
        return (
          <Sequence key={s.name} from={s.from} durationInFrames={s.duration}>
            <Comp />
          </Sequence>
        );
      })}
    </div>
  );
};
