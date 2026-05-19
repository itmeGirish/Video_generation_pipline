// Bullet bounds extractor — runs the bullet's React.createElement code in a
// stub environment and walks the resulting React tree to extract every
// position:'absolute' element's (x, y, w, h). Used by storyboard/layout_validator.py
// to detect out-of-bounds + cross-bullet overlap collisions BEFORE render.
//
// Stubs (must mirror DynamicBlock.tsx bindings):
//   React.createElement returns plain objects {type, props, children} that we walk.
//   interpolate is linear (close enough for static analysis).
//   spring returns frame/durationInFrames clamped to [0, 1].
//   Easing is no-op identity.
//   findWord returns null (caller's bullet should fall back to defaults).
//
// Usage:
//   node extract-bounds.mjs <code-file> <frame> <duration> <width> <height> <fps>
//
// Output (stdout): JSON {bounds: [{x, y, w, h, depth, role}, …]}
//                  or {error: "<message>"}

import fs from 'node:fs';

const React = {
  createElement: (type, props, ...children) => {
    const flat = children.flat(Infinity).filter((c) => c != null && c !== false);
    return { type, props: props || {}, children: flat };
  },
  Fragment: 'Fragment',
};

const interpolate = (frame, [x0, x1], [y0, y1]) => {
  if (frame <= x0) return y0;
  if (frame >= x1) return y1;
  return y0 + ((y1 - y0) * (frame - x0)) / (x1 - x0);
};

const spring = ({ frame, durationInFrames = 30 }) => {
  if (frame <= 0) return 0;
  if (frame >= durationInFrames) return 1;
  return frame / durationInFrames;
};

const _ident = (x) => x;
const Easing = {
  in: _ident, out: _ident, inOut: _ident,
  quad: _ident, sin: _ident, exp: _ident, circle: _ident, cubic: _ident,
  bezier: () => _ident,
};

const D = {
  bg: '#000000', surface: '#111111', surface_hi: '#222222',
  text: '#ffffff', text_dim: '#888888', white: '#ffffff',
  cyan: '#00ffff', violet: '#ff00ff', amber: '#ffaa00',
  green: '#00ff00', red: '#ff0000', soft_red: '#ff6666',
  border_dim: '#333333',
  font_display: "'Inter', sans-serif",
  font_mono: "'JetBrains Mono', monospace",
  spring_damping: 14, spring_stiffness: 180,
  fade_frames: 6, type_speed_cps: 22,
  dot_grid_opacity: 0.04, dot_grid_spacing: 40,
};
const resolveColor = (n) => D[n] || n;

const fitText = ({ text, fontSize }) => ({ fontSize: fontSize || 16 });
const measureText = ({ text }) => ({ width: (text || '').length * 10, height: 20 });
const fillTextBox = () => ({ lines: [], exceedsBox: false });
const findWord = () => null;
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

// Walk the React tree. Track nested 'absolute' positioning.
// Track absolute-positioning depth: depth 0 = outer wrapper, depth 1 = section
// wrapper. Anything DEEPER (= depth >= 2) that's still position:absolute is
// the "inner absolute" violation per rule 19 § 0 — siblings inside a content
// container must use flex/grid.
function extractBounds(node, parentX = 0, parentY = 0, depth = 0, absDepth = 0) {
  const out = [];
  if (!node || typeof node !== 'object') return out;
  const style = (node.props && node.props.style) || {};
  const isAbs = style.position === 'absolute';
  const left = typeof style.left === 'number' ? style.left : null;
  const top = typeof style.top === 'number' ? style.top : null;
  const width = typeof style.width === 'number' ? style.width : null;
  const height = typeof style.height === 'number' ? style.height : null;
  // Track inset:0 absolute fills — they cover the whole canvas
  const insetZero = isAbs && (style.inset === 0 || style.inset === '0' || style.inset === 'inset:0');
  let nodeX = parentX, nodeY = parentY, nodeW = null, nodeH = null;
  if (isAbs) {
    if (left !== null) nodeX = parentX + left;
    if (top !== null) nodeY = parentY + top;
    if (width !== null) nodeW = width;
    if (height !== null) nodeH = height;
  }
  // Treat any element under a `transform` as motion-driven and skip OOB/overlap
  // checks for it — the rendered region depends on transform-origin which we
  // can't compute statically without a full layout engine.
  const hasTransform = typeof style.transform === 'string' && style.transform.length > 0;
  if (isAbs && left !== null && top !== null && width !== null && height !== null) {
    out.push({
      x: Math.round(nodeX), y: Math.round(nodeY),
      w: Math.round(nodeW), h: Math.round(nodeH),
      depth,
      absDepth,
      role: typeof node.type === 'string' ? node.type : 'comp',
      transformed: hasTransform,
      opacity: typeof style.opacity === 'number' ? style.opacity : 1,
    });
  }
  const newAbsDepth = isAbs ? absDepth + 1 : absDepth;
  for (const child of node.children || []) {
    out.push(...extractBounds(child, nodeX, nodeY, depth + 1, newAbsDepth));
  }
  return out;
}

const argv = process.argv.slice(2);
if (argv.length < 6) {
  console.log(JSON.stringify({ error: 'usage: extract-bounds.mjs <codeFile> <frame> <duration> <width> <height> <fps>' }));
  process.exit(0);
}
const [codeFile, frameStr, durationStr, widthStr, heightStr, fpsStr] = argv;
const code = fs.readFileSync(codeFile, 'utf-8');
const frame = parseInt(frameStr);
const durationInFrames = parseInt(durationStr);
const width = parseInt(widthStr);
const height = parseInt(heightStr);
const fps = parseInt(fpsStr);

let tree;
try {
  // eslint-disable-next-line no-new-func
  const fn = new Function(
    'React', 'frame', 'fps', 'width', 'height', 'durationInFrames',
    'interpolate', 'spring', 'Easing',
    'AbsoluteFill', 'Sequence', 'Series', 'Img', 'staticFile', 'AnimatedImage',
    'TransitionSeries', 'linearTiming', 'springTiming', 'fade', 'slide', 'wipe',
    'D', 'resolveColor', 'fitText', 'measureText', 'fillTextBox',
    'Video', 'Audio', 'captions', 'findWord',
    code,
  );
  tree = fn(
    React, frame, fps, width, height, durationInFrames,
    interpolate, spring, Easing,
    AbsoluteFill, Sequence, Series, Img, staticFile, AnimatedImage,
    TransitionSeries, linearTiming, springTiming, fade, slide, wipe,
    D, resolveColor, fitText, measureText, fillTextBox,
    Video, Audio, captions, findWord,
  );
} catch (err) {
  console.log(JSON.stringify({ error: err.message }));
  process.exit(0);
}

const bounds = extractBounds(tree);
console.log(JSON.stringify({ bounds }));
