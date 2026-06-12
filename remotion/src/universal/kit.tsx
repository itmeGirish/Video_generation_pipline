// Reusable, data-driven render-kit. The design system + animation lives HERE, once —
// bullet code COMPOSES these by passing DATA, instead of hand-authoring divs per beat.
// All polish (radii, shadows, spacing, type scale, easing, counters, scaffold) is internal.
// Tokens come from ./design (config.yaml). Exposed to bullet code as the `Kit` binding.
import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Easing } from 'remotion';
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
  spinner?: boolean; lineDelay?: number; dim?: number;
}> = ({ cwd = '~/login-app', lines = [], prompt, contextLeft = 1, contextText, model = 'claude-opus-4', spinner = false, lineDelay = 4, dim = 1 }) => {
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
  return React.createElement('div', { style: { position: 'absolute', left: X, top: Y, width: W, height: H, borderRadius: Math.round(w * 0.01), backgroundColor: D.bg, border: `${bd}px solid ${D.surface}`, overflow: 'hidden', opacity: dim, boxShadow: shadow(h, 1.2), padding: pad, boxSizing: 'border-box', display: 'flex', flexDirection: 'column' } },
    header,
    React.createElement('div', { style: { flex: 1, overflow: 'hidden' } }, ...bodyLines, thinking),
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

// Single binding object exposed to bullet code via DynamicBlock.
export const Kit = {
  DotGrid, Title, Counter, Panel, RefCard, Tag, Chip, BarChart,
  KPI, Pipeline, TokenGrid, Tiers, Slider, CodePanel, Gauge, BigStat, Pool,
  Battery, Stack, ScanSweep, ClaudeOrb, GlassContainer, Checklist, NumberStamp, Terminal, StatusPanel,
};
