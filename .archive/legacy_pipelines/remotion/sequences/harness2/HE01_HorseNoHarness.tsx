import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { findWordFrame, getSceneDurationFrames } from '../../utils/audioSync';

const C = {
  bg: '#0A1628', amber: '#F59E0B', cyan: '#22D3EE',
  violet: '#A78BFA', green: '#22C55E', red: '#EF4444',
  white: '#E8F4FF', dim: '#6B7A94', card: '#111E34',
};
const INTER = 'Inter, sans-serif';
const MONO = 'JetBrains Mono, monospace';

// Shared background with z-index: -1 so all absolute layers render BEHIND
// in-flow (static) siblings in the same parent stacking context. Without
// this, positioned-auto divs stack above static siblings (a subtle CSS rule)
// and blank the text/content that scenes render after <Bg />.
const Bg: React.FC = () => (
  <>
    <div style={{ position: 'absolute', inset: 0, backgroundColor: C.bg, zIndex: -1 }} />
    <div style={{
      position: 'absolute', inset: 0, opacity: 0.25, zIndex: -1,
      backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)',
      backgroundSize: '36px 36px',
    }} />
    <div style={{
      position: 'absolute', inset: 0, zIndex: -1,
      background: 'radial-gradient(circle at 50% 50%, transparent, rgba(10,22,40,0.95))',
    }} />
  </>
);

// Amber breathing model orb
const ModelOrb: React.FC<{ x: number; y: number; size?: number }> = ({ x, y, size = 160 }) => {
  const frame = useCurrentFrame();
  const breathe = 1 + Math.sin(frame * 0.08) * 0.03;
  return (
    <div style={{
      position: 'absolute', left: x - size / 2, top: y - size / 2,
      width: size, height: size, borderRadius: '50%',
      background: `radial-gradient(circle, ${C.amber}, ${C.amber}00 70%)`,
      boxShadow: `0 0 ${60 + Math.sin(frame * 0.08) * 20}px ${C.amber}88`,
      transform: `scale(${breathe})`,
    }} />
  );
};

// ─── STROKE: energy shot ───
const EnergyStroke: React.FC<{ from: [number, number]; to: [number, number]; startFrame: number; type: 'hit' | 'miss' | 'reverse' }> = ({ from, to, startFrame, type }) => {
  const frame = useCurrentFrame();
  const rel = frame - startFrame;
  if (rel < 0) return null;

  const progress = interpolate(rel, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const reverseP = type === 'reverse' ? interpolate(rel, [30, 50], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : 0;
  const totalP = progress - reverseP;

  const cx = from[0] + (to[0] - from[0]) * totalP;
  const cy = from[1] + (to[1] - from[1]) * totalP;

  const showEnd = progress > 0.9 && type !== 'reverse';

  return (
    <>
      <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} width={1920} height={1080}>
        <line
          x1={from[0]} y1={from[1]} x2={cx} y2={cy}
          stroke={C.amber} strokeWidth={2} opacity={0.6 * Math.max(0, 1 - reverseP)}
          strokeLinecap="round"
        />
      </svg>
      {showEnd && type === 'hit' && (
        <div style={{
          position: 'absolute', left: to[0] - 12, top: to[1] - 12,
          fontSize: 24, color: C.green,
        }}>✓</div>
      )}
      {showEnd && type === 'miss' && (
        <div style={{
          position: 'absolute', left: to[0] - 12, top: to[1] - 12,
          fontSize: 24, color: C.red, transform: `rotateY(${interpolate(progress, [0.9, 1], [90, 0])}deg)`,
        }}>✗</div>
      )}
    </>
  );
};

// ─── PANEL B: Orb flailing with code ───
const OrbFlailing: React.FC<{ offset: number }> = ({ offset }) => {
  const frame = useCurrentFrame();
  const relFrame = frame - offset;
  // Code editor atmospheric
  const editorX = 120;
  const editorY = 300;
  const orbPos: [number, number] = [960, 540];

  // Strokes at different frames
  const strokes = [
    { to: [300, 380] as [number, number], start: 0, type: 'hit' as const },
    { to: [300, 420] as [number, number], start: 40, type: 'miss' as const },
    { to: [300, 460] as [number, number], start: 80, type: 'reverse' as const },
    { to: [300, 500] as [number, number], start: 130, type: 'hit' as const },
    { to: [1600, 400] as [number, number], start: 180, type: 'miss' as const },
  ];

  // Code lines that type in (for 'hit' strokes)
  const codeLines = [
    { y: 380, text: "const handler = async (req) => {", start: 20, success: true },
    { y: 410, text: "  return await process(req.body)", start: 55, success: false },
    { y: 440, text: "function parse(data) {...", start: 95, success: null, reversed: true },
    { y: 470, text: "  if (!data) throw new Error('null')", start: 150, success: true },
  ];

  return (
    <div style={{ width: 1920, height: 1080, position: 'relative' }}>
      <Bg />
      {/* Code editor atmospheric */}
      <div style={{
        position: 'absolute', left: editorX, top: editorY, width: 500, height: 280,
        backgroundColor: C.card, border: `1px solid ${C.dim}`, borderRadius: 8,
        padding: 16, opacity: 0.25,
      }}>
        <div style={{ fontFamily: MONO, fontSize: 11, color: C.dim, marginBottom: 8 }}>handler.ts</div>
        {codeLines.map((ln, i) => {
          const chars = Math.max(0, Math.floor((relFrame - ln.start) * 2));
          const reversed = ln.reversed && relFrame > ln.start + 50 ? Math.max(0, ln.text.length - (relFrame - ln.start - 50) * 2) : chars;
          const display = ln.text.substring(0, Math.min(reversed, ln.text.length));
          return (
            <div key={i} style={{
              fontFamily: MONO, fontSize: 13,
              color: ln.success === true ? C.green : ln.success === false ? C.red : C.amber,
              whiteSpace: 'pre', marginBottom: 4,
            }}>
              {display}
            </div>
          );
        })}
      </div>

      {/* Strokes */}
      {strokes.map((s, i) => (
        <EnergyStroke key={i} from={orbPos} to={s.to} startFrame={s.start} type={s.type} />
      ))}

      {/* Orb */}
      <ModelOrb x={960} y={540} />
    </div>
  );
};

// ─── PANEL C: Text lines with shake ───
const TextLines: React.FC<{ offset: number }> = ({ offset }) => {
  const frame = useCurrentFrame();
  const rel = frame - offset;
  const shake = Math.sin(rel * 2) * 2;

  const lines = [
    { text: 'wrote brilliant code in one file', start: 0 },
    { text: 'broke something in another', start: 60 },
    { text: 'passed every test. failed the first user.', start: 130 },
  ];

  return (
    <div style={{ width: 1920, height: 1080, position: 'relative', transform: `translateX(${shake}px)` }}>
      <Bg />
      <ModelOrb x={960} y={440} />

      <div style={{
        position: 'absolute', bottom: 180, left: 0, right: 0, textAlign: 'center',
      }}>
        {lines.map((ln, i) => {
          const chars = Math.max(0, Math.floor((rel - ln.start) * 2));
          const display = ln.text.substring(0, Math.min(chars, ln.text.length));
          // Dim previous lines
          const nextAppeared = i < lines.length - 1 && rel > lines[i + 1].start;
          const opacity = nextAppeared ? 0.4 : 1;
          const showCursor = chars < ln.text.length;
          return (
            <div key={i} style={{
              fontFamily: MONO, fontSize: 32, color: C.white, opacity,
              marginBottom: 12, letterSpacing: 1,
            }}>
              {display}
              {showCursor && Math.floor(frame / 10) % 2 === 0 ? '▊' : ''}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── PANEL D: Metaphor reveal ───
const MetaphorReveal: React.FC<{ offset: number }> = ({ offset }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rel = frame - offset;
  const horseOpacity = interpolate(rel, [0, 50], [0, 0.35], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const modelLabelSpring = spring({ frame: rel - 80, fps, config: { damping: 14 } });
  const horseLabelSpring = spring({ frame: rel - 140, fps, config: { damping: 14 } });

  return (
    <div style={{ width: 1920, height: 1080, position: 'relative' }}>
      <Bg />
      {/* Horse — system emoji. Filter dropped (crashes Chrome headless on large emoji) */}
      <div style={{
        position: 'absolute', left: 660, top: 280,
        width: 600, height: 500,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 480, lineHeight: 1,
        fontFamily: '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif',
        opacity: horseOpacity,
      }}>
        🐎
      </div>

      <ModelOrb x={960} y={500} />

      {/* MODEL label */}
      <div style={{
        position: 'absolute', top: 620, left: 0, right: 0, textAlign: 'center',
        fontFamily: INTER, fontSize: 32, fontWeight: 900, color: C.amber,
        letterSpacing: 8, transform: `scale(${modelLabelSpring})`, opacity: modelLabelSpring,
      }}>
        MODEL
      </div>

      {/* = A HORSE */}
      <div style={{
        position: 'absolute', top: 680, left: 0, right: 0, textAlign: 'center',
        fontFamily: INTER, fontSize: 26, fontWeight: 700, color: C.white,
        letterSpacing: 4, opacity: horseLabelSpring,
      }}>
        = A HORSE
      </div>
    </div>
  );
};

// ─── PANEL E: First harness line ───
const FirstHarness: React.FC<{ offset: number; totalFrames: number }> = ({ offset, totalFrames }) => {
  const frame = useCurrentFrame();
  const rel = frame - offset;
  // Lasso line drawing
  const drawProgress = interpolate(rel, [0, 30], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const labelOpacity = interpolate(rel, [40, 60], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Loose circle around orb
  const cx = 960, cy = 540, r = 180;
  const perimeter = 2 * Math.PI * r;
  const dashOffset = (1 - drawProgress) * perimeter;

  return (
    <div style={{ width: 1920, height: 1080, position: 'relative' }}>
      <Bg />
      <ModelOrb x={cx} y={cy} />

      {/* Cyan lasso */}
      <svg style={{ position: 'absolute', inset: 0 }} width={1920} height={1080}>
        <circle
          cx={cx} cy={cy} r={r}
          fill="none" stroke={C.cyan} strokeWidth={2.5}
          strokeDasharray={perimeter}
          strokeDashoffset={dashOffset}
          opacity={0.8}
        />
      </svg>

      <div style={{
        position: 'absolute', bottom: 120, left: 0, right: 0, textAlign: 'center',
        fontFamily: INTER, fontSize: 28, fontWeight: 700, color: C.cyan,
        letterSpacing: 1, opacity: labelOpacity,
      }}>
        Somebody had to build the harness.
      </div>
    </div>
  );
};

export const HE01_HorseNoHarness: React.FC = () => {
  const frame = useCurrentFrame();
  const KEY = 'he01';
  const total = getSceneDurationFrames(KEY);

  // Phase transitions from narration
  const flailStart = findWordFrame(KEY, 'brilliant code', 60);
  const linesStart = findWordFrame(KEY, 'wrote brilliant', 250);
  const metaphorStart = findWordFrame(KEY, 'A horse', 700);
  const harnessStart = findWordFrame(KEY, 'build the harness', total - 250);

  if (frame < flailStart) {
    // Just breathing orb
    return (
      <div style={{ width: 1920, height: 1080, position: 'relative' }}>
        <Bg />
        <ModelOrb x={960} y={540} />
      </div>
    );
  }
  if (frame < linesStart) return <OrbFlailing offset={flailStart} />;
  if (frame < metaphorStart) return <TextLines offset={linesStart} />;
  if (frame < harnessStart) return <MetaphorReveal offset={metaphorStart} />;
  return <FirstHarness offset={harnessStart} totalFrames={total - harnessStart} />;
};

export { ModelOrb, Bg };
