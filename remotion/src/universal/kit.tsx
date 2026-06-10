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

// Single binding object exposed to bullet code via DynamicBlock.
export const Kit = {
  DotGrid, Title, Counter, Panel, RefCard, Tag, Chip, BarChart,
  KPI, Pipeline, TokenGrid, Tiers, Slider, CodePanel, Gauge, BigStat,
};
