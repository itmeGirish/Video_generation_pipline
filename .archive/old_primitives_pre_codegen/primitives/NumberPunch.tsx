import React from 'react';
import { spring, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { D, resolveColor } from '../design';

type Item = { value: string; color?: string; big?: boolean; small?: boolean };
type Props = { items: Item[] };

// Each number gets its own time slice. Hard cuts between numbers (like a slot machine).
export const NumberPunch: React.FC<Props> = ({ items }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const sliceFrames = Math.max(1, Math.floor(durationInFrames / items.length));
  const idx = Math.min(items.length - 1, Math.floor(frame / sliceFrames));
  const localFrame = frame - idx * sliceFrames;

  const item = items[idx] ?? items[items.length - 1];
  const c = resolveColor(item.color);
  const p = spring({
    frame: localFrame, fps,
    config: { damping: 9, stiffness: 240 },
  });
  // shake on impact
  const shake = localFrame < 6 ? Math.sin(localFrame * 6) * (6 - localFrame) : 0;
  const fontSize = item.big ? 320 : item.small ? 96 : 220;

  // The "0" number is BIG and red, with a small "humans" right under
  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0,
    }}>
      <div style={{
        fontFamily: D.font_display, fontSize, fontWeight: 900, color: c,
        transform: `scale(${p}) translateX(${shake}px)`,
        textShadow: `0 0 60px ${c}88`,
        lineHeight: 1,
      }}>
        {item.value}
      </div>
      {/* The "humans" label appears ABOVE the next item to reinforce "0 humans" */}
      {item.small && idx > 0 && items[idx - 1].big && (
        <div style={{ marginTop: 0 }}/>
      )}
    </div>
  );
};
