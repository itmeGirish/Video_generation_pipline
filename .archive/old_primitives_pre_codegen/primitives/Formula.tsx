import React from 'react';
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { D, resolveColor } from '../design';

type Token = { text: string; color?: string };
type Props = { tokens: Token[] };

export const Formula: React.FC<Props> = ({ tokens }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex',
      alignItems: 'center', justifyContent: 'center', gap: 18,
      padding: '0 100px', flexWrap: 'wrap',
    }}>
      {tokens.map((token, i) => {
        const start = i * 6;
        const p = spring({ frame: frame - start, fps, config: { damping: 9, stiffness: 220 } });
        const c = token.color ? resolveColor(token.color) : D.text;
        return (
          <div key={i} style={{
            fontFamily: D.font_display, fontSize: 110, fontWeight: 900, color: c,
            transform: `scale(${p})`, opacity: p,
            textShadow: token.color ? `0 0 40px ${c}88` : 'none',
            letterSpacing: -1,
          }}>
            {token.text}
          </div>
        );
      })}
    </div>
  );
};
