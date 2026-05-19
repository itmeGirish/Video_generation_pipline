import React, { useMemo } from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring, AbsoluteFill, Sequence, Series, Easing, Img, staticFile, AnimatedImage } from 'remotion';
import { Video, Audio } from '@remotion/media';
import { fitText, measureText, fillTextBox } from '@remotion/layout-utils';
import { TransitionSeries, linearTiming, springTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';
import { wipe } from '@remotion/transitions/wipe';
import { D, resolveColor } from './design';
import type { WordTimestamp } from '../components/VideoCaptions';

// LLM-emitted JS function body. Compiled once per `code` string via `new Function`,
// then invoked every frame with the standard render-context args. The LLM is
// instructed to emit React.createElement calls (no JSX — Babel is not available
// at runtime). The function MUST return a single React element.
//
// Available bindings inside the LLM code:
//   React            — React namespace (use React.createElement, React.Fragment)
//   frame            — current frame number (from useCurrentFrame)
//   fps              — frames per second
//   width, height    — video dimensions
//   durationInFrames — total duration of THIS block (Sequence-local)
//   interpolate      — Remotion interpolate
//   spring           — Remotion spring
//   Easing           — Remotion Easing (Easing.in/out/inOut, Easing.bezier, etc.)
//   D                — design tokens object (D.bg, D.cyan, D.amber, ...)
//   resolveColor     — (name) => hex; resolves token names like "amber" → D.amber
//   AbsoluteFill     — Remotion AbsoluteFill
//   Sequence         — Remotion Sequence (supports premountFor, layout, negative from)
//   Series           — Remotion Series (Series.Sequence children, offset for overlaps)
//   Img              — Remotion <Img> — ALWAYS use this, NEVER HTML <img>
//   staticFile       — Remotion staticFile(path) → URL; publicDir=projects/<name>/ so use 'public/file.ext'
//   AnimatedImage    — Remotion AnimatedImage — for GIF/APNG/WebP animated assets
//   TransitionSeries — @remotion/transitions — for multi-step transitions within a bullet
//   linearTiming     — linearTiming({durationInFrames}) — constant-speed transition timing
//   springTiming     — springTiming({config, durationInFrames}) — organic transition timing
//   fade             — fade() — cross-fade transition presentation
//   slide            — slide({direction}) — slide transition ('from-left','from-right','from-top','from-bottom')
//   wipe             — wipe({direction}) — wipe transition presentation
//   fitText          — @remotion/layout-utils: returns { fontSize } for given text+width
//   measureText      — @remotion/layout-utils: returns { width, height } of rendered text
//   fillTextBox      — @remotion/layout-utils: returns { lines, exceedsBox } for overflow detection
//   Video            — @remotion/media <Video> — for mp4/webm clips (blocks frame until loaded)
//   Audio            — @remotion/media <Audio> — for audio playback within a bullet
//   captions         — WordTimestamp[] for THIS scene (Whisper word timings, scene-relative seconds)
//   findWord         — (text, nth?=0) => bullet-relative frame number for the Nth occurrence
//                      of `text` in captions, or null if missing. `text` is tokenized with
//                      [a-z0-9]+ (same as audio_anchor matching). Use this to sync sub-bullet
//                      events (e.g. flash icon when its matching word is spoken).
//
// fitText / measureText rely on the requested font being loaded. Root.tsx
// awaits the project's display + mono fonts before render begins, so these
// helpers are safe to call with D.font_display or D.font_mono. Calling them
// with any OTHER font family will fall back to the browser default and the
// returned dimensions will be wrong.
//
// The LLM code is OUR pipeline output (not user input), so `new Function` is
// not a sandboxing boundary; failures bubble up to the renderer as a clear
// error frame instead of silently breaking the video.

type Props = {
  code: string;
  captions?: WordTimestamp[];     // Whisper word timestamps for THIS scene (full scene)
  blockFramesFrom?: number;       // bullet's framesFrom in scene (so findWord can return BULLET-relative frame)
};

const RUNTIME_KEYS = [
  'React',
  'frame',
  'fps',
  'width',
  'height',
  'durationInFrames',
  'interpolate',
  'spring',
  'Easing',
  'AbsoluteFill',
  'Sequence',
  'Series',
  'Img',
  'staticFile',
  'AnimatedImage',
  'TransitionSeries',
  'linearTiming',
  'springTiming',
  'fade',
  'slide',
  'wipe',
  'D',
  'resolveColor',
  'fitText',
  'measureText',
  'fillTextBox',
  'Video',
  'Audio',
  'captions',
  'findWord',
] as const;

// Same tokenizer as audio_anchor matching (rule 04 contract #2): lowered [a-z0-9]+
const _tokenize = (s: string): string[] => {
  const m = s.toLowerCase().match(/[a-z0-9]+/g);
  return m ?? [];
};

const _wordToken = (w: WordTimestamp): string => {
  const tok = _tokenize(w.word ?? '');
  return tok.length > 0 ? tok[0] : '';
};

const _wordStartSec = (w: WordTimestamp): number =>
  (w.start_seconds ?? w.start ?? 0);

// Scene-relative caption start frame for the Nth occurrence of `text`.
// `text` is tokenized; we match the first run of tokens equal to text's
// tokens. Returns the scene-frame where that match BEGINS, or null if missing.
const _findWordSceneFrame = (
  captions: WordTimestamp[],
  text: string,
  fps: number,
  nth: number,
): number | null => {
  const wantTokens = _tokenize(text);
  if (wantTokens.length === 0) return null;
  let occurrencesSeen = 0;
  for (let i = 0; i + wantTokens.length <= captions.length; i++) {
    let match = true;
    for (let j = 0; j < wantTokens.length; j++) {
      if (_wordToken(captions[i + j]) !== wantTokens[j]) { match = false; break; }
    }
    if (match) {
      if (occurrencesSeen === nth) {
        return Math.round(_wordStartSec(captions[i]) * fps);
      }
      occurrencesSeen++;
    }
  }
  return null;
};

export const DynamicBlock: React.FC<Props> = ({ code, captions, blockFramesFrom }) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const captionsArr = captions ?? [];
  const fromOffset = blockFramesFrom ?? 0;

  // findWord('agents') → frame number RELATIVE to this bullet's start, OR
  // null if the word wasn't transcribed by Whisper. Bullet authors should
  // null-coalesce to a sensible fallback so the visual still works.
  // Tokenization matches audio_anchor exactly (rule 04 contract #2).
  const findWord = (text: string, nth: number = 0): number | null => {
    const sceneFrame = _findWordSceneFrame(captionsArr, text, fps, nth);
    if (sceneFrame === null) return null;
    const bulletFrame = sceneFrame - fromOffset;
    // Negative result = word was spoken BEFORE this bullet started. The
    // sub-event can't fire inside this bullet — return null so authors fall
    // back. Usually this indicates a structured-script bullet-order bug:
    // the bullet should be listed before its anchor's chronological position.
    if (bulletFrame < 0) return null;
    return bulletFrame;
  };

  // Compile once per `code` string. The keys list pins arg order — must match
  // the values array below, in the same order.
  const compiled = useMemo(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
      return new Function(...RUNTIME_KEYS, code) as (
        ...args: unknown[]
      ) => React.ReactElement | null;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return () => (
        <div style={errorStyle}>
          <div style={{ fontWeight: 700 }}>BLOCK COMPILE ERROR</div>
          <div style={{ fontSize: 14, color: D.text_dim, maxWidth: '70%' }}>{msg}</div>
        </div>
      );
    }
  }, [code]);

  // Build the args array in a position-stable map keyed by RUNTIME_KEYS NAMES.
  // The previous version had RUNTIME_KEYS (string array) and the compiled(...)
  // args list maintained as two separate hand-edited lists — a single insert
  // at one site without mirroring it at the other caused silent off-by-one
  // (every arg past the insertion point shifted, so the code's `interpolate`
  // parameter would get the value of `Easing`). Now we keep ONE map keyed
  // by name and build both the key list and the value list from it.
  const runtimeBindings: Record<(typeof RUNTIME_KEYS)[number], unknown> = {
    React,
    frame,
    fps,
    width,
    height,
    durationInFrames,
    interpolate,
    spring,
    Easing,
    AbsoluteFill,
    Sequence,
    Series,
    Img,
    staticFile,
    AnimatedImage,
    TransitionSeries,
    linearTiming,
    springTiming,
    fade,
    slide,
    wipe,
    D,
    resolveColor,
    fitText,
    measureText,
    fillTextBox,
    Video,
    Audio,
    captions: captionsArr,
    findWord,
  };
  const args = RUNTIME_KEYS.map((k) => runtimeBindings[k]);
  // Lockstep guard: TypeScript's index-signature ensures every key has a
  // value, but defensive runtime check catches any future RUNTIME_KEYS add
  // that forgets to mirror in runtimeBindings.
  if (args.length !== RUNTIME_KEYS.length) {
    throw new Error(
      `DynamicBlock RUNTIME_KEYS/args length mismatch: ${RUNTIME_KEYS.length} keys vs ${args.length} args`,
    );
  }

  let rendered: React.ReactElement | null;
  try {
    rendered = compiled(...args);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    rendered = (
      <div style={errorStyle}>
        <div style={{ fontWeight: 700 }}>BLOCK RUNTIME ERROR</div>
        <div style={{ fontSize: 14, color: D.text_dim, maxWidth: '70%' }}>{msg}</div>
      </div>
    );
  }

  return rendered;
};

const errorStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 12,
  background: D.bg,
  color: D.red,
  fontFamily: D.font_mono,
  fontSize: 22,
  textAlign: 'center',
  padding: 40,
};
