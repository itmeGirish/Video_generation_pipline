// Reusable, data-driven render-kit. The design system + animation lives HERE, once —
// bullet code COMPOSES these by passing DATA, instead of hand-authoring divs per beat.
// All polish (radii, shadows, spacing, type scale, easing, counters, scaffold) is internal.
// Tokens come from ./design (config.yaml). Exposed to bullet code as the `Kit` binding.
import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Easing } from 'remotion';
import { evolvePath } from '@remotion/paths';
import { D } from './design';

const easeOut = Easing.out(Easing.cubic);
const CLAMP = { extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const };
// rgba(0,0,0,a) is the sanctioned shadow-only literal; everything else is a token.
const shadow = (h: number, k = 1) =>
  `0 ${Math.round(h * 0.008 * k)}px ${Math.round(h * 0.022 * k)}px rgba(0,0,0,0.12)`;

// ── faint dot-grid backdrop ──
export const DotGrid: React.FC = () => {
  const { width } = useVideoConfig();
  const sz = Math.round(width * 0.022);
  return (
    <AbsoluteFill
      style={{
        backgroundImage: `radial-gradient(circle, ${D.text_dim} 1.2px, transparent 1.2px)`,
        backgroundSize: `${sz}px ${sz}px`,
        opacity: 0.06,
      }}
    />
  );
};

// ── scene header: title + swapping subtitle + accent underline ──
export const Title: React.FC<{ title: string; subtitle?: string; accent?: string; dim?: number }> = ({
  title, subtitle, accent, dim = 1,
}) => {
  const { width: w, height: h } = useVideoConfig();
  const op = interpolate(useCurrentFrame(), [0, 8], [0, 1], { ...CLAMP, easing: easeOut }) * dim;
  return (
    <div style={{ position: 'absolute', top: Math.round(h * 0.07), width: '100%', textAlign: 'center', opacity: op }}>
      <div style={{ fontFamily: D.font_display, fontWeight: 700, fontSize: Math.round(w * 0.026), color: D.text }}>{title}</div>
      {subtitle ? (
        <div style={{ marginTop: Math.round(h * 0.006), fontFamily: D.font_mono, fontSize: Math.round(w * 0.012), letterSpacing: '0.10em', color: D.text_dim, textTransform: 'uppercase' }}>{subtitle}</div>
      ) : null}
      <div style={{ margin: '0 auto', marginTop: Math.round(h * 0.008), width: Math.round(w * 0.045), height: Math.round(h * 0.004), backgroundColor: accent || D.cyan, borderRadius: Math.round(w * 0.002) }} />
    </div>
  );
};

// ── ticking number ──
export const Counter: React.FC<{ to: number; from?: number; prefix?: string; suffix?: string; decimals?: number; delay?: number; durFrac?: number; style?: React.CSSProperties }> = ({
  to, from = 0, prefix = '', suffix = '', decimals = 0, delay = 4, durFrac = 0.55, style,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const p = interpolate(frame, [delay, durationInFrames * durFrac], [0, 1], { ...CLAMP, easing: easeOut });
  return <span style={style}>{prefix}{(from + (to - from) * p).toFixed(decimals)}{suffix}</span>;
};

// ── soft-shadow floating card ──
export const Panel: React.FC<{ x: number; y: number; w?: number; pad?: number; dim?: number; children?: React.ReactNode }> = ({
  x, y, w, pad, dim = 1, children,
}) => {
  const { width, height } = useVideoConfig();
  return (
    <div style={{ position: 'absolute', left: Math.round(width * x), top: Math.round(height * y), width: w ? Math.round(width * w) : undefined, backgroundColor: D.surface, borderRadius: Math.round(width * 0.01), padding: Math.round(width * (pad ?? 0.012)), boxShadow: shadow(height), opacity: dim }}>
      {children}
    </div>
  );
};

// ── persistent reference card (corner anchor, breathes) ──
export const RefCard: React.FC<{ label: string; value: string; sub?: string; x?: number; y?: number; dim?: number }> = ({
  label, value, sub, x = 0.05, y = 0.17, dim = 1,
}) => {
  const { width: w, height: h } = useVideoConfig();
  const breath = 1 + 0.015 * Math.sin(useCurrentFrame() * 0.1);
  return (
    <div style={{ position: 'absolute', left: Math.round(w * x), top: Math.round(h * y), backgroundColor: D.surface, borderRadius: Math.round(w * 0.01), padding: Math.round(w * 0.012), boxShadow: shadow(h), opacity: dim, transform: `scale(${breath})` }}>
      <div style={{ fontFamily: D.font_mono, fontSize: Math.round(w * 0.0085), letterSpacing: '0.10em', color: D.text_dim }}>{label}</div>
      <div style={{ fontFamily: D.font_display, fontWeight: 700, fontSize: Math.round(w * 0.022), color: D.text }}>{value}</div>
      {sub ? <div style={{ fontFamily: D.font_mono, fontSize: Math.round(w * 0.008), letterSpacing: '0.08em', color: D.text_dim }}>{sub}</div> : null}
    </div>
  );
};

// ── corner stat tag (e.g. 10× / PER TURN) ──
export const Tag: React.FC<{ value: string; label?: string; color?: string; x?: number; y?: number; dim?: number }> = ({
  value, label, color, x = 0.06, y = 0.17, dim = 1,
}) => {
  const { width: w, height: h } = useVideoConfig();
  const breath = 1 + 0.015 * Math.sin(useCurrentFrame() * 0.1);
  return (
    <div style={{ position: 'absolute', right: Math.round(w * x), top: Math.round(h * y), textAlign: 'right', opacity: dim }}>
      <div style={{ fontFamily: D.font_display, fontWeight: 700, fontSize: Math.round(w * 0.036), color: color || D.amber, transform: `scale(${breath})` }}>{value}</div>
      {label ? <div style={{ fontFamily: D.font_mono, fontSize: Math.round(w * 0.0085), letterSpacing: '0.10em', color: D.text_dim }}>{label}</div> : null}
    </div>
  );
};

// ── labelled comparison chip (a row inside a card; e.g. MON·CODE = TUE·CODE) ──
export const Chip: React.FC<{ who: string; text: string; x: number; y?: number; delay?: number }> = ({
  who, text, x, y = 0.215, delay = 6,
}) => {
  const frame = useCurrentFrame();
  const { width: w, height: h, fps } = useVideoConfig();
  const pop = spring({ frame: frame - delay, fps, config: { damping: 18, stiffness: 200 } });
  return (
    <div style={{ position: 'absolute', left: Math.round(w * x), top: Math.round(h * y), width: Math.round(w * 0.17), backgroundColor: D.surface, borderRadius: Math.round(w * 0.008), padding: Math.round(w * 0.011), opacity: pop, transform: `translateY(${Math.round((1 - pop) * h * 0.02)}px)`, boxShadow: shadow(h) }}>
      <div style={{ fontFamily: D.font_mono, fontSize: Math.round(w * 0.0085), letterSpacing: '0.12em', color: D.text_dim, marginBottom: Math.round(h * 0.006) }}>{who}</div>
      <div style={{ fontFamily: D.font_mono, fontSize: Math.round(w * 0.012), color: D.text }}>{text}</div>
    </div>
  );
};

// ── horizontal bar chart: scaffold (axis+grid+labels) → bars FILL with ticking counters ──
export const BarChart: React.FC<{
  rows: { label: string; value: number; color: string }[];
  max: number; unit?: string; decimals?: number;
  x?: number; y?: number; w?: number; delay?: number; dim?: number; settled?: boolean;
}> = ({ rows, max, unit = '', decimals = 2, x = 0.22, y = 0.36, w = 0.58, delay = 8, dim = 1, settled = false }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, durationInFrames } = useVideoConfig();
  const ox = Math.round(W * x), maxW = Math.round(W * w), top0 = Math.round(H * y);
  // `settled` = the chart is already built (evolve beats) → show full, no re-grow.
  const p = settled ? 1 : interpolate(frame, [delay, durationInFrames * 0.6], [0, 1], { ...CLAMP, easing: easeOut });
  const sg = settled ? 1 : interpolate(frame, [0, 10], [0, 1], CLAMP);
  const barH = Math.round(H * 0.105), gap = Math.round(H * 0.06);
  const steps = [1, 2, 3];
  return (
    <div style={{ opacity: dim }}>
      <div style={{ position: 'absolute', left: ox, top: top0, width: maxW, height: Math.max(1, Math.round(H * 0.0025)), backgroundColor: D.text_dim, opacity: 0.3 * sg }} />
      {steps.map((s, i) => (
        <div key={'g' + i} style={{ position: 'absolute', left: ox + Math.round(maxW * s / 3), top: top0, width: 1, height: Math.round(H * 0.32), backgroundColor: D.text_dim, opacity: 0.13 * sg }} />
      ))}
      {steps.map((s, i) => (
        <div key={'l' + i} style={{ position: 'absolute', left: ox + Math.round(maxW * s / 3) - Math.round(W * 0.008), top: top0 + Math.round(H * 0.35), fontFamily: D.font_mono, fontSize: Math.round(W * 0.0095), color: D.text_dim, opacity: 0.55 * sg }}>{unit}{Math.round(max * s / 3)}</div>
      ))}
      {rows.map((r, i) => {
        const by = top0 + Math.round(H * 0.06) + i * (barH + gap);
        const wpx = Math.max(2, Math.round(maxW * (r.value / max) * p));
        return (
          <div key={i} style={{ position: 'absolute', left: ox, top: by }}>
            <div style={{ position: 'absolute', left: -Math.round(W * 0.065), top: Math.round(barH * 0.28), width: Math.round(W * 0.05), textAlign: 'right', fontFamily: D.font_mono, fontSize: Math.round(W * 0.015), color: D.text_dim }}>{r.label}</div>
            <div style={{ width: wpx, height: barH, backgroundColor: r.color, borderRadius: Math.round(W * 0.004), boxShadow: shadow(H) }} />
            <div style={{ position: 'absolute', left: wpx + Math.round(W * 0.014), top: Math.round(barH * 0.18), fontFamily: D.font_display, fontWeight: 700, fontSize: Math.round(W * 0.022), color: r.color }}>{unit}{(r.value * p).toFixed(decimals)}</div>
          </div>
        );
      })}
    </div>
  );
};

// ── KPI card: label + big counting number (e.g. "CACHE HIT  92%") ──
export const KPI: React.FC<{ label: string; to: number; from?: number; unit?: string; decimals?: number; color?: string; x: number; y: number; delay?: number; dim?: number }> = ({
  label, to, from = 0, unit = '', decimals = 0, color, x, y, delay = 4, dim = 1,
}) => {
  const { width: w, height: h } = useVideoConfig();
  return (
    <Panel x={x} y={y} dim={dim}>
      <div style={{ fontFamily: D.font_mono, fontSize: Math.round(w * 0.0085), letterSpacing: '0.10em', color: D.text_dim, marginBottom: Math.round(h * 0.006) }}>{label}</div>
      <div style={{ fontFamily: D.font_display, fontWeight: 700, fontSize: Math.round(w * 0.03), color: color || D.text }}>
        <Counter to={to} from={from} suffix={unit} decimals={decimals} delay={delay} />
      </div>
    </Panel>
  );
};

// ── pipeline: stage cards + arrows, staggered (process / request flow) ──
export const Pipeline: React.FC<{ stages: string[]; y?: number; delay?: number; dim?: number }> = ({ stages, y = 0.45, delay = 6, dim = 1 }) => {
  const frame = useCurrentFrame();
  const { width: w, height: h, fps } = useVideoConfig();
  const items: React.ReactNode[] = [];
  stages.forEach((s, i) => {
    if (i > 0) {
      const ga = spring({ frame: frame - (delay + i * 6 - 3), fps, config: { damping: 20, stiffness: 200 } });
      items.push(<div key={'a' + i} style={{ fontFamily: D.font_mono, fontSize: Math.round(w * 0.018), color: D.text_dim, opacity: ga, margin: `0 ${Math.round(w * 0.01)}px` }}>→</div>);
    }
    const g = spring({ frame: frame - (delay + i * 6), fps, config: { damping: 20, stiffness: 200 } });
    items.push(
      <div key={'s' + i} style={{ opacity: g, transform: `translateY(${Math.round((1 - g) * h * 0.02)}px)`, backgroundColor: D.surface, borderRadius: Math.round(w * 0.008), padding: `${Math.round(h * 0.018)}px ${Math.round(w * 0.016)}px`, boxShadow: shadow(h), fontFamily: D.font_mono, fontSize: Math.round(w * 0.014), color: D.text }}>{s}</div>
    );
  });
  return <div style={{ position: 'absolute', top: Math.round(h * y), width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', opacity: dim }}>{items}</div>;
};

// ── token / cell grid, colored by state (memory pages, tokens, matrix) ──
const STATE_TOKEN: Record<string, string> = { cached: 'green', good: 'green', ok: 'green', miss: 'red', bad: 'red', invalid: 'red', hot: 'amber', warn: 'amber', neutral: 'surface' };
export const TokenGrid: React.FC<{ cells: { label?: string; state?: string }[]; cols?: number; x?: number; y?: number; delay?: number; dim?: number }> = ({
  cells, cols = 10, x = 0.15, y = 0.32, delay = 6, dim = 1,
}) => {
  const frame = useCurrentFrame();
  const { width: w, height: h, fps } = useVideoConfig();
  const sz = Math.round(w * 0.04), gap = Math.round(w * 0.008);
  return (
    <div style={{ position: 'absolute', left: Math.round(w * x), top: Math.round(h * y), display: 'flex', flexWrap: 'wrap', width: cols * (sz + gap), gap, opacity: dim }}>
      {cells.map((c, i) => {
        const g = spring({ frame: frame - (delay + i * 2), fps, config: { damping: 20, stiffness: 200 } });
        const tok = c.state ? STATE_TOKEN[c.state] || 'surface' : 'surface';
        const col = (D as unknown as Record<string, string>)[tok] || D.surface;
        const onColor = tok !== 'surface';
        return (
          <div key={i} style={{ width: sz, height: sz, borderRadius: Math.round(w * 0.004), backgroundColor: col, opacity: g, transform: `scale(${0.6 + 0.4 * g})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: D.font_mono, fontSize: Math.round(w * 0.011), color: onColor ? D.white : D.text_dim, boxShadow: shadow(h, 0.5) }}>{c.label || ''}</div>
        );
      })}
    </div>
  );
};

// ── hierarchy tiers: stacked horizontal bars (storage/latency hierarchy) ──
export const Tiers: React.FC<{ tiers: { name: string; sub?: string; wFrac: number; color?: string }[]; x?: number; y?: number; delay?: number; dim?: number }> = ({
  tiers, x = 0.08, y = 0.24, delay = 6, dim = 1,
}) => {
  const frame = useCurrentFrame();
  const { width: w, height: h, fps } = useVideoConfig();
  const barH = Math.round(h * 0.1), gap = Math.round(h * 0.03);
  return (
    <div style={{ position: 'absolute', left: Math.round(w * x), top: Math.round(h * y), opacity: dim }}>
      {tiers.map((t, i) => {
        const g = spring({ frame: frame - (delay + i * 6), fps, config: { damping: 20, stiffness: 200 } });
        return (
          <div key={i} style={{ width: Math.round(w * t.wFrac * g), height: barH, marginBottom: gap, backgroundColor: t.color || D.cyan, borderRadius: Math.round(w * 0.008), boxShadow: shadow(h), display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: `0 ${Math.round(w * 0.014)}px`, opacity: g }}>
            <span style={{ fontFamily: D.font_mono, fontWeight: 700, fontSize: Math.round(w * 0.013), color: D.white }}>{t.name}</span>
            {t.sub ? <span style={{ fontFamily: D.font_mono, fontSize: Math.round(w * 0.0085), color: D.white, opacity: 0.85 }}>{t.sub}</span> : null}
          </div>
        );
      })}
    </div>
  );
};

// ── slider: track + knob + value pill (a tunable tradeoff) ──
export const Slider: React.FC<{ label?: string; min: number; max: number; value: number; x?: number; y?: number; w?: number; delay?: number; dim?: number }> = ({
  label, min, max, value, x = 0.15, y = 0.32, w = 0.7, delay = 6, dim = 1,
}) => {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const k = interpolate(frame, [delay, delay + 24], [0, 1], { ...CLAMP, easing: easeOut });
  const px = (value - min) / (max - min);
  const trackW = Math.round(W * w), left = Math.round(W * x), top = Math.round(H * y);
  const knobX = left + Math.round(trackW * px * k);
  return (
    <div style={{ opacity: dim }}>
      {label ? <div style={{ position: 'absolute', left, top: top - Math.round(H * 0.05), fontFamily: D.font_mono, fontSize: Math.round(W * 0.011), letterSpacing: '0.08em', color: D.text_dim }}>{label}</div> : null}
      <div style={{ position: 'absolute', left, top, width: trackW, height: Math.round(H * 0.006), backgroundColor: D.text_dim, opacity: 0.3, borderRadius: 99 }} />
      <div style={{ position: 'absolute', left: knobX - Math.round(W * 0.012), top: top - Math.round(H * 0.009), width: Math.round(W * 0.024), height: Math.round(W * 0.024), borderRadius: '50%', backgroundColor: D.cyan, boxShadow: shadow(H) }} />
      <div style={{ position: 'absolute', left: knobX - Math.round(W * 0.018), top: top - Math.round(H * 0.055), backgroundColor: D.cyan, color: D.white, borderRadius: Math.round(W * 0.006), padding: `${Math.round(H * 0.004)}px ${Math.round(W * 0.008)}px`, fontFamily: D.font_mono, fontSize: Math.round(W * 0.011), fontWeight: 700 }}>{Math.round(min + (max - min) * px * k)}</div>
    </div>
  );
};

// ── syntax-colored code panel (code / config / diff) ──
export const CodePanel: React.FC<{ title?: string; lines: { text: string; color?: string }[]; x: number; y: number; w?: number; delay?: number; dim?: number }> = ({
  title, lines, x, y, w = 0.34, delay = 4, dim = 1,
}) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const pop = spring({ frame: frame - delay, fps, config: { damping: 18, stiffness: 200 } });
  return (
    <div style={{ position: 'absolute', left: Math.round(W * x), top: Math.round(H * y), width: Math.round(W * w), backgroundColor: D.surface, borderRadius: Math.round(W * 0.01), padding: Math.round(W * 0.014), boxShadow: shadow(H), opacity: pop * dim, transform: `translateY(${Math.round((1 - pop) * H * 0.02)}px)` }}>
      {title ? <div style={{ fontFamily: D.font_mono, fontSize: Math.round(W * 0.009), color: D.text_dim, marginBottom: Math.round(H * 0.01) }}>{title}</div> : null}
      {lines.map((l, i) => <div key={i} style={{ fontFamily: D.font_mono, fontSize: Math.round(W * 0.012), lineHeight: 1.6, color: l.color || D.text, whiteSpace: 'pre' }}>{l.text}</div>)}
    </div>
  );
};

// ── gauge / meter: a filled bar with % (saturation / utilization) ──
export const Gauge: React.FC<{ label: string; value: number; max?: number; color?: string; x: number; y: number; w?: number; delay?: number; dim?: number }> = ({
  label, value, max = 100, color, x, y, w = 0.3, delay = 6, dim = 1,
}) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, durationInFrames } = useVideoConfig();
  const p = interpolate(frame, [delay, durationInFrames * 0.55], [0, 1], { ...CLAMP, easing: easeOut });
  const trackW = Math.round(W * w), hh = Math.round(H * 0.018);
  return (
    <div style={{ position: 'absolute', left: Math.round(W * x), top: Math.round(H * y), width: trackW, opacity: dim }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: Math.round(H * 0.008) }}>
        <span style={{ fontFamily: D.font_mono, fontSize: Math.round(W * 0.0095), letterSpacing: '0.08em', color: D.text_dim }}>{label}</span>
        <span style={{ fontFamily: D.font_display, fontWeight: 700, fontSize: Math.round(W * 0.013), color: color || D.cyan }}>{Math.round((value / max) * 100 * p)}%</span>
      </div>
      <div style={{ position: 'relative', width: trackW, height: hh }}>
        <div style={{ position: 'absolute', inset: 0, backgroundColor: D.text_dim, opacity: 0.2, borderRadius: 99 }} />
        <div style={{ position: 'absolute', top: 0, left: 0, height: hh, width: Math.round(trackW * (value / max) * p), backgroundColor: color || D.cyan, borderRadius: 99 }} />
      </div>
    </div>
  );
};

// ── centered hero stat (the big-number moment) ──
export const BigStat: React.FC<{ value: string; caption?: string; sub?: string; color?: string }> = ({ value, caption, sub, color }) => {
  const frame = useCurrentFrame();
  const { width: w, height: h, fps } = useVideoConfig();
  const stamp = spring({ frame: frame - 4, fps, config: { damping: 12, stiffness: 90, mass: 2 } });
  const sc = interpolate(stamp, [0, 1], [0.7, 1], CLAMP);
  const breath = 1 + 0.015 * Math.sin(frame * 0.1);
  return (
    <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: D.font_display, fontWeight: 700, fontSize: Math.round(h * 0.28), color: color || D.amber, transform: `scale(${sc * breath})`, lineHeight: 1 }}>{value}</div>
      {caption ? <div style={{ marginTop: Math.round(h * 0.02), fontFamily: D.font_mono, fontSize: Math.round(w * 0.017), letterSpacing: '0.08em', color: D.text_dim }}>{caption}</div> : null}
      {sub ? <div style={{ marginTop: Math.round(h * 0.015), fontFamily: D.font_display, fontWeight: 700, fontSize: Math.round(w * 0.026), color: D.text }}>{sub}</div> : null}
    </AbsoluteFill>
  );
};

// ── Pool: a budget/quantity shown as a grid of UNITS that gets CONSUMED ──
// Generic + data-driven: works for any "a pool being eaten" idea (token budget,
// packets, files, energy, money). Animates the drain (action + cause→effect),
// shows the units (invisible→visible), fills a real AREA (dense). Pass DATA only.
export const Pool: React.FC<{
  consumed: number;            // units consumed (drained, from the end)
  total?: number;              // total units in the pool
  label: string;               // what the pool IS (e.g. "USAGE THIS WINDOW")
  cols?: number;
  x?: number; y?: number; cell?: number; delay?: number; dim?: number;
  fullColor?: string; drainColor?: string;
  metric?: 'consumed' | 'remaining' | 'none';  // big number beside the grid
}> = ({ consumed, total = 96, label, cols = 12, x = 0.28, y = 0.24, cell = 0.046, delay = 4, dim = 1, fullColor, drainColor, metric = 'consumed' }) => {
  const frame = useCurrentFrame();
  const { width: w, height: h, fps } = useVideoConfig();
  const cs = Math.round(w * cell), gp = Math.round(w * 0.007);
  const gw = cols * (cs + gp);
  const p = interpolate(frame, [delay, delay + 26], [0, 1], { ...CLAMP, easing: easeOut }); // drain progress 0→1
  const drainedNow = Math.round(consumed * p);
  const cells: React.ReactNode[] = [];
  for (let i = 0; i < total; i++) {
    const isDrained = i >= total - drainedNow;
    const g = spring({ frame: frame - (2 + (i % cols) * 0.5), fps, config: { damping: 20, stiffness: 200 } });
    cells.push(React.createElement('div', { key: i, style: { width: cs, height: cs, borderRadius: Math.round(w * 0.004), backgroundColor: isDrained ? (drainColor || D.red) : (fullColor || D.green), opacity: isDrained ? 0.92 : g, boxShadow: shadow(h, 0.5) } }));
  }
  const pct = Math.round((consumed / total) * 100 * p);
  const big = metric === 'consumed' ? `−${pct}%` : metric === 'remaining' ? `${100 - pct}%` : '';
  const left = Math.round(w * x), top = Math.round(h * y);
  return React.createElement('div', { style: { position: 'absolute', left, top, opacity: dim } },
    React.createElement('div', { style: { fontFamily: D.font_mono, fontSize: Math.round(w * 0.011), letterSpacing: '0.10em', color: D.text_dim, marginBottom: Math.round(h * 0.018) } }, label),
    React.createElement('div', { style: { display: 'flex', flexWrap: 'wrap', width: gw, gap: gp } }, cells),
    metric !== 'none'
      ? React.createElement('div', { style: { position: 'absolute', left: gw - Math.round(w * 0.16), top: Math.round(-h * 0.10), fontFamily: D.font_display, fontWeight: 700, fontSize: Math.round(w * 0.06), color: metric === 'consumed' ? D.red : D.green } }, big)
      : null
  );
};

// ════════════════════════════════════════════════════════════════════════
// v2 GLOBAL VISUAL SYSTEM — the 3 persistent objects + their helpers.
// Built once HERE, reused in every scene. Consistency is the whole point.
// THE SYNC RULE: a bullet computes ONE scanProgress, then passes it to BOTH
// ScanSweep (progress) AND Battery (rem = startLevel - scanProgress*cost), so
// the scan and the drain move as one — that is how the viewer learns the
// causality. No blur on any per-frame-moving element (it stalls the headless
// render); glows are built from solid concentric shapes.
// ════════════════════════════════════════════════════════════════════════

// BATTERY — usage budget. Vertical cell, top-right. rem 0..1 fill, green>amber>red.
export const Battery: React.FC<{
  rem: number; x?: number; y?: number; scale?: number; showPct?: boolean; label?: string;
}> = ({ rem, x = 0.865, y = 0.10, scale = 1, showPct = false, label }) => {
  const { width: w, height: h } = useVideoConfig();
  const r = Math.max(0, Math.min(1, rem));
  const bw = Math.round(w * 0.07 * scale), bh = Math.round(h * 0.34 * scale);
  const bx = Math.round(w * x), by = Math.round(h * y);
  const c = r > 0.5 ? D.green : r > 0.28 ? D.amber : D.red;
  const nub = Math.round(bw * 0.34), nubh = Math.max(3, Math.round(bh * 0.05));
  const bord = Math.max(2, Math.round(w * 0.003));
  return React.createElement('div', { style: { position: 'absolute', left: bx, top: by } },
    React.createElement('div', { style: { position: 'absolute', left: (bw - nub) / 2, top: -nubh, width: nub, height: nubh, borderRadius: `${Math.round(w * 0.003)}px ${Math.round(w * 0.003)}px 0 0`, backgroundColor: D.text_dim } }),
    React.createElement('div', { style: { position: 'relative', width: bw, height: bh, borderRadius: Math.round(w * 0.012), border: `${bord}px solid ${D.text}`, backgroundColor: D.surface, overflow: 'hidden' } },
      React.createElement('div', { style: { position: 'absolute', left: 0, right: 0, bottom: 0, height: Math.round((bh - bord * 2) * r), backgroundColor: c } }),
      showPct ? React.createElement('div', { style: { position: 'absolute', left: 0, right: 0, top: '50%', transform: 'translateY(-50%)', textAlign: 'center', fontFamily: D.font_display, fontWeight: 700, fontSize: Math.round(bw * 0.4), color: D.text } }, `${Math.round(r * 100)}`) : null
    ),
    label ? React.createElement('div', { style: { position: 'absolute', left: -Math.round(bw * 0.3), top: bh + Math.round(h * 0.012), width: Math.round(bw * 1.6), textAlign: 'center', fontFamily: D.font_mono, fontSize: Math.round(w * 0.011), letterSpacing: '0.08em', color: D.text_dim } }, label) : null
  );
};

// STACK — the context window. Sheets pile bottom→top; cyan=you, violet=Claude,
// white=files, grey=logs. spring(damping:12) entrance + per-index seeded rotation.
export const Stack: React.FC<{
  sheets: { color?: string; label?: string; h?: number }[];
  x?: number; y?: number; w?: number; delay?: number; highlight?: number;
}> = ({ sheets, x = 0.36, y = 0.74, w: ww = 0.21, delay = 4, highlight = -1 }) => {
  const frame = useCurrentFrame();
  const { width: w, height: h, fps } = useVideoConfig();
  const cx = Math.round(w * x), baseY = Math.round(h * y), sw = Math.round(w * ww);
  const gap = Math.max(2, Math.round(h * 0.004));
  let cy = baseY;
  const nodes: React.ReactNode[] = [];
  sheets.forEach((s, i) => {
    const sh = Math.round(h * (s.h || 0.028));
    cy -= sh + gap;
    const g = spring({ frame: frame - (delay + i * 3), fps, config: { damping: 12, stiffness: 120 } });
    const rot = (((i * 73 + 17) % 100) / 100 - 0.5) * 6;
    const dropY = (1 - g) * Math.round(h * 0.05);
    const pulse = highlight === i ? 1 + 0.03 * Math.sin(frame * 0.3) : 1;
    nodes.push(React.createElement('div', { key: i, style: { position: 'absolute', left: cx - sw / 2, top: cy, width: sw, height: sh, borderRadius: Math.round(w * 0.004), backgroundColor: s.color || D.text, opacity: g, transform: `translateY(${dropY}px) rotate(${rot}deg) scale(${pulse})`, transformOrigin: 'center', boxShadow: shadow(h, 0.4), display: 'flex', alignItems: 'center', paddingLeft: Math.round(w * 0.01) } },
      s.label ? React.createElement('div', { style: { fontFamily: D.font_mono, fontSize: Math.round(sh * 0.46), color: D.bg, opacity: 0.85, whiteSpace: 'nowrap', overflow: 'hidden', fontWeight: 600 } }, s.label) : null
    ));
  });
  return React.createElement('div', {}, nodes);
};

// SCANSWEEP — Claude reading the stack. A horizontal beam sweeps top→bottom over
// a region as progress 0→1. Solid band + core line (no blur).
export const ScanSweep: React.FC<{
  progress: number; x?: number; y?: number; w?: number; h?: number; color?: string;
}> = ({ progress, x = 0.255, y = 0.30, w: ww = 0.21, h: hh = 0.44, color }) => {
  const { width: w, height: h } = useVideoConfig();
  const p = Math.max(0, Math.min(1, progress));
  const rx = Math.round(w * x), ry = Math.round(h * y), rw = Math.round(w * ww), rh = Math.round(h * hh);
  const col = color || D.cyan;
  const core = Math.max(2, Math.round(h * 0.005));
  const band = Math.round(h * 0.03);
  const yy = Math.round(rh * p);
  return React.createElement('div', { style: { position: 'absolute', left: rx, top: ry, width: rw, height: rh, pointerEvents: 'none' } },
    React.createElement('div', { style: { position: 'absolute', left: 0, top: 0, width: rw, height: yy, background: `linear-gradient(to bottom, ${col}00, ${col}22)` } }),
    React.createElement('div', { style: { position: 'absolute', left: -Math.round(rw * 0.05), top: yy - band / 2, width: Math.round(rw * 1.1), height: band, backgroundColor: col, opacity: 0.22 } }),
    React.createElement('div', { style: { position: 'absolute', left: -Math.round(rw * 0.05), top: yy - core / 2, width: Math.round(rw * 1.1), height: core, backgroundColor: col } })
  );
};

// CLAUDEORB — the assistant. Concentric solid circles (glow without blur);
// breathing scale; mood recolors + adds a spinning arc when scanning.
export const ClaudeOrb: React.FC<{
  mood?: 'idle' | 'scanning' | 'lost' | 'happy'; x?: number; y?: number; scale?: number;
}> = ({ mood = 'idle', x = 0.70, y = 0.46, scale = 1 }) => {
  const frame = useCurrentFrame();
  const { width: w, height: h } = useVideoConfig();
  const cx = Math.round(w * x), cy = Math.round(h * y);
  const rad = Math.round(w * 0.05 * scale);
  const breath = 1 + 0.03 * Math.sin(frame * 0.12);
  const col = mood === 'lost' ? D.red : mood === 'happy' ? D.green : D.violet;
  const spin = mood === 'scanning' ? frame * 5 : 0;
  const halo = (k: number, op: number) => React.createElement('div', { style: { position: 'absolute', left: cx - rad * k, top: cy - rad * k, width: rad * 2 * k, height: rad * 2 * k, borderRadius: '50%', backgroundColor: col, opacity: op, transform: `scale(${breath})` } });
  return React.createElement('div', {},
    halo(1.0, 0.10), halo(0.74, 0.16), halo(0.5, 0.95),
    mood === 'scanning' ? React.createElement('div', { style: { position: 'absolute', left: cx - rad * 1.15, top: cy - rad * 1.15, width: rad * 2.3, height: rad * 2.3, borderRadius: '50%', border: `${Math.max(2, Math.round(w * 0.004))}px solid ${col}`, borderTopColor: 'transparent', borderRightColor: 'transparent', transform: `rotate(${spin}deg)` } }) : null,
    React.createElement('div', { style: { position: 'absolute', left: cx - rad * 0.5, top: cy + (mood === 'lost' ? rad * 0.05 : 0), width: rad, textAlign: 'center', fontFamily: D.font_display, fontWeight: 700, fontSize: Math.round(rad * 0.7), color: D.bg } }, mood === 'lost' ? '?' : mood === 'happy' ? '✓' : '')
  );
};

// GLASSCONTAINER — a tank with tick marks; fill 0..1; xray dims the fill so
// internal structure shows through.
export const GlassContainer: React.FC<{
  fill: number; label?: string; x?: number; y?: number; w?: number; h?: number;
  color?: string; xray?: boolean; ticks?: number;
}> = ({ fill, label, x = 0.42, y = 0.26, w: ww = 0.18, h: hh = 0.46, color, xray = false, ticks = 5 }) => {
  const { width: w, height: h } = useVideoConfig();
  const f = Math.max(0, Math.min(1, fill));
  const rx = Math.round(w * x), ry = Math.round(h * y), rw = Math.round(w * ww), rh = Math.round(h * hh);
  const col = color || D.cyan;
  const tnodes: React.ReactNode[] = [];
  for (let i = 1; i < ticks; i++) tnodes.push(React.createElement('div', { key: i, style: { position: 'absolute', right: 0, top: Math.round(rh * i / ticks), width: Math.round(rw * 0.14), height: Math.max(1, Math.round(h * 0.002)), backgroundColor: D.text_dim, opacity: 0.5 } }));
  return React.createElement('div', { style: { position: 'absolute', left: rx, top: ry } },
    React.createElement('div', { style: { position: 'relative', width: rw, height: rh, border: `${Math.max(2, Math.round(w * 0.003))}px solid ${D.text_dim}`, borderRadius: Math.round(w * 0.008), overflow: 'hidden', backgroundColor: D.surface } },
      React.createElement('div', { style: { position: 'absolute', left: 0, right: 0, bottom: 0, height: Math.round(rh * f), backgroundColor: col, opacity: xray ? 0.5 : 1 } }),
      ...tnodes
    ),
    label ? React.createElement('div', { style: { width: rw, textAlign: 'center', marginTop: Math.round(h * 0.012), fontFamily: D.font_mono, fontSize: Math.round(w * 0.011), letterSpacing: '0.08em', color: D.text_dim } }, label) : null
  );
};

// CHECKLIST — scoped tasks ticking green. Staggered spring entrance.
export const Checklist: React.FC<{
  items: string[]; ticked?: number[]; x?: number; y?: number; delay?: number;
}> = ({ items, ticked = [], x = 0.12, y = 0.30, delay = 4 }) => {
  const frame = useCurrentFrame();
  const { width: w, height: h, fps } = useVideoConfig();
  const rx = Math.round(w * x), ry = Math.round(h * y);
  const nodes = items.map((it, i) => {
    const g = spring({ frame: frame - (delay + i * 4), fps, config: { damping: 18, stiffness: 180 } });
    const on = ticked.includes(i);
    const box = Math.round(w * 0.022);
    return React.createElement('div', { key: i, style: { display: 'flex', alignItems: 'center', gap: Math.round(w * 0.012), marginBottom: Math.round(h * 0.022), opacity: g, transform: `translateX(${(1 - g) * -Math.round(w * 0.02)}px)` } },
      React.createElement('div', { style: { width: box, height: box, flexShrink: 0, borderRadius: Math.round(w * 0.004), border: `2px solid ${on ? D.green : D.text_dim}`, backgroundColor: on ? D.green : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: D.bg, fontFamily: D.font_display, fontWeight: 700, fontSize: Math.round(box * 0.7) } }, on ? '✓' : ''),
      React.createElement('div', { style: { fontFamily: D.font_mono, fontSize: Math.round(w * 0.016), color: on ? D.text : D.text_dim } }, it)
    );
  });
  return React.createElement('div', { style: { position: 'absolute', left: rx, top: ry } }, nodes);
};

// NUMBERSTAMP — the only "loud" text. scale 1.4→1 spring + 1-frame white flash.
export const NumberStamp: React.FC<{
  value: string; sub?: string; color?: string; x?: number; y?: number; delay?: number; size?: number;
}> = ({ value, sub, color, y = 0.42, delay = 0, size = 0.11 }) => {
  const frame = useCurrentFrame();
  const { width: w, height: h, fps } = useVideoConfig();
  const g = spring({ frame: frame - delay, fps, config: { damping: 12, stiffness: 140 } });
  const sc = interpolate(g, [0, 1], [1.4, 1]);
  const op = interpolate(frame, [delay, delay + 3], [0, 1], CLAMP);
  const flash = interpolate(frame, [delay, delay + 1, delay + 4], [0, 1, 0], CLAMP);
  const col = color || D.text;
  return React.createElement('div', { style: { position: 'absolute', left: 0, right: 0, top: Math.round(h * y), textAlign: 'center', opacity: op } },
    React.createElement('div', { style: { fontFamily: D.font_display, fontWeight: 700, fontSize: Math.round(w * size), color: col, lineHeight: 1, transform: `scale(${sc})`, textShadow: flash > 0.05 ? `0 0 ${Math.round(w * 0.02 * flash)}px ${D.white}` : 'none' } }, value),
    sub ? React.createElement('div', { style: { fontFamily: D.font_mono, fontSize: Math.round(w * 0.016), color: D.text_dim, marginTop: Math.round(h * 0.015), letterSpacing: '0.06em' } }, sub) : null
  );
};

// TERMINAL — ACCURATE Claude Code CLI TUI (researched, not assumed). Monospace, dark,
// ✻ amber accent. NO file sidebar, NO top usage bar (Claude Code has neither). Body = a
// streaming transcript of ⏺ tool calls + └ result branches + ✻ thinking. Bottom = a
// rounded prompt box + the REAL "context left" indicator (drains as context fills) and the
// model/shortcuts line. contextLeft = 0..1 (1 = full; drains down).
export const Terminal: React.FC<{
  cwd?: string; lines?: { text: string; kind?: 'tool' | 'result' | 'think' | 'user' | 'plain'; color?: string }[];
  prompt?: string; contextLeft?: number; contextText?: string; model?: string;
  spinner?: boolean; lineDelay?: number; dim?: number; reread?: number | null; rereadLabel?: string;
}> = ({ cwd = '~/login-app', lines = [], prompt, contextLeft = 1, contextText, model = 'claude-opus-4', spinner = false, lineDelay = 4, dim = 1, reread = null, rereadLabel }) => {
  const frame = useCurrentFrame();
  const { width: w, height: h, fps } = useVideoConfig();
  const X = Math.round(w * 0.05), Y = Math.round(h * 0.05), W = Math.round(w * 0.9), H = Math.round(h * 0.9);
  const bd = Math.max(2, Math.round(w * 0.0015));
  const pad = Math.round(w * 0.02);
  const fs = Math.round(w * 0.0145);
  const cl = Math.max(0, Math.min(1, contextLeft));
  const clColor = cl > 0.5 ? D.green : cl > 0.28 ? D.amber : D.red;
  const kindColor = (k?: string) => k === 'tool' ? D.amber : k === 'result' ? D.text_dim : k === 'think' ? D.amber : k === 'user' ? D.cyan : D.text;
  // header
  const header = React.createElement('div', { style: { fontFamily: D.font_mono, fontSize: Math.round(w * 0.013), color: D.text_dim, marginBottom: Math.round(h * 0.025), display: 'flex', gap: pad } },
    React.createElement('span', { style: { color: D.amber } }, '✦ Claude Code'),
    React.createElement('span', {}, cwd));
  // transcript lines
  const bodyLines = lines.map((ln, i) => {
    const g = spring({ frame: frame - (lineDelay + i * 4), fps, config: { damping: 18, stiffness: 200 } });
    const k = ln.kind;
    const pre = k === 'tool' ? '● ' : k === 'result' ? '  └ ' : k === 'user' ? '> ' : k === 'think' ? '✦ ' : '';
    // Typographic HIERARCHY: user prompt is the loudest, tool/think medium-bold,
    // result branches small + dim (subordinate detail), grouped tight to their action.
    const sz = k === 'user' ? Math.round(w * 0.021) : k === 'result' ? Math.round(w * 0.0125) : Math.round(w * 0.0165);
    const wt = (k === 'user') ? 700 : (k === 'tool' || k === 'think') ? 600 : 400;
    const op = (k === 'result' ? 0.6 : 1) * g;
    const mb = k === 'tool' ? Math.round(h * 0.005) : k === 'result' ? Math.round(h * 0.02) : Math.round(h * 0.016);
    return React.createElement('div', { key: i, style: { fontFamily: D.font_mono, fontWeight: wt, fontSize: sz, color: ln.color || kindColor(k), marginBottom: mb, opacity: op, transform: `translateY(${(1 - g) * Math.round(h * 0.01)}px)`, whiteSpace: 'pre', letterSpacing: k === 'user' ? '0.01em' : 'normal' } },
      React.createElement('span', { style: { color: k === 'tool' ? D.amber : (ln.color || kindColor(k)) } }, pre), ln.text);
  });
  const spin = spinner ? React.createElement('span', { style: { display: 'inline-block', width: Math.round(w * 0.014), height: Math.round(w * 0.014), borderRadius: '50%', border: `${bd}px solid ${D.amber}`, borderTopColor: 'transparent', transform: `rotate(${frame * 9}deg)`, marginRight: Math.round(w * 0.008), verticalAlign: 'middle' } }) : null;
  const thinking = spinner ? React.createElement('div', { style: { fontFamily: D.font_mono, fontSize: fs, color: D.amber, marginTop: Math.round(h * 0.01), display: 'flex', alignItems: 'center' } }, spin, 'Thinking…') : null;
  // prompt box (rounded) + context-left status line
  const promptBox = prompt !== undefined ? React.createElement('div', { style: { border: `${bd}px solid ${D.text_dim}`, borderRadius: Math.round(w * 0.006), padding: `${Math.round(h * 0.018)}px ${pad}px`, fontFamily: D.font_mono, fontSize: Math.round(w * 0.02), color: D.text } },
    React.createElement('span', { style: { color: D.text_dim } }, '> '), prompt, (frame % 30 < 15 ? React.createElement('span', { style: { color: D.cyan } }, '▋') : null)) : null;
  const status = React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: pad, marginTop: Math.round(h * 0.014), fontFamily: D.font_mono, fontSize: Math.round(w * 0.0115), color: D.text_dim } },
    React.createElement('span', { style: { color: D.amber } }, '✦ ' + model),
    React.createElement('span', {}, 'context left'),
    React.createElement('div', { style: { position: 'relative', width: Math.round(w * 0.16), height: Math.round(h * 0.01), borderRadius: Math.round(h * 0.005), backgroundColor: D.surface, overflow: 'hidden' } },
      React.createElement('div', { style: { position: 'absolute', left: 0, top: 0, bottom: 0, width: `${cl * 100}%`, backgroundColor: clColor } })),
    React.createElement('span', { style: { color: clColor, fontWeight: 700, fontFamily: D.font_display } }, contextText || `${Math.round(cl * 100)}%`),
    React.createElement('span', { style: { marginLeft: 'auto' } }, '? for shortcuts'));
  // re-read sweep: a cyan band sweeping the transcript top→bottom (Claude re-reading the
  // whole chat). reread 0..1 = how far down; a faint wash above marks "already re-read".
  const rr = (reread === null || reread === undefined) ? null : (() => {
    const p = Math.max(0, Math.min(1, reread as number));
    const band = Math.round(h * 0.035);
    return React.createElement('div', { style: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, pointerEvents: 'none' } },
      React.createElement('div', { style: { position: 'absolute', left: 0, right: 0, top: 0, height: `${p * 100}%`, background: `linear-gradient(to bottom, ${D.cyan}00, ${D.cyan}1f)` } }),
      React.createElement('div', { style: { position: 'absolute', left: 0, right: 0, top: `calc(${p * 100}% - ${band / 2}px)`, height: band, backgroundColor: `${D.cyan}22`, borderTop: `2px solid ${D.cyan}` } }));
  })();
  return React.createElement('div', { style: { position: 'absolute', left: X, top: Y, width: W, height: H, borderRadius: Math.round(w * 0.01), backgroundColor: D.bg, border: `${bd}px solid ${D.surface}`, overflow: 'hidden', opacity: dim, boxShadow: shadow(h, 1.2), padding: pad, boxSizing: 'border-box', display: 'flex', flexDirection: 'column' } },
    header,
    React.createElement('div', { style: { flex: 1, overflow: 'hidden', position: 'relative' } }, ...bodyLines, thinking, rr),
    promptBox, status);
};

// STATUSPANEL — the real Claude Code "/status" screen: a titled panel with labeled bar
// rows (session / weekly usage, plan tiers). A row with used==null is a plain label+note
// (e.g. "Plan  Pro"); otherwise it draws a usage bar (green→amber→red). maxFrac sets the
// bar's total width (for plan-tier capacity comparisons). Hierarchy: label bold, sub dim.
export const StatusPanel: React.FC<{
  title?: string;
  rows?: { label: string; sub?: string; used?: number | null; color?: string; note?: string; maxFrac?: number; ticks?: number }[];
  x?: number; y?: number; w?: number; dim?: number; delay?: number;
}> = ({ title = 'usage — this window', rows = [], x = 0.07, y = 0.09, w: ww = 0.86, dim = 1, delay = 2 }) => {
  const frame = useCurrentFrame();
  const { width: w, height: h, fps } = useVideoConfig();
  const X = Math.round(w * x), Y = Math.round(h * y), W = Math.round(w * ww), Hh = Math.round(h * 0.82);
  const pad = Math.round(w * 0.03), bd = Math.max(2, Math.round(w * 0.0015));
  const barFull = W - pad * 2;
  const node = rows.map((r, i) => {
    const g = spring({ frame: frame - (delay + i * 5), fps, config: { damping: 18, stiffness: 180 } });
    const hasBar = r.used !== null && r.used !== undefined;
    const used = Math.max(0, Math.min(1, (r.used as number) || 0));
    const mf = r.maxFrac == null ? 1 : r.maxFrac;
    const col = r.color || (used > 0.7 ? D.red : used > 0.45 ? D.amber : D.green);
    const barH = Math.round(h * 0.05);
    const tickEls: React.ReactNode[] = [];
    if (hasBar && r.ticks) for (let t = 1; t < r.ticks; t++) tickEls.push(React.createElement('div', { key: t, style: { position: 'absolute', left: `${(t / (r.ticks as number)) * 100}%`, top: 0, bottom: 0, width: 2, backgroundColor: D.bg, opacity: 0.5 } }));
    return React.createElement('div', { key: i, style: { opacity: g, transform: `translateY(${(1 - g) * Math.round(h * 0.02)}px)` } },
      React.createElement('div', { style: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: hasBar ? Math.round(h * 0.018) : 0 } },
        React.createElement('div', {},
          React.createElement('span', { style: { fontFamily: D.font_display, fontWeight: 700, fontSize: Math.round(w * 0.026), color: D.text } }, r.label),
          r.sub ? React.createElement('span', { style: { fontFamily: D.font_mono, fontSize: Math.round(w * 0.0145), color: D.text_dim, marginLeft: pad } }, r.sub) : null),
        r.note ? React.createElement('span', { style: { fontFamily: D.font_display, fontWeight: 700, fontSize: Math.round(w * 0.023), color: hasBar ? col : D.cyan } }, r.note) : null),
      hasBar ? React.createElement('div', { style: { position: 'relative', width: Math.round(barFull * mf), height: barH, borderRadius: Math.round(barH * 0.25), backgroundColor: D.surface, overflow: 'hidden' } },
        React.createElement('div', { style: { position: 'absolute', left: 0, top: 0, bottom: 0, width: `${used * 100}%`, backgroundColor: col } }), ...tickEls) : null);
  });
  return React.createElement('div', { style: { position: 'absolute', left: X, top: Y, width: W, height: Hh, borderRadius: Math.round(w * 0.012), backgroundColor: D.bg, border: `${bd}px solid ${D.surface}`, padding: pad, boxSizing: 'border-box', opacity: dim, boxShadow: shadow(h, 1.2), display: 'flex', flexDirection: 'column' } },
    React.createElement('div', { style: { fontFamily: D.font_mono, fontSize: Math.round(w * 0.016), color: D.amber, letterSpacing: '0.06em' } }, '✦ ' + title),
    React.createElement('div', { style: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-around', paddingTop: Math.round(h * 0.02), paddingBottom: Math.round(h * 0.02) } }, ...node));
};

// ─────────────────────────────────────────────────────────────────────────────
// Gap components (reference-video vocabulary). All data-driven: every label,
// value, count, and state arrives as props from the script's render contract.
// ─────────────────────────────────────────────────────────────────────────────

const stateColor = (state?: string, fallback?: string) => {
  const tok = state ? STATE_TOKEN[state] : undefined;
  return (tok && (D as unknown as Record<string, string>)[tok]) || fallback || D.cyan;
};

// ── fanout tree: ONE parent card → N child cards, connectors draw on ──
export const FanoutTree: React.FC<{
  parent: { label: string; value?: string };
  children: { label: string; value?: string; state?: string }[];
  x?: number; y?: number; w?: number; delay?: number; dim?: number;
}> = ({ parent, children, x = 0.5, y = 0.2, w = 0.72, delay = 6, dim = 1 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const cx = Math.round(W * x);
  const topY = Math.round(H * y);
  const childY = topY + Math.round(H * 0.24);
  const n = Math.max(1, children.length);
  const spanW = Math.round(W * w);
  const cardW = Math.min(Math.round(W * 0.15), Math.round(spanW / n) - Math.round(W * 0.012));
  const pop0 = spring({ frame: frame - delay, fps, config: { damping: 18, stiffness: 190 } });
  const linkP = interpolate(frame, [delay + 8, delay + 26], [0, 1], { ...CLAMP, easing: easeOut });
  const parentW = Math.round(W * 0.16), parentH = Math.round(H * 0.1);
  return (
    <div style={{ opacity: dim }}>
      <svg style={{ position: 'absolute', left: 0, top: 0 }} width={W} height={H}>
        {children.map((_, i) => {
          const tx = cx - spanW / 2 + Math.round((i + 0.5) * (spanW / n));
          const d = `M ${cx} ${topY + parentH} C ${cx} ${topY + parentH + H * 0.08}, ${tx} ${childY - H * 0.08}, ${tx} ${childY}`;
          const evo = evolvePath(linkP, d);
          return <path key={i} d={d} fill="none" stroke={D.green} strokeWidth={Math.max(2, W * 0.0016)} strokeDasharray={evo.strokeDasharray} strokeDashoffset={evo.strokeDashoffset} opacity={0.8} />;
        })}
      </svg>
      <div style={{ position: 'absolute', left: cx - parentW / 2, top: topY, width: parentW, height: parentH, backgroundColor: D.cyan, borderRadius: Math.round(W * 0.008), boxShadow: shadow(H), display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: pop0, transform: `scale(${0.8 + 0.2 * pop0})` }}>
        <span style={{ fontFamily: D.font_display, fontWeight: 700, fontSize: Math.round(W * 0.018), color: D.white }}>{parent.label}</span>
        {parent.value ? <span style={{ fontFamily: D.font_mono, fontSize: Math.round(W * 0.009), color: D.white, opacity: 0.85 }}>{parent.value}</span> : null}
      </div>
      {children.map((c, i) => {
        const tx = cx - spanW / 2 + Math.round((i + 0.5) * (spanW / n));
        const g = spring({ frame: frame - (delay + 14 + i * 3), fps, config: { damping: 19, stiffness: 200 } });
        const accent = stateColor(c.state, D.cyan);
        return (
          <div key={i} style={{ position: 'absolute', left: tx - cardW / 2, top: childY, width: cardW, backgroundColor: D.surface, borderRadius: Math.round(W * 0.007), borderTop: `${Math.max(2, Math.round(H * 0.006))}px solid ${accent}`, boxShadow: shadow(H), padding: Math.round(W * 0.008), opacity: g, transform: `translateY(${Math.round((1 - g) * H * 0.03)}px)` }}>
            <div style={{ fontFamily: D.font_mono, fontSize: Math.round(W * 0.0095), letterSpacing: '0.06em', color: D.text, whiteSpace: 'nowrap', overflow: 'hidden' }}>{c.label}</div>
            {c.value ? <div style={{ fontFamily: D.font_display, fontWeight: 700, fontSize: Math.round(W * 0.014), color: accent, marginTop: Math.round(H * 0.004) }}>{c.value}</div> : null}
          </div>
        );
      })}
    </div>
  );
};

// ── stacked ledger: part-to-whole anatomy, segment heights ∝ value ──
export const StackedLedger: React.FC<{
  segments: { label: string; value: number; color?: string; sub?: string }[];
  unit?: string; x?: number; y?: number; w?: number; h?: number; delay?: number; dim?: number;
}> = ({ segments, unit = '', x = 0.2, y = 0.24, w = 0.34, h = 0.55, delay = 6, dim = 1 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const total = Math.max(1e-9, segments.reduce((s, seg) => s + seg.value, 0));
  const boxH = Math.round(H * h), boxW = Math.round(W * w);
  const left = Math.round(W * x), top = Math.round(H * y);
  const gap = Math.max(2, Math.round(H * 0.006));
  const palette = [D.cyan, D.violet, D.amber, D.cyan, D.green, D.red];
  let acc = 0;
  return (
    <div style={{ position: 'absolute', left, top, opacity: dim }}>
      {segments.map((seg, i) => {
        const segH = Math.max(Math.round(H * 0.03), Math.round((boxH - gap * (segments.length - 1)) * (seg.value / total)));
        const myTop = acc; acc += segH + gap;
        const g = interpolate(frame, [delay + i * 5, delay + i * 5 + 16], [0, 1], { ...CLAMP, easing: easeOut });
        const col = seg.color || palette[i % palette.length];
        return (
          <div key={i} style={{ position: 'absolute', left: 0, top: myTop, width: boxW, height: segH, backgroundColor: col, borderRadius: Math.round(W * 0.005), boxShadow: shadow(H, 0.6), transform: `scaleX(${g})`, transformOrigin: 'left center', opacity: g, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: `0 ${Math.round(W * 0.01)}px` }}>
            <span style={{ fontFamily: D.font_mono, fontWeight: 700, fontSize: Math.round(W * 0.011), color: D.white, whiteSpace: 'nowrap' }}>{seg.label}</span>
            {seg.sub && segH > H * 0.06 ? <span style={{ fontFamily: D.font_mono, fontSize: Math.round(W * 0.008), color: D.white, opacity: 0.8 }}>{seg.sub}</span> : null}
            <span style={{ position: 'absolute', right: -Math.round(W * 0.012), transform: 'translateX(100%)', fontFamily: D.font_mono, fontSize: Math.round(W * 0.011), color: D.text_dim, opacity: g }}>{seg.value.toLocaleString()}{unit ? ` ${unit}` : ''}</span>
          </div>
        );
      })}
    </div>
  );
};

// ── meter bar: labeled utilization % with a saturated state ──
export const MeterBar: React.FC<{
  label: string; value: number; max?: number; state?: string; color?: string;
  x?: number; y?: number; w?: number; delay?: number; dim?: number;
}> = ({ label, value, max = 100, state, color, x = 0.15, y = 0.7, w = 0.28, delay = 6, dim = 1 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const frac = Math.min(1, value / Math.max(1e-9, max));
  const saturated = state === 'saturated' || (!state && frac >= 0.9);
  const col = color || (saturated ? D.red : stateColor(state, D.cyan));
  const p = interpolate(frame, [delay, delay + 26], [0, 1], { ...CLAMP, easing: easeOut });
  const left = Math.round(W * x), top = Math.round(H * y), trackW = Math.round(W * w);
  const barH = Math.round(H * 0.02);
  const pulse = saturated ? 0.6 + 0.4 * Math.sin(frame * 0.25) : 1;
  return (
    <div style={{ position: 'absolute', left, top, opacity: dim }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: trackW, marginBottom: Math.round(H * 0.008) }}>
        <span style={{ fontFamily: D.font_mono, fontSize: Math.round(W * 0.01), letterSpacing: '0.1em', color: D.text_dim }}>{label}</span>
        <span style={{ fontFamily: D.font_display, fontWeight: 700, fontSize: Math.round(W * 0.015), color: col }}>{Math.round(value * p)}{max === 100 ? '%' : ''}</span>
      </div>
      <div style={{ width: trackW, height: barH, backgroundColor: D.text_dim, opacity: 0.25, borderRadius: 99, position: 'absolute', top: Math.round(H * 0.032) }} />
      <div style={{ width: Math.round(trackW * frac * p), height: barH, backgroundColor: col, borderRadius: 99, position: 'absolute', top: Math.round(H * 0.032), boxShadow: shadow(H, 0.4) }} />
      {saturated ? <div style={{ position: 'absolute', left: Math.round(trackW * frac * p) - barH / 2, top: Math.round(H * 0.032), width: barH, height: barH, borderRadius: '50%', backgroundColor: D.red, opacity: pulse }} /> : null}
    </div>
  );
};

// ── formula chips: factors pop one-by-one with × between, result lands last ──
export const FormulaChips: React.FC<{
  factors: { label: string; sub?: string; color?: string }[];
  result?: { label: string; sub?: string };
  x?: number; y?: number; delay?: number; dim?: number;
}> = ({ factors, result, x = 0.5, y = 0.42, delay = 6, dim = 1 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const palette = [D.amber, D.cyan, D.cyan, D.red, D.green, D.violet];
  const items: React.ReactNode[] = [];
  factors.forEach((f, i) => {
    const g = spring({ frame: frame - (delay + i * 6), fps, config: { damping: 18, stiffness: 210 } });
    const col = f.color || palette[i % palette.length];
    if (i > 0) items.push(<span key={'x' + i} style={{ fontFamily: D.font_display, fontSize: Math.round(W * 0.018), color: D.text_dim, opacity: g }}>×</span>);
    items.push(
      <span key={'f' + i} style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', backgroundColor: D.surface, border: `${Math.max(1, Math.round(W * 0.0012))}px solid ${col}`, borderRadius: Math.round(W * 0.006), padding: `${Math.round(H * 0.008)}px ${Math.round(W * 0.01)}px`, opacity: g, transform: `translateY(${Math.round((1 - g) * H * 0.02)}px)`, boxShadow: shadow(H, 0.5) }}>
        <span style={{ fontFamily: D.font_display, fontWeight: 700, fontSize: Math.round(W * 0.016), color: col }}>{f.label}</span>
        {f.sub ? <span style={{ fontFamily: D.font_mono, fontSize: Math.round(W * 0.0075), color: D.text_dim }}>{f.sub}</span> : null}
      </span>
    );
  });
  const gr = spring({ frame: frame - (delay + factors.length * 6 + 8), fps, config: { damping: 16, stiffness: 180 } });
  return (
    <div style={{ position: 'absolute', left: 0, top: Math.round(H * y), width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: Math.round(W * 0.012), opacity: dim, transform: `translateX(${Math.round(W * (x - 0.5))}px)` }}>
      {items}
      {result ? (
        <>
          <span style={{ fontFamily: D.font_display, fontSize: Math.round(W * 0.018), color: D.text_dim, opacity: gr }}>=</span>
          <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', backgroundColor: D.amber, borderRadius: Math.round(W * 0.008), padding: `${Math.round(H * 0.012)}px ${Math.round(W * 0.016)}px`, opacity: gr, transform: `scale(${0.7 + 0.3 * gr})`, boxShadow: shadow(H) }}>
            <span style={{ fontFamily: D.font_display, fontWeight: 800, fontSize: Math.round(W * 0.024), color: D.white }}>{result.label}</span>
            {result.sub ? <span style={{ fontFamily: D.font_mono, fontSize: Math.round(W * 0.008), color: D.white, opacity: 0.85 }}>{result.sub}</span> : null}
          </span>
        </>
      ) : null}
    </div>
  );
};

// ── token heatmap: dense dot composition by group + legend ──
export const TokenHeatmap: React.FC<{
  groups: { label: string; count: number; color?: string }[];
  title?: string; cols?: number; x?: number; y?: number; w?: number; delay?: number; dim?: number;
}> = ({ groups, title, cols = 40, x = 0.2, y = 0.26, w = 0.36, delay = 6, dim = 1 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const palette = [D.green, D.cyan, D.amber, D.red, D.violet, D.cyan];
  const totalRaw = Math.max(1, groups.reduce((s, g) => s + g.count, 0));
  const CAP = 1200; // render cap; dots represent proportions above this
  const scale = totalRaw > CAP ? CAP / totalRaw : 1;
  const dots: { color: string }[] = [];
  groups.forEach((g, gi) => {
    const n = Math.max(1, Math.round(g.count * scale));
    for (let i = 0; i < n; i++) dots.push({ color: g.color || palette[gi % palette.length] });
  });
  const boxW = Math.round(W * w);
  const sz = Math.max(3, Math.floor(boxW / cols) - 2);
  const p = interpolate(frame, [delay, delay + 50], [0, 1], { ...CLAMP, easing: easeOut });
  const visible = Math.round(dots.length * p);
  return (
    <div style={{ position: 'absolute', left: Math.round(W * x), top: Math.round(H * y), opacity: dim }}>
      {title ? <div style={{ fontFamily: D.font_display, fontWeight: 700, fontSize: Math.round(W * 0.02), color: D.text, marginBottom: Math.round(H * 0.012) }}>{title}</div> : null}
      <div style={{ display: 'flex', flexWrap: 'wrap', width: boxW, gap: 2, backgroundColor: D.surface, borderRadius: Math.round(W * 0.008), padding: Math.round(W * 0.008), boxShadow: shadow(H) }}>
        {dots.map((d, i) => (
          <div key={i} style={{ width: sz, height: sz, borderRadius: 1, backgroundColor: d.color, opacity: i < visible ? 1 : 0.08 }} />
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: Math.round(H * 0.008), position: 'absolute', left: boxW + Math.round(W * 0.02), top: 0 }}>
        {groups.map((g, gi) => (
          <div key={gi} style={{ display: 'flex', alignItems: 'center', gap: Math.round(W * 0.006), opacity: interpolate(frame, [delay + gi * 4, delay + gi * 4 + 10], [0, 1], CLAMP) }}>
            <div style={{ width: Math.round(W * 0.008), height: Math.round(W * 0.008), borderRadius: 2, backgroundColor: g.color || palette[gi % palette.length] }} />
            <span style={{ fontFamily: D.font_mono, fontSize: Math.round(W * 0.009), color: D.text_dim, whiteSpace: 'nowrap' }}>{g.label} · {g.count.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── curve chart: axes scaffold → path draws on (evolvePath) + refs + mark ──
export const CurveChart: React.FC<{
  points: number[]; refs?: { y: number; label: string }[]; mark?: { i: number; label: string };
  color?: string; x?: number; y?: number; w?: number; h?: number; delay?: number; dim?: number;
}> = ({ points, refs = [], mark, color, x = 0.2, y = 0.28, w = 0.6, h = 0.42, delay = 8, dim = 1 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const left = Math.round(W * x), top = Math.round(H * y);
  const cw = Math.round(W * w), ch = Math.round(H * h);
  const col = color || D.cyan;
  const lo = Math.min(...points), hi = Math.max(...points);
  const span = Math.max(1e-9, hi - lo);
  const px = (i: number) => (i / Math.max(1, points.length - 1)) * cw;
  const py = (v: number) => ch - ((v - lo) / span) * ch;
  const d = points.map((v, i) => `${i === 0 ? 'M' : 'L'} ${px(i).toFixed(1)} ${py(v).toFixed(1)}`).join(' ');
  const drawP = interpolate(frame, [delay + 6, delay + 46], [0, 1], { ...CLAMP, easing: easeOut });
  const evo = evolvePath(drawP, d);
  const sg = interpolate(frame, [delay, delay + 10], [0, 1], CLAMP);
  const markG = mark ? interpolate(frame, [delay + 46, delay + 58], [0, 1], { ...CLAMP, easing: easeOut }) : 0;
  return (
    <div style={{ position: 'absolute', left, top, opacity: dim }}>
      <svg width={cw + Math.round(W * 0.02)} height={ch + Math.round(H * 0.04)} style={{ overflow: 'visible' }}>
        <line x1={0} y1={ch} x2={cw} y2={ch} stroke={D.text_dim} strokeWidth={1.5} opacity={0.4 * sg} />
        <line x1={0} y1={0} x2={0} y2={ch} stroke={D.text_dim} strokeWidth={1.5} opacity={0.4 * sg} />
        {refs.map((r, i) => (
          <g key={i} opacity={0.7 * sg}>
            <line x1={0} y1={py(r.y)} x2={cw} y2={py(r.y)} stroke={D.text_dim} strokeWidth={1} strokeDasharray="6 5" />
            <text x={cw + 6} y={py(r.y) + 4} fontFamily={D.font_mono} fontSize={Math.round(W * 0.009)} fill={D.text_dim}>{r.label}</text>
          </g>
        ))}
        <path d={d} fill="none" stroke={col} strokeWidth={Math.max(2.5, W * 0.0022)} strokeLinecap="round" strokeDasharray={evo.strokeDasharray} strokeDashoffset={evo.strokeDashoffset} />
        {mark ? (
          <g opacity={markG}>
            <circle cx={px(mark.i)} cy={py(points[Math.min(mark.i, points.length - 1)])} r={Math.max(4, W * 0.004)} fill={col} />
            <text x={px(mark.i) + 10} y={py(points[Math.min(mark.i, points.length - 1)]) - 10} fontFamily={D.font_mono} fontWeight={700} fontSize={Math.round(W * 0.011)} fill={D.text}>{mark.label}</text>
          </g>
        ) : null}
      </svg>
    </div>
  );
};

// ── block table: compact row table card with per-row state ticks ──
export const BlockTable: React.FC<{
  title?: string; rows: { label: string; value?: string; state?: string }[];
  x?: number; y?: number; w?: number; delay?: number; dim?: number;
}> = ({ title, rows, x = 0.35, y = 0.55, w = 0.3, delay = 6, dim = 1 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  return (
    <div style={{ position: 'absolute', left: Math.round(W * x), top: Math.round(H * y), width: Math.round(W * w), backgroundColor: D.surface, borderRadius: Math.round(W * 0.008), boxShadow: shadow(H), padding: Math.round(W * 0.008), opacity: dim }}>
      {title ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: `${Math.round(H * 0.006)}px ${Math.round(W * 0.006)}px`, borderBottom: `1px solid ${D.text_dim}`, marginBottom: Math.round(H * 0.004) }}>
          <span style={{ fontFamily: D.font_mono, fontWeight: 700, fontSize: Math.round(W * 0.01), letterSpacing: '0.08em', color: D.text }}>{title}</span>
          <span style={{ fontFamily: D.font_mono, fontSize: Math.round(W * 0.009), color: D.text_dim }}>{rows.length} entries</span>
        </div>
      ) : null}
      {rows.map((r, i) => {
        const g = interpolate(frame, [delay + i * 4, delay + i * 4 + 10], [0, 1], { ...CLAMP, easing: easeOut });
        const col = stateColor(r.state, D.green);
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: Math.round(W * 0.006), padding: `${Math.round(H * 0.005)}px ${Math.round(W * 0.006)}px`, opacity: g, transform: `translateX(${Math.round((1 - g) * W * -0.01)}px)` }}>
            <div style={{ width: Math.round(W * 0.005), height: Math.round(W * 0.005), borderRadius: '50%', backgroundColor: col }} />
            <span style={{ fontFamily: D.font_mono, fontSize: Math.round(W * 0.0095), color: D.text, flex: 1 }}>{r.label}</span>
            {r.value ? <span style={{ fontFamily: D.font_mono, fontSize: Math.round(W * 0.0095), color: D.text_dim }}>{r.value}</span> : null}
          </div>
        );
      })}
    </div>
  );
};

// ── allocation bar: one resource split by an animated divider ──
export const AllocationBar: React.FC<{
  label?: string; left: { label: string; frac: number; color?: string }; right: { label: string; color?: string };
  x?: number; y?: number; w?: number; delay?: number; dim?: number;
}> = ({ label, left, right, x = 0.15, y = 0.45, w = 0.7, delay = 8, dim = 1 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const bx = Math.round(W * x), by = Math.round(H * y), bw = Math.round(W * w);
  const barH = Math.round(H * 0.09);
  const p = interpolate(frame, [delay, delay + 30], [0, 1], { ...CLAMP, easing: easeOut });
  const frac = Math.min(1, Math.max(0, left.frac)) * p + 0.5 * (1 - p); // divider slides from center to target
  const lw = Math.round(bw * frac);
  const lcol = left.color || D.red, rcol = right.color || D.cyan;
  return (
    <div style={{ position: 'absolute', left: bx, top: by, opacity: dim }}>
      {label ? <div style={{ fontFamily: D.font_mono, fontSize: Math.round(W * 0.01), letterSpacing: '0.1em', color: D.text_dim, marginBottom: Math.round(H * 0.01) }}>{label}</div> : null}
      <div style={{ position: 'relative', width: bw, height: barH, borderRadius: Math.round(W * 0.006), overflow: 'hidden', boxShadow: shadow(H) }}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: lw, height: barH, backgroundColor: lcol }} />
        <div style={{ position: 'absolute', left: lw, top: 0, width: bw - lw, height: barH, backgroundColor: rcol }} />
        <div style={{ position: 'absolute', left: lw - 2, top: 0, width: 4, height: barH, backgroundColor: D.white }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: bw, marginTop: Math.round(H * 0.01) }}>
        <span style={{ fontFamily: D.font_mono, fontSize: Math.round(W * 0.01), color: lcol }}>{left.label} · {Math.round(frac * 100)}%</span>
        <span style={{ fontFamily: D.font_mono, fontSize: Math.round(W * 0.01), color: rcol }}>{right.label} · {Math.round((1 - frac) * 100)}%</span>
      </div>
    </div>
  );
};

// ── ladder: vertical hierarchy with an axis (e.g. FAST → SLOW) ──
export const Ladder: React.FC<{
  rungs: { label: string; sub?: string; color?: string; state?: string }[];
  axis?: { top: string; bottom: string };
  x?: number; y?: number; w?: number; delay?: number; dim?: number;
}> = ({ rungs, axis, x = 0.3, y = 0.26, w = 0.34, delay = 6, dim = 1 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const left = Math.round(W * x), top = Math.round(H * y);
  const rungH = Math.round(H * 0.09), gap = Math.round(H * 0.028);
  const palette = [D.red, D.violet, D.amber, D.cyan, D.green];
  const totalH = rungs.length * (rungH + gap) - gap;
  return (
    <div style={{ position: 'absolute', left, top, opacity: dim }}>
      {axis ? (
        <div style={{ position: 'absolute', left: -Math.round(W * 0.05), top: 0, height: totalH, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: D.font_mono, fontSize: Math.round(W * 0.008), letterSpacing: '0.12em', color: D.text_dim }}>{axis.top}</span>
          <div style={{ flex: 1, width: 1.5, backgroundColor: D.text_dim, opacity: 0.35, margin: `${Math.round(H * 0.008)}px 0` }} />
          <span style={{ fontFamily: D.font_mono, fontSize: Math.round(W * 0.008), letterSpacing: '0.12em', color: D.text_dim }}>{axis.bottom}</span>
        </div>
      ) : null}
      {rungs.map((r, i) => {
        const g = spring({ frame: frame - (delay + i * 6), fps, config: { damping: 20, stiffness: 190 } });
        const col = r.color || stateColor(r.state, palette[i % palette.length]);
        return (
          <div key={i} style={{ width: Math.round(W * w), height: rungH, marginBottom: gap, backgroundColor: D.surface, border: `${Math.max(1, Math.round(W * 0.0012))}px solid ${col}`, borderRadius: Math.round(W * 0.007), boxShadow: shadow(H, 0.7), display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `0 ${Math.round(W * 0.012)}px`, opacity: g, transform: `translateY(${Math.round((1 - g) * H * 0.02)}px)` }}>
            <span style={{ fontFamily: D.font_display, fontWeight: 700, fontSize: Math.round(W * 0.014), color: col }}>{r.label}</span>
            {r.sub ? <span style={{ fontFamily: D.font_mono, fontSize: Math.round(W * 0.01), color: D.text_dim }}>{r.sub}</span> : null}
          </div>
        );
      })}
    </div>
  );
};

// ── die: dark processor square, cells light one-by-one up to `active` ──
export const Die: React.FC<{
  rows?: number; cols?: number; active?: number; label?: string; cellColor?: string;
  x?: number; y?: number; w?: number; delay?: number; dim?: number;
}> = ({ rows = 8, cols = 8, active, label, cellColor, x = 0.3, y = 0.3, w = 0.22, delay = 6, dim = 1 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const size = Math.round(W * w);
  const pad = Math.round(size * 0.06);
  const cell = Math.floor((size - pad * 2) / cols) - 2;
  const total = rows * cols;
  const lit = active ?? total;
  const p = interpolate(frame, [delay, delay + 40], [0, 1], { ...CLAMP, easing: easeOut });
  const visLit = Math.round(Math.min(lit, total) * p);
  const ccol = cellColor || D.amber;
  return (
    <div style={{ position: 'absolute', left: Math.round(W * x), top: Math.round(H * y), opacity: dim }}>
      <div style={{ width: size, height: size, backgroundColor: D.text, borderRadius: Math.round(W * 0.012), padding: pad, boxShadow: shadow(H, 1.4), display: 'flex', flexWrap: 'wrap', gap: 2, alignContent: 'flex-start' }}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} style={{ width: cell, height: cell, borderRadius: 1.5, backgroundColor: i < visLit ? ccol : D.bg, opacity: i < visLit ? 1 : 0.25 }} />
        ))}
      </div>
      {label ? <div style={{ marginTop: Math.round(H * 0.012), textAlign: 'center', fontFamily: D.font_mono, fontSize: Math.round(W * 0.009), letterSpacing: '0.1em', color: D.text_dim }}>{label}</div> : null}
    </div>
  );
};

// ── slab stack: vertical stack of slabs that fill (memory / weights / capacity) ──
export const SlabStack: React.FC<{
  slabs: number; filled?: number; label?: string; color?: string;
  x?: number; y?: number; w?: number; h?: number; delay?: number; dim?: number;
}> = ({ slabs, filled, label, color, x = 0.62, y = 0.3, w = 0.1, h = 0.36, delay = 6, dim = 1 }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const boxW = Math.round(W * w), boxH = Math.round(H * h);
  const gap = Math.max(2, Math.round(boxH * 0.02));
  const slabH = Math.floor((boxH - gap * (slabs - 1)) / slabs);
  const nFill = filled ?? slabs;
  const col = color || D.cyan;
  return (
    <div style={{ position: 'absolute', left: Math.round(W * x), top: Math.round(H * y), opacity: dim }}>
      <div style={{ width: boxW + Math.round(W * 0.012), padding: Math.round(W * 0.006), backgroundColor: D.text, borderRadius: Math.round(W * 0.008), boxShadow: shadow(H, 1.2) }}>
        {Array.from({ length: slabs }).map((_, i) => {
          const idx = slabs - 1 - i; // fill bottom-up
          const g = interpolate(frame, [delay + idx * 4, delay + idx * 4 + 12], [0, 1], { ...CLAMP, easing: easeOut });
          const isFilled = idx < nFill;
          return (
            <div key={i} style={{ width: boxW, height: slabH, marginBottom: i < slabs - 1 ? gap : 0, borderRadius: Math.round(W * 0.003), backgroundColor: isFilled ? col : D.bg, opacity: isFilled ? g : 0.3, transform: `scaleX(${isFilled ? g : 1})` }} />
          );
        })}
      </div>
      {label ? <div style={{ marginTop: Math.round(H * 0.012), textAlign: 'center', fontFamily: D.font_mono, fontSize: Math.round(W * 0.009), letterSpacing: '0.1em', color: D.text_dim }}>{label}</div> : null}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════
// ZONES — the overlap-proof layout frame (Remotion has NO layout engine).
// AbsoluteFill is pure `position:absolute` + z-index — it stacks by paint
// order and NEVER reserves space, so two absolutely-placed elements at
// hand-picked canvas fractions overlap silently (the recurring pixel_rag bug:
// a persistent band + a later beat's parser box, placed by independent
// percentages, collide with nothing catching it).
//
// The fix Remotion's own docs point at: use the BROWSER LAYOUT ENGINE.
// `Kit.Zones` is a CSS GRID that partitions the canvas into NAMED, disjoint
// regions; each child is placed into a zone by name. Because the grid gives
// every area its own non-overlapping box, two elements in DIFFERENT zones
// CANNOT overlap — the collision is unrepresentable, not merely unlikely.
// Each `Kit.Zone` is `overflow:hidden` (a stroke / X-glyph / shred particle
// that escapes its region is CLIPPED, not spilled onto a neighbour) and lays
// its OWN children out with FLEX (so SIBLINGS within a zone are spaced by the
// engine, never stacked by hand). `position:absolute` is reserved for TRUE
// overlays only (a floating caption, a badge) — an explicit `Kit.Zone
// name="overlay"` spanning the whole grid, or a `position:absolute` child.
//
//   Kit.Zones({ areas: `"header header"
//                        "stage  rail"
//                        "band   band"`,
//               rows: '12% 1fr 20%', cols: '1fr 34%' }, [
//     Kit.Zone({ name:'header' }, ...),   // title
//     Kit.Zone({ name:'stage'  }, ...),   // the hero / transforming object
//     Kit.Zone({ name:'rail'   }, ...),   // side KPIs
//     Kit.Zone({ name:'band'   }, ...),   // the persistent through-line band
//   ])
//
// CAPTION SAFETY: leave the bottom ~12% out of the grid (end `rows` before the
// canvas bottom) OR give Zones `safeBottom` — nothing is placed in the caption
// band by construction. See vg-code-composition §0.
// ════════════════════════════════════════════════════════════════════════
export const Zones: React.FC<{
  areas: string;            // grid-template-areas, one quoted row per line
  rows?: string;            // grid-template-rows (default: equal rows)
  cols?: string;            // grid-template-columns (default '1fr')
  gap?: number;             // gap between zones, as a fraction of width (default 0.018)
  pad?: number;             // outer padding, as a fraction of width (default 0.045)
  safeBottom?: number;      // reserve the bottom N fraction for captions (default 0.12)
  dim?: number;
  children?: React.ReactNode;
}> = ({ areas, rows, cols = '1fr', gap = 0.018, pad = 0.045, safeBottom = 0.12, dim = 1, children }) => {
  const { width, height } = useVideoConfig();
  const g = Math.round(width * gap);
  const p = Math.round(width * pad);
  return (
    <AbsoluteFill
      style={{
        display: 'grid',
        gridTemplateAreas: areas,
        gridTemplateRows: rows,
        gridTemplateColumns: cols,
        gap: g,
        padding: p,
        // the caption band is carved out of the grid: nothing can be laid into it.
        paddingBottom: Math.round(height * safeBottom),
        boxSizing: 'border-box',
        opacity: dim,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

// A single named region of a Kit.Zones grid. `overflow:hidden` is the escape-
// clip (the durable half of the fix); flex is the sibling-spacer. Content
// inside a zone should size RELATIVE to the zone ('100%', flex) — NOT by canvas
// fraction — so it stays inside its box. `position:absolute` children are
// allowed for a true in-zone overlay (a corner badge) and are clipped to the zone.
export const Zone: React.FC<{
  name: string;                                       // must match a name in the parent `areas`
  align?: React.CSSProperties['alignItems'];          // cross-axis (default 'center')
  justify?: React.CSSProperties['justifyContent'];    // main-axis (default 'center')
  dir?: 'row' | 'column';                             // flex direction (default 'column')
  pad?: number;                                       // inner padding, fraction of width (default 0.012)
  gap?: number;                                       // gap between this zone's children, fraction of width
  clip?: boolean;                                     // overflow hidden (default TRUE — the escape-clip)
  dim?: number;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({ name, align = 'center', justify = 'center', dir = 'column', pad = 0.012, gap, clip = true, dim = 1, style, children }) => {
  const { width } = useVideoConfig();
  return (
    <div
      style={{
        gridArea: name,
        position: 'relative',
        overflow: clip ? 'hidden' : 'visible',
        display: 'flex',
        flexDirection: dir,
        alignItems: align,
        justifyContent: justify,
        padding: Math.round(width * pad),
        gap: gap != null ? Math.round(width * gap) : undefined,
        boxSizing: 'border-box',
        opacity: dim,
        minWidth: 0,   // let flex children shrink instead of overflowing the track
        minHeight: 0,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// Single binding object exposed to bullet code via DynamicBlock.
export const Kit = {
  Zones, Zone,
  DotGrid, Title, Counter, Panel, RefCard, Tag, Chip, BarChart,
  KPI, Pipeline, TokenGrid, Tiers, Slider, CodePanel, Gauge, BigStat, Pool,
  Battery, Stack, ScanSweep, ClaudeOrb, GlassContainer, Checklist, NumberStamp, Terminal, StatusPanel,
  FanoutTree, StackedLedger, MeterBar, FormulaChips, TokenHeatmap, CurveChart,
  LineChart: CurveChart, // alias — skills reference the continuous-axis artifact by either name
  BlockTable, AllocationBar, Ladder, Die, SlabStack,
};
