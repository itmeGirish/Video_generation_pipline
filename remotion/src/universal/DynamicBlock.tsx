import React, { useMemo } from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring, AbsoluteFill, Sequence, Series, Easing, Img, staticFile } from 'remotion';
import { fitText, measureText } from '@remotion/layout-utils';
import { D, resolveColor } from './design';

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
//   Sequence         — Remotion Sequence
//   Series           — Remotion Series
//   Img              — Remotion <Img> component (preferred over <img> for asset loading)
//   staticFile       — Remotion staticFile(name) → URL for files in projects/<name>/public/
//   fitText          — @remotion/layout-utils: returns { fontSize } for given text+width
//   measureText      — @remotion/layout-utils: returns { width, height } of rendered text
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

type Props = { code: string };

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
  'D',
  'resolveColor',
  'fitText',
  'measureText',
] as const;

export const DynamicBlock: React.FC<Props> = ({ code }) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();

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

  let rendered: React.ReactElement | null;
  try {
    rendered = compiled(
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
      D,
      resolveColor,
      fitText,
      measureText,
    );
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
