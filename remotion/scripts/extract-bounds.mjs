// Bullet bounds extractor — runs the bullet's React.createElement code in a
// stub environment and walks the resulting React tree to extract every
// position:'absolute' element's box (x, y, w, h) PLUS its kind (text|box),
// opacity, and tree path. Used by storyboard/layout_validator.py to detect
// out-of-bounds, cross-bullet overlap, AND within-bullet text-on-element overlap.
//
// GENERAL (any scene): binds Kit (+ all DynamicBlock bindings) so it never errors
// "X is not defined"; estimates the box of TEXT nodes (from fontSize) and of
// CONTAINER nodes with no explicit height (block-stacks children) so figures and
// labels are detectable — that is what makes label-on-figure overlap catchable.
//
// Usage: node extract-bounds.mjs <code-file> <frame> <duration> <width> <height> <fps>
// Output: {bounds:[{x,y,w,h,kind,opacity,path,role,transformed}, …]} or {error}

import fs from 'node:fs';

const React = {
  createElement: (type, props, ...children) => {
    const flat = children.flat(Infinity).filter((c) => c != null && c !== false);
    return { type, props: props || {}, children: flat };
  },
  Fragment: 'Fragment',
};

const _clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const interpolate = (frame, inR, outR, opts) => {
  const [x0, x1] = inR, [y0, y1] = outR;
  let t = x1 === x0 ? 1 : (frame - x0) / (x1 - x0);
  // honor clamp (the common case in this codebase) so settled values are final
  if (!opts || opts.extrapolateRight !== 'extend') t = Math.min(t, 1);
  if (!opts || opts.extrapolateLeft !== 'extend') t = Math.max(t, 0);
  return y0 + (y1 - y0) * t;
};
const spring = ({ frame = 0, durationInFrames = 30, config }) => {
  // settle quickly; at the settled frame this returns ~1
  const d = (config && config.damping && config.damping > 100) ? 25 : 20;
  return _clamp(frame / d, 0, 1);
};
const _ident = (x) => x;
const Easing = {
  in: _ident, out: _ident, inOut: _ident,
  quad: _ident, sin: _ident, exp: _ident, circle: _ident, cubic: _ident,
  linear: _ident, ease: _ident, bezier: () => _ident,
};
const D = {
  bg: '#0E1116', surface: '#161B22', surface_hi: '#222', text: '#E5E7EB',
  text_dim: '#6B7280', white: '#E5E7EB', cyan: '#22D3EE', violet: '#8B5CF6',
  amber: '#F59E0B', green: '#22C55E', red: '#EF4444', soft_red: '#ff6666',
  border_dim: '#333', font_display: "'Sora', sans-serif", font_mono: "'JetBrains Mono', monospace",
  spring_damping: 18, spring_stiffness: 180, fade_frames: 8, type_speed_cps: 30,
  dot_grid_opacity: 0.05, dot_grid_spacing: 40,
};
const resolveColor = (n) => D[n] || n;
const fitText = ({ fontSize }) => ({ fontSize: fontSize || 16 });
const measureText = ({ text }) => ({ width: (text || '').length * 10, height: 20 });
const fillTextBox = () => ({ lines: [], exceedsBox: false });
const findWord = () => null;
const findWordEnd = () => null;
const captions = [];
const staticFile = (s) => s;
const StubComp = (name) => name;
const AbsoluteFill = StubComp('AbsoluteFill');
const Sequence = StubComp('Sequence');
const Series = StubComp('Series');
const Img = StubComp('Img');
const AnimatedImage = StubComp('AnimatedImage');
const Video = StubComp('Video');
const Audio = StubComp('Audio');
const TransitionSeries = StubComp('TransitionSeries');
const linearTiming = () => null;
const springTiming = () => null;
const fade = () => null;
const slide = () => null;
const wipe = () => null;
// Kit: any property is a stub component (Kit.DotGrid, Kit.Terminal, …). Binding it
// stops "Kit is not defined" so the extractor runs on every scene.
const Kit = new Proxy({}, { get: (_t, k) => StubComp('Kit.' + String(k)) });

let CANVAS_W = 1920, CANVAS_H = 1080;
const num = (v) => (typeof v === 'number' ? v : null);
const isTextNode = (node) => (node.children || []).some((c) => typeof c === 'string' && c.trim().length > 0);
const textOf = (node) => (node.children || []).filter((c) => typeof c === 'string').join(' ').trim();

function fontSizeOf(style) { return num(style.fontSize) || 16; }

// Letter-spacing in px (handles 'Nem' / 'Npx' / number). Labels often set it
// ('0.3em', '0.12em') and it widens the box meaningfully for short strings.
function letterSpacePx(ls, fs) {
  if (ls == null) return 0;
  if (typeof ls === 'number') return ls;
  const s = String(ls).trim();
  if (s.endsWith('em')) return (parseFloat(s) || 0) * fs;
  if (s.endsWith('px')) return parseFloat(s) || 0;
  const n = parseFloat(s); return isNaN(n) ? 0 : n;
}

// Estimate the rendered WIDTH of a single-line absolute text node that has no
// explicit style.width. Without this, short labels ("36 H ✓", "NO DRIFT") get
// NO box emitted and slip past overlap detection (real miss, fable_5_power S4).
// 0.56em avg glyph advance (≈ mono/Sora-bold) + per-gap letter-spacing.
function estTextWidth(node, style) {
  const fs = fontSizeOf(style);
  const t = textOf(node);
  const ls = letterSpacePx(style.letterSpacing, fs);
  const w = t.length * fs * 0.56 + Math.max(0, t.length - 1) * ls;
  return Math.min(CANVAS_W, Math.ceil(w));
}

// Estimate a node's rendered height when style.height is absent (block flow).
function estHeight(node, widthHint, dpt) {
  if (!node || typeof node !== 'object' || dpt > 12) return 0;
  const style = (node.props && node.props.style) || {};
  if (num(style.height) != null) return num(style.height);
  const w = num(style.width) != null ? num(style.width) : (widthHint || CANVAS_W);
  if (isTextNode(node)) {
    const fs = fontSizeOf(style);
    const lh = num(style.lineHeight) || 1.35;
    const lines = Math.max(1, Math.ceil((textOf(node).length * fs * 0.55) / Math.max(1, w)));
    return Math.round(fs * lh * lines);
  }
  // container: stack children block heights + their vertical margins
  let h = 0;
  for (const c of node.children || []) {
    if (!c || typeof c !== 'object') continue;
    const cs = (c.props && c.props.style) || {};
    const mt = num(cs.marginTop) || 0, mb = num(cs.marginBottom) || 0;
    h += mt + estHeight(c, w, dpt + 1) + mb;
  }
  const pad = num(style.padding) || 0;
  return h + pad * 2;
}

function extractBounds(node, parentX = 0, parentY = 0, depth = 0, absDepth = 0, path = '0') {
  const out = [];
  if (!node || typeof node !== 'object') return out;
  const style = (node.props && node.props.style) || {};
  const isAbs = style.position === 'absolute';
  const left = num(style.left), top = num(style.top);
  let nodeX = parentX, nodeY = parentY;
  if (isAbs) {
    if (left != null) nodeX = parentX + left;
    if (top != null) nodeY = parentY + top;
  }
  const hasTransform = typeof style.transform === 'string' && style.transform.length > 0;
  if (isAbs && left != null && top != null) {
    let w = num(style.width);
    if (w == null && style.width === '100%') w = CANVAS_W; // full-width text/blocks
    // absolute TEXT with no explicit width → estimate single-line width so the
    // box is emitted and label-on-label overlap is detectable (S4 NO-DRIFT miss).
    if (w == null && isTextNode(node)) w = estTextWidth(node, style);
    let h = num(style.height);
    if (h == null && w != null) h = estHeight(node, w, 0); // text/container estimate
    if (w != null && h != null && w > 0 && h > 0) {
      out.push({
        x: Math.round(nodeX), y: Math.round(nodeY), w: Math.round(w), h: Math.round(h),
        depth, absDepth, path,
        kind: isTextNode(node) ? 'text' : 'box',
        text: isTextNode(node) ? textOf(node).slice(0, 40) : '',
        role: typeof node.type === 'string' ? node.type : 'comp',
        transformed: hasTransform,
        opacity: num(style.opacity) != null ? num(style.opacity) : 1,
      });
    }
  }
  const newAbsDepth = isAbs ? absDepth + 1 : absDepth;
  let i = 0;
  for (const child of node.children || []) {
    out.push(...extractBounds(child, nodeX, nodeY, depth + 1, newAbsDepth, path + '.' + i));
    i++;
  }
  return out;
}

const argv = process.argv.slice(2);
if (argv.length < 6) { console.log(JSON.stringify({ error: 'usage: extract-bounds.mjs <codeFile> <frame> <duration> <w> <h> <fps>' })); process.exit(0); }
const [codeFile, frameStr, durationStr, widthStr, heightStr, fpsStr] = argv;
const code = fs.readFileSync(codeFile, 'utf-8');
const frame = parseInt(frameStr), durationInFrames = parseInt(durationStr);
const width = parseInt(widthStr), height = parseInt(heightStr), fps = parseInt(fpsStr);
CANVAS_W = width; CANVAS_H = height;

let tree;
try {
  const fn = new Function(
    'React', 'frame', 'fps', 'width', 'height', 'durationInFrames',
    'interpolate', 'spring', 'Easing',
    'AbsoluteFill', 'Sequence', 'Series', 'Img', 'staticFile', 'AnimatedImage',
    'TransitionSeries', 'linearTiming', 'springTiming', 'fade', 'slide', 'wipe',
    'D', 'resolveColor', 'fitText', 'measureText', 'fillTextBox',
    'Video', 'Audio', 'captions', 'findWord', 'findWordEnd', 'Kit',
    code,
  );
  tree = fn(
    React, frame, fps, width, height, durationInFrames,
    interpolate, spring, Easing,
    AbsoluteFill, Sequence, Series, Img, staticFile, AnimatedImage,
    TransitionSeries, linearTiming, springTiming, fade, slide, wipe,
    D, resolveColor, fitText, measureText, fillTextBox,
    Video, Audio, captions, findWord, findWordEnd, Kit,
  );
} catch (err) {
  console.log(JSON.stringify({ error: err.message }));
  process.exit(0);
}

const bounds = extractBounds(tree);
console.log(JSON.stringify({ bounds }));
