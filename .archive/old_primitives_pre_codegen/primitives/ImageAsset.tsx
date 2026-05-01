import React from 'react';
import { Img, staticFile, interpolate, useCurrentFrame, useVideoConfig, spring } from 'remotion';
import { D } from '../design';

type Props = {
  src: string;            // filename relative to project's public dir (e.g. "logo.png")
  caption?: string;       // optional label under the image
  scale?: number;         // 0..1 of frame width (default 0.5)
  entrance?: 'fade' | 'pop' | 'slide';  // entrance animation (default 'pop')
};

export const ImageAsset: React.FC<Props> = ({
  src, caption, scale = 0.5, entrance = 'pop',
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const targetW = width * Math.min(0.95, Math.max(0.1, scale));

  let opacity = 1;
  let scaleNow = 1;
  let yOffset = 0;
  if (entrance === 'fade') {
    opacity = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: 'clamp' });
  } else if (entrance === 'slide') {
    opacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: 'clamp' });
    yOffset = interpolate(frame, [0, 24], [60, 0], { extrapolateRight: 'clamp' });
  } else {
    // pop: spring scale-in
    scaleNow = spring({
      frame, fps,
      config: { damping: D.spring_damping, stiffness: D.spring_stiffness },
    });
    opacity = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: 'clamp' });
  }

  // Subtle ambient breathing after entrance (1 cycle per second, fps-independent)
  const breathe = 1 + Math.sin(frame / fps) * 0.012;

  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28,
    }}>
      <Img
        src={staticFile(src)}
        style={{
          maxWidth: targetW,
          maxHeight: height * 0.7,
          opacity,
          transform: `translateY(${yOffset}px) scale(${scaleNow * breathe})`,
          filter: `drop-shadow(0 0 ${30 + Math.sin(frame / 24) * 8}px ${D.cyan}55)`,
          objectFit: 'contain',
        }}
      />
      {caption && (
        <div style={{
          fontFamily: D.font_display,
          fontSize: 32, fontWeight: 600, color: D.text,
          opacity, letterSpacing: 0.5, textAlign: 'center',
          maxWidth: width - 240,
        }}>
          {caption}
        </div>
      )}
    </div>
  );
};
