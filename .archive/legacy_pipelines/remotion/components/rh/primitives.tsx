import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { SvgForEmoji } from './svgIcons';

// Neon Terminal design tokens
export const C = {
  bg: '#0A0A0F',
  text: '#E8E8F0',
  cyan: '#00E5FF',
  magenta: '#FF2E88',
  amber: '#FFB300',
  green: '#00E676',
  red: '#FF3D3D',
  claude: '#D97757',
  dim: '#4A4A5A',
};

export const F = {
  mono: "'JetBrains Mono', monospace",
  inter: "'Inter', sans-serif",
};

// Starfield background — 40 drifting dots, zIndex: -1 to stay behind content
export const Starfield: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      <div style={{ position: 'absolute', inset: 0, backgroundColor: C.bg, zIndex: -1 }} />
      <div style={{ position: 'absolute', inset: 0, zIndex: -1, pointerEvents: 'none' }}>
        {Array.from({ length: 30 }).map((_, i) => {
          const sx = (i * 73) % 1920;
          const sy = (i * 137) % 1080;
          const x = (sx - frame * 0.2) % 1920;
          const y = sy;
          return (
            <div key={i} style={{
              position: 'absolute', left: x < 0 ? x + 1920 : x, top: y,
              width: 2, height: 2, borderRadius: '50%',
              backgroundColor: '#FFFFFF',
              opacity: 0.15 + (i % 5) * 0.05,
            }} />
          );
        })}
      </div>
    </>
  );
};

// The breathing amber-orange Claude orb — 2s loop, opacity 0.85..1.0
export const ClaudeOrb: React.FC<{ x: number; y: number; size?: number; opacity?: number }> = ({
  x, y, size = 120, opacity = 1,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const breathe = 0.85 + 0.15 * (0.5 + 0.5 * Math.sin((frame / (2 * fps)) * Math.PI * 2));
  return (
    <div style={{
      position: 'absolute',
      left: x - size / 2,
      top: y - size / 2,
      width: size, height: size, borderRadius: '50%',
      background: `radial-gradient(circle, ${C.claude}, ${C.claude}44 60%, transparent 80%)`,
      boxShadow: `0 0 ${40 * breathe}px ${C.claude}aa`,
      opacity: opacity * breathe,
    }} />
  );
};

// Typewriter: types text char-by-char from startFrame (1.3 frames/char ≈ 45ms)
export const TypewriterText: React.FC<{
  text: string;
  startFrame: number;
  style?: React.CSSProperties;
  cps?: number;
  cursor?: boolean;
}> = ({ text, startFrame, style, cps = 23, cursor = true }) => {
  const frame = useCurrentFrame();
  const elapsed = frame - startFrame;
  const charsShown = Math.min(Math.max(0, Math.floor(elapsed * cps / 30)), text.length);
  const blink = Math.floor(frame / 15) % 2 === 0;
  const displayText = text.substring(0, charsShown);
  const showCursor = cursor && charsShown <= text.length && blink;
  return (
    <span style={{ position: 'relative', zIndex: 1, ...style }}>
      {displayText}
      {showCursor && <span style={{ color: C.cyan }}>▊</span>}
    </span>
  );
};

// Magenta impact slam text — slides up from bottom with spring overshoot
export const ImpactText: React.FC<{
  text: string;
  startFrame: number;
  color?: string;
  fontSize?: number;
}> = ({ text, startFrame, color = C.magenta, fontSize = 88 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 12, stiffness: 180 },
  });
  const y = interpolate(p, [0, 1], [80, 0]);
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 2,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      pointerEvents: 'none',
    }}>
      <div style={{
        fontFamily: F.inter, fontSize, fontWeight: 900, color,
        letterSpacing: 1, transform: `translateY(${y}px)`, opacity: p,
        textShadow: `0 0 30px ${color}aa`,
      }}>
        {text}
      </div>
    </div>
  );
};

// Red X stamp — appears with spring scale + slight rotation
export const StampX: React.FC<{ x: number; y: number; startFrame: number; size?: number }> = ({
  x, y, startFrame, size = 100,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - startFrame, fps, config: { damping: 8, stiffness: 220 } });
  return (
    <div style={{
      position: 'absolute', left: x - size / 2, top: y - size / 2,
      width: size, height: size, zIndex: 3,
      fontFamily: F.inter, fontSize: size, fontWeight: 900, color: C.red,
      transform: `scale(${p}) rotate(${-15}deg)`, opacity: p,
      textShadow: `0 0 20px ${C.red}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      ✗
    </div>
  );
};

// Six tools ring — orbiting around a center point
export const TOOLS_6 = [
  { icon: '🗄️', label: 'database' },
  { icon: '🌐', label: 'browser' },
  { icon: '🧮', label: 'calculator' },
  { icon: '📁', label: 'file' },
  { icon: '🧠', label: 'memory' },
  { icon: '⏰', label: 'clock' },
];

export const TOOLS_6_LABELED = [
  { icon: '🌐', label: 'web_search' },
  { icon: '📅', label: 'calendar' },
  { icon: '🧮', label: 'calculator' },
  { icon: '📖', label: 'file_read' },
  { icon: '🧠', label: 'memory' },
  { icon: '⏰', label: 'clock' },
];

export const ToolRing: React.FC<{
  cx: number; cy: number; r?: number;
  startFrame: number;
  tools?: { icon: string; label: string }[];
  showLabels?: boolean;
  rotate?: boolean;
}> = ({ cx, cy, r = 230, startFrame, tools = TOOLS_6, showLabels = false, rotate = true }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rotAngle = rotate ? ((frame - startFrame) / 300) * Math.PI * 2 : 0;

  return (
    <>
      {tools.map((t, i) => {
        const appear = spring({
          frame: frame - startFrame - i * 5,
          fps, config: { damping: 12, stiffness: 180 },
        });
        if (frame < startFrame + i * 5) return null;
        const baseAngle = (i / tools.length) * Math.PI * 2 - Math.PI / 2;
        const angle = baseAngle + rotAngle;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        return (
          <div key={i} style={{
            position: 'absolute', left: x - 40, top: y - 40,
            width: 80, height: 80, borderRadius: 12,
            backgroundColor: '#151520',
            border: `1.5px solid ${C.cyan}`,
            boxShadow: `0 0 12px ${C.cyan}66`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transform: `scale(${appear})`, opacity: appear, zIndex: 1,
          }}>
            <SvgForEmoji emoji={t.icon} size={44} color={C.cyan} />
            {showLabels && (
              <div style={{
                position: 'absolute', top: 84, left: -20, width: 120,
                textAlign: 'center', fontFamily: F.mono, fontSize: 12, color: C.cyan,
              }}>
                {t.label}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
};

// Simple fade wrapper
export const Fade: React.FC<{
  from: number; to: number; children: React.ReactNode;
}> = ({ from, to, children }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [from, from + 6, to - 8, to], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  return <div style={{ opacity, position: 'relative', zIndex: 1 }}>{children}</div>;
};
