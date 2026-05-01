import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';

// Trading-themed design tokens
export const TC = {
  bg: '#0F1419',
  panel: '#1A1F2E',
  panel2: '#252B3D',
  text: '#E8E8F0',
  dim: '#7A7F92',
  blue: '#387ED1',     // Zerodha brand
  green: '#22C55E',    // bullish
  red: '#EF4444',      // bearish
  amber: '#FBBF24',
  cyan: '#22D3EE',
  claude: '#D97757',
  violet: '#A78BFA',
};

export const TF = {
  mono: "'JetBrains Mono', 'Courier New', monospace",
  inter: "'Inter', 'Segoe UI', sans-serif",
};

// Subtle dot grid background — feels like a trading dashboard
export const Backdrop: React.FC = () => (
  <>
    <div style={{ position: 'absolute', inset: 0, backgroundColor: TC.bg, zIndex: -2 }} />
    <div style={{
      position: 'absolute', inset: 0, zIndex: -1, opacity: 0.15,
      backgroundImage: `radial-gradient(circle at 1px 1px, ${TC.dim} 1px, transparent 0)`,
      backgroundSize: '40px 40px',
    }} />
    <div style={{
      position: 'absolute', inset: 0, zIndex: -1,
      background: `radial-gradient(ellipse at center, transparent 30%, ${TC.bg} 90%)`,
    }} />
  </>
);

// Typewriter text — cps controls speed
export const Typewriter: React.FC<{
  text: string; startFrame: number; cps?: number; cursor?: boolean; style?: React.CSSProperties;
}> = ({ text, startFrame, cps = 22, cursor = true, style }) => {
  const frame = useCurrentFrame();
  const elapsed = Math.max(0, frame - startFrame);
  const charsShown = Math.min(Math.floor(elapsed * cps / 30), text.length);
  const blink = Math.floor(frame / 15) % 2 === 0;
  const showCursor = cursor && charsShown < text.length;
  return (
    <span style={style}>
      {text.substring(0, charsShown)}
      {showCursor && blink && <span style={{ color: TC.cyan }}>▊</span>}
    </span>
  );
};

// Number counter — counts up from -> to over duration
export const Counter: React.FC<{
  from: number; to: number; startFrame: number; duration?: number;
  prefix?: string; suffix?: string; format?: (n: number) => string; style?: React.CSSProperties;
}> = ({ from, to, startFrame, duration = 30, prefix = '', suffix = '', format, style }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame - startFrame, [0, duration], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const value = from + (to - from) * p;
  const display = format ? format(value) : Math.round(value).toLocaleString();
  return <span style={style}>{prefix}{display}{suffix}</span>;
};

// Mock Zerodha-style P&L row
export const PnLRow: React.FC<{
  ticker: string; entry: number; exit: number; pnl: number;
  hold: number; date: string; pulse?: boolean;
}> = ({ ticker, entry, exit, pnl, hold, date, pulse = false }) => {
  const frame = useCurrentFrame();
  const pulseOpacity = pulse ? 0.6 + 0.4 * Math.sin(frame * 0.15) : 1;
  const isWin = pnl >= 0;
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '120px 90px 90px 110px 60px 100px',
      gap: 16, padding: '10px 16px', borderBottom: `1px solid ${TC.panel2}`,
      fontFamily: TF.mono, fontSize: 14, color: TC.text,
      backgroundColor: pulse ? `${TC.red}11` : 'transparent', opacity: pulseOpacity,
    }}>
      <div style={{ color: TC.text, fontWeight: 600 }}>{ticker}</div>
      <div style={{ color: TC.dim, textAlign: 'right' }}>{entry.toFixed(2)}</div>
      <div style={{ color: TC.dim, textAlign: 'right' }}>{exit.toFixed(2)}</div>
      <div style={{ color: isWin ? TC.green : TC.red, textAlign: 'right', fontWeight: 700 }}>
        {isWin ? '+' : ''}{pnl.toFixed(0)}
      </div>
      <div style={{ color: TC.dim, textAlign: 'right' }}>{hold}d</div>
      <div style={{ color: TC.dim, fontSize: 12 }}>{date}</div>
    </div>
  );
};

// Mock Zerodha trade history panel
export const ZerodhaPanel: React.FC<{ children: React.ReactNode; title?: string }> = ({
  children, title = 'POSITIONS · LAST 30 TRADES',
}) => (
  <div style={{
    backgroundColor: TC.panel, border: `1px solid ${TC.panel2}`, borderRadius: 8,
    overflow: 'hidden', boxShadow: `0 0 30px rgba(0,0,0,0.5)`,
  }}>
    <div style={{
      padding: '12px 20px', backgroundColor: TC.panel2,
      fontFamily: TF.inter, fontSize: 13, color: TC.blue, fontWeight: 700, letterSpacing: 1.5,
    }}>
      {title}
    </div>
    <div style={{
      display: 'grid', gridTemplateColumns: '120px 90px 90px 110px 60px 100px', gap: 16,
      padding: '10px 16px', borderBottom: `1px solid ${TC.panel2}`,
      fontFamily: TF.mono, fontSize: 11, color: TC.dim, letterSpacing: 1, fontWeight: 700,
    }}>
      <div>SYMBOL</div>
      <div style={{ textAlign: 'right' }}>ENTRY</div>
      <div style={{ textAlign: 'right' }}>EXIT</div>
      <div style={{ textAlign: 'right' }}>P&amp;L</div>
      <div style={{ textAlign: 'right' }}>HOLD</div>
      <div>DATE</div>
    </div>
    {children}
  </div>
);

// Mock Claude chat bubble — user message
export const ClaudeUserMsg: React.FC<{ children: React.ReactNode; appearAt?: number }> = ({
  children, appearAt = 0,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame - appearAt, [0, 8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <div style={{
      alignSelf: 'flex-end', maxWidth: '75%', padding: '14px 18px',
      backgroundColor: TC.panel2, borderRadius: 12,
      fontFamily: TF.mono, fontSize: 14, color: TC.text, lineHeight: 1.6,
      opacity, marginBottom: 16,
    }}>
      {children}
    </div>
  );
};

// Mock Claude chat bubble — assistant streaming message
export const ClaudeAssistantMsg: React.FC<{
  children: React.ReactNode; appearAt?: number;
}> = ({ children, appearAt = 0 }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame - appearAt, [0, 8], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  return (
    <div style={{
      alignSelf: 'flex-start', maxWidth: '85%', padding: '14px 18px',
      backgroundColor: 'transparent', borderLeft: `3px solid ${TC.claude}`,
      fontFamily: TF.inter, fontSize: 15, color: TC.text, lineHeight: 1.6,
      opacity, marginBottom: 16,
    }}>
      <div style={{
        fontFamily: TF.mono, fontSize: 11, color: TC.claude, letterSpacing: 1, marginBottom: 6, fontWeight: 700,
      }}>
        CLAUDE 4.7
      </div>
      {children}
    </div>
  );
};

// Mock Claude chat container
export const ClaudeChat: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{
    backgroundColor: TC.panel, border: `1px solid ${TC.panel2}`, borderRadius: 12,
    padding: '24px', display: 'flex', flexDirection: 'column',
    boxShadow: `0 0 40px rgba(0,0,0,0.6)`,
  }}>
    <div style={{
      fontFamily: TF.inter, fontSize: 12, color: TC.dim, letterSpacing: 2, fontWeight: 700,
      marginBottom: 20, paddingBottom: 12, borderBottom: `1px solid ${TC.panel2}`,
    }}>
      ◆ CLAUDE.AI
    </div>
    {children}
  </div>
);

// Headline strip — for news triage
export const Headline: React.FC<{
  text: string; tag?: 'MATERIAL' | 'CONTEXT' | 'NOISE' | null;
  appearAt?: number;
}> = ({ text, tag = null, appearAt = 0 }) => {
  const frame = useCurrentFrame();
  const x = interpolate(frame - appearAt, [0, 20], [60, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const opacity = interpolate(frame - appearAt, [0, 15], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const tagColor = tag === 'MATERIAL' ? TC.green : tag === 'CONTEXT' ? TC.amber : tag === 'NOISE' ? TC.dim : TC.dim;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '8px 14px',
      backgroundColor: TC.panel, borderLeft: `3px solid ${tagColor}`, borderRadius: 4,
      transform: `translateX(${x}px)`, opacity,
      fontFamily: TF.inter, fontSize: 14, color: TC.text, marginBottom: 6,
    }}>
      {tag && (
        <div style={{
          padding: '3px 8px', backgroundColor: `${tagColor}22`, color: tagColor,
          fontFamily: TF.mono, fontSize: 10, fontWeight: 700, letterSpacing: 1, borderRadius: 3,
          minWidth: 70, textAlign: 'center',
        }}>
          {tag}
        </div>
      )}
      <div style={{ flex: 1 }}>{text}</div>
    </div>
  );
};

// Calendar grid — 30 days with optional callouts
export const Calendar30: React.FC<{
  callouts?: Record<number, { text: string; color: string }>;
  appearAt?: number;
}> = ({ callouts = {}, appearAt = 0 }) => {
  const frame = useCurrentFrame();
  const days = Array.from({ length: 30 }, (_, i) => i + 1);
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 8,
      padding: 24, backgroundColor: TC.panel, borderRadius: 12,
      border: `1px solid ${TC.panel2}`,
    }}>
      {days.map((d) => {
        const local = frame - appearAt - d * 2;
        const p = interpolate(local, [0, 12], [0, 1], {
          extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
        });
        const callout = callouts[d];
        return (
          <div key={d} style={{
            aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 6, border: `1px solid ${callout ? callout.color : TC.panel2}`,
            backgroundColor: callout ? `${callout.color}22` : TC.panel2,
            fontFamily: TF.mono, fontSize: 14, fontWeight: 700,
            color: callout ? callout.color : TC.dim,
            transform: `scale(${p})`, opacity: p,
            boxShadow: callout ? `0 0 12px ${callout.color}66` : 'none',
            position: 'relative',
          }}>
            {d}
          </div>
        );
      })}
    </div>
  );
};

// P&L slam card — for the ₹8,400 moment
export const PnLSlam: React.FC<{ amount: string; appearAt?: number }> = ({
  amount, appearAt = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - appearAt, fps, config: { damping: 9, stiffness: 220 } });
  return (
    <div style={{
      transform: `scale(${p})`, opacity: p,
      padding: '40px 80px', borderRadius: 16,
      backgroundColor: `${TC.red}22`, border: `3px solid ${TC.red}`,
      boxShadow: `0 0 60px ${TC.red}88`,
      textAlign: 'center',
    }}>
      <div style={{
        fontFamily: TF.mono, fontSize: 14, color: TC.red, letterSpacing: 3, marginBottom: 8,
      }}>
        REALIZED P&amp;L
      </div>
      <div style={{
        fontFamily: TF.inter, fontSize: 96, fontWeight: 900, color: TC.red, lineHeight: 1,
      }}>
        {amount}
      </div>
    </div>
  );
};

// Big slam title text — used for cold open and reveals
export const SlamText: React.FC<{
  text: string; appearAt?: number; color?: string; size?: number;
}> = ({ text, appearAt = 0, color = TC.text, size = 96 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - appearAt, fps, config: { damping: 10, stiffness: 180 } });
  const y = interpolate(p, [0, 1], [40, 0]);
  return (
    <div style={{
      transform: `translateY(${y}px) scale(${p})`, opacity: p,
      fontFamily: TF.inter, fontSize: size, fontWeight: 900, color,
      letterSpacing: -1, textShadow: `0 0 30px ${color}66`, textAlign: 'center',
    }}>
      {text}
    </div>
  );
};

// Cyan label/tag — for highlights
export const Tag: React.FC<{
  children: React.ReactNode; color?: string; appearAt?: number;
}> = ({ children, color = TC.cyan, appearAt = 0 }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame - appearAt, [0, 12], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  return (
    <div style={{
      display: 'inline-block', padding: '6px 14px', borderRadius: 6,
      backgroundColor: `${color}22`, border: `1px solid ${color}`, color,
      fontFamily: TF.mono, fontSize: 13, fontWeight: 700, letterSpacing: 1, opacity,
    }}>
      {children}
    </div>
  );
};
