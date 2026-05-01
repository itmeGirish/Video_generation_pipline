import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
} from 'remotion';
import { deriveSubSequences, getSceneDurationFrames } from '../utils/audioSync';

const MONO = 'JetBrains Mono, monospace';
const c = {
  bg: '#060A12', card: '#0C1220', cyan: '#00F0FF', purple: '#7C5CFC',
  red: '#FF3B5C', mythos: '#CC0000', green: '#00FF88', amber: '#FFB800',
  white: '#E8F4FF', dimWhite: '#4A5568', gpt: '#10A37F', gemini: '#4285F4',
  glasswing: '#00CCAA',
};

const GLITCH_CHARS = '&#%@$!?*~^+=<>';

/*
 * S02 audio = 2484 frames (82.8s). Scale = 1.183x from original 2100.
 *
 * VO breakdown by word-count proportion (200 words total):
 *   "That AI...not mine" (43 words, 21.5%) → Mythos Reveal = 534 frames
 *   "In the past few weeks...keyboard" (60 words, 30%) → Zero-Day Counter = 745 frames
 *   "It escaped...usage credits" (55 words, 27.5%) → Timeline + Glasswing = 683 frames
 *   "But yesterday...can't" (42 words, 21%) → Opus 4.7 Entrance = 522 frames
 */

const MythosReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const text = 'MYTHOS';
  const subtitleOpacity = interpolate(frame - 200, [0, 30], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <div style={{ width: 1920, height: 1080, backgroundColor: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', gap: 0 }}>
        {text.split('').map((char, i) => {
          const charDelay = (i / text.length) * 60;
          const progress = spring({ frame: frame - charDelay, fps, config: { damping: 12, stiffness: 100 } });
          const isAssembled = progress > 0.95;
          const offsetX = interpolate(progress, [0, 1], [(i - 3) * 120, 0]);
          const offsetY = interpolate(progress, [0, 1], [Math.sin(i * 2.5) * 150, 0]);
          const rot = interpolate(progress, [0, 1], [(i % 2 === 0 ? 1 : -1) * 180, 0]);
          const glitchIdx = Math.floor(frame * 0.5 + i * 3) % GLITCH_CHARS.length;
          return (
            <span key={i} style={{
              fontFamily: MONO, fontSize: 120, fontWeight: 800, letterSpacing: 20,
              color: isAssembled ? c.mythos : '#444',
              transform: `translate(${offsetX}px, ${offsetY}px) rotate(${rot}deg)`,
              textShadow: isAssembled ? '0 0 30px #CC0000, 0 0 60px #CC000044' : 'none',
              display: 'inline-block',
            }}>
              {isAssembled ? char : GLITCH_CHARS[glitchIdx]}
            </span>
          );
        })}
      </div>
      <div style={{ fontFamily: MONO, fontSize: 20, color: c.dimWhite, marginTop: 30, opacity: subtitleOpacity, letterSpacing: 4 }}>
        THE MOST POWERFUL AI MODEL EVER BUILT
      </div>
    </div>
  );
};

const ZeroDayCounter: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const countVal = interpolate(frame, [0, 90], [0, 9999], { extrapolateRight: 'clamp' });
  const showWord = frame > 90;
  const badge1X = spring({ frame: frame - 120, fps, config: { damping: 12 } });
  const badge2X = spring({ frame: frame - 140, fps, config: { damping: 12 } });

  return (
    <div style={{ width: 1920, height: 1080, backgroundColor: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: MONO, fontSize: 100, fontWeight: 800, color: showWord ? c.mythos : c.white, letterSpacing: 4 }}>
        {showWord ? 'THOUSANDS' : Math.floor(countVal).toLocaleString()}
      </div>
      <div style={{ display: 'flex', gap: 24, marginTop: 40 }}>
        <div style={{
          backgroundColor: c.mythos, color: '#fff', padding: '12px 28px', borderRadius: 8,
          fontFamily: MONO, fontSize: 18, fontWeight: 700,
          transform: `translateX(${interpolate(badge1X, [0, 1], [-200, 0])}px)`, opacity: badge1X,
        }}>EVERY MAJOR OS</div>
        <div style={{
          backgroundColor: c.mythos, color: '#fff', padding: '12px 28px', borderRadius: 8,
          fontFamily: MONO, fontSize: 18, fontWeight: 700,
          transform: `translateX(${interpolate(badge2X, [0, 1], [200, 0])}px)`, opacity: badge2X,
        }}>EVERY MAJOR BROWSER</div>
      </div>
    </div>
  );
};

const TimelineBugs: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bugs = [
    { year: 1999, label: 'OpenBSD bug (27 years hidden)', delay: 0 },
    { year: 2009, label: 'FreeBSD bug (17 years hidden)', delay: 30 },
    { year: 2010, label: 'FFmpeg bug (16 years hidden)', delay: 60 },
  ];
  const timelineWidth = 1200;
  const minYear = 1999; const maxYear = 2026;
  const getX = (year: number) => ((year - minYear) / (maxYear - minYear)) * timelineWidth;
  const footerOpacity = interpolate(frame - 200, [0, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <div style={{ width: 1920, height: 1080, backgroundColor: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'relative', width: timelineWidth, height: 300 }}>
        <div style={{ position: 'absolute', top: 80, left: 0, width: '100%', height: 3, backgroundColor: c.dimWhite }} />
        <div style={{ position: 'absolute', top: 90, left: 0, fontFamily: MONO, fontSize: 14, color: c.dimWhite }}>1999</div>
        <div style={{ position: 'absolute', top: 90, right: 0, fontFamily: MONO, fontSize: 14, color: c.dimWhite }}>2026</div>
        {bugs.map((bug, i) => {
          const dotScale = spring({ frame: frame - bug.delay, fps, config: { damping: 10, stiffness: 120 } });
          const stemHeight = spring({ frame: frame - bug.delay - 10, fps, config: { damping: 14 } });
          const x = getX(bug.year);
          return (
            <React.Fragment key={i}>
              <div style={{ position: 'absolute', top: 72, left: x - 8, width: 16, height: 16, borderRadius: '50%', backgroundColor: c.mythos, transform: `scale(${dotScale})`, boxShadow: '0 0 12px #CC0000' }} />
              <div style={{ position: 'absolute', top: 96, left: x, width: 2, height: interpolate(stemHeight, [0, 1], [0, 60]), backgroundColor: c.mythos }} />
              <div style={{ position: 'absolute', top: 165, left: x - 80, width: 160, textAlign: 'center', fontFamily: MONO, fontSize: 13, color: c.white, opacity: stemHeight }}>
                <div style={{ color: c.mythos, fontWeight: 700, marginBottom: 4 }}>{bug.year}</div>{bug.label}
              </div>
            </React.Fragment>
          );
        })}
      </div>
      <div style={{ fontFamily: MONO, fontSize: 24, color: c.white, marginTop: 20, opacity: footerOpacity, letterSpacing: 2 }}>
        Hidden for decades. Found in hours.
      </div>
    </div>
  );
};

const ORGS = ['AAPL', 'GOOG', 'MSFT', 'AMZN', 'CSCO', 'CRWD', 'NVDA', 'JPM', 'PANW', 'AVGO', 'LINUX'];

const GlasswingOrbit: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const radius = 280;
  const rotationAngle = (frame / 300) * Math.PI * 2;

  return (
    <div style={{ width: 1920, height: 1080, backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'relative', width: 700, height: 700 }}>
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 100, height: 100, borderRadius: '50%', border: `2px solid ${c.glasswing}`,
          boxShadow: `0 0 20px ${c.glasswing}44`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: c.glasswing, letterSpacing: 1 }}>GLASSWING</div>
          <div style={{ fontFamily: MONO, fontSize: 10, color: c.glasswing, marginTop: 2 }}>$100M</div>
        </div>
        {ORGS.map((org, i) => {
          const nodeAppear = spring({ frame: frame - 20 - i * 8, fps, config: { damping: 12, stiffness: 80 } });
          const angle = rotationAngle + (i / ORGS.length) * Math.PI * 2;
          const cx = 350 + Math.cos(angle) * radius;
          const cy = 350 + Math.sin(angle) * radius;
          return (
            <div key={i} style={{
              position: 'absolute', left: cx - 30, top: cy - 18, width: 60, height: 36, borderRadius: 18,
              backgroundColor: c.card, border: `1px solid ${c.glasswing}44`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: MONO, fontSize: 10, fontWeight: 700, color: c.glasswing,
              transform: `scale(${nodeAppear}) rotate(${-(angle * 180 / Math.PI)}deg)`, opacity: nodeAppear,
            }}>{org}</div>
          );
        })}
      </div>
    </div>
  );
};

const Opus47Entrance: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const wipeProgress = interpolate(frame, [0, 40], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const titleText = 'CLAUDE OPUS 4.7';
  const titleChars = Math.min(Math.floor((frame - 50) * 3), titleText.length);
  const titleDisplay = frame > 50 ? titleText.substring(0, Math.max(0, titleChars)) : '';
  const subtitleOpacity = spring({ frame: frame - 120, fps, config: { damping: 12 } });
  const bars = [
    { name: 'GEMINI 3.1', score: 55, color: c.gemini, delay: 200, icon: '' },
    { name: 'GPT-5.4', score: 65, color: c.gpt, delay: 210, icon: '' },
    { name: 'OPUS 4.7', score: 80, color: c.purple, delay: 220, icon: 'AVAILABLE ✓', iconColor: c.green },
    { name: 'MYTHOS', score: 95, color: c.mythos, delay: 230, icon: '🔒', striped: true },
  ];

  return (
    <div style={{ width: 1920, height: 1080, backgroundColor: '#000', display: 'flex', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundColor: c.mythos, opacity: 0.15, transform: `translateX(${interpolate(wipeProgress, [0, 1], [0, -100])}%)` }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: MONO, fontSize: 100, fontWeight: 800, color: c.purple, letterSpacing: 4, whiteSpace: 'pre' }}>{titleDisplay}</div>
        <div style={{ fontFamily: MONO, fontSize: 22, color: c.white, marginTop: 20, opacity: subtitleOpacity }}>The most powerful model you can actually use.</div>
      </div>
      <div style={{ position: 'absolute', right: 80, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'flex-end', gap: 20, height: 500 }}>
        {bars.map((bar, i) => {
          const barGrow = spring({ frame: frame - bar.delay, fps, config: { damping: 14, stiffness: 60 } });
          const barHeight = interpolate(barGrow, [0, 1], [0, bar.score * 4.5]);
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
              <div style={{ fontFamily: MONO, fontSize: 11, color: bar.color, marginBottom: 8, opacity: barGrow, whiteSpace: 'nowrap' }}>{bar.name}</div>
              <div style={{
                width: 60, height: barHeight, borderRadius: 8, opacity: (bar as any).striped ? 0.8 : 1,
                background: (bar as any).striped ? `repeating-linear-gradient(45deg, ${bar.color}, ${bar.color} 4px, ${bar.color}88 4px, ${bar.color}88 8px)` : bar.color,
                boxShadow: bar.name === 'OPUS 4.7' ? `0 0 20px ${bar.color}66` : 'none',
              }} />
              {bar.icon && <div style={{ fontFamily: MONO, fontSize: 9, marginTop: 6, color: bar.iconColor || bar.color, opacity: barGrow, backgroundColor: bar.iconColor ? `${bar.iconColor}22` : 'transparent', padding: '3px 8px', borderRadius: 4 }}>{bar.icon}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Sub-sequences auto-derived from when the narrator speaks each topic.
const S02_MARKERS = [
  { name: 'mythos',    phrase: 'That AI was built' },
  { name: 'zeroday',   phrase: 'thousands of zero-day' },
  { name: 'timeline',  phrase: 'twenty-seven' },
  { name: 'glasswing', phrase: 'Anthropic did something' },
  { name: 'opus',      phrase: 'But yesterday' },
];

const SUB_COMPONENTS: Record<string, React.FC> = {
  mythos: MythosReveal, zeroday: ZeroDayCounter, timeline: TimelineBugs,
  glasswing: GlasswingOrbit, opus: Opus47Entrance,
};

export const S02_DoubleReveal: React.FC = () => {
  const subs = deriveSubSequences('s02', S02_MARKERS);
  return (
    <div style={{ width: 1920, height: 1080, backgroundColor: '#000' }}>
      {subs.map((s) => {
        const Comp = SUB_COMPONENTS[s.name];
        return (
          <Sequence key={s.name} from={s.from} durationInFrames={s.duration}>
            <Comp />
          </Sequence>
        );
      })}
    </div>
  );
};
