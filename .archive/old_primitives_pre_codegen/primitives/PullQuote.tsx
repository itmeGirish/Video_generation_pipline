import React from 'react';
import { spring, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { fillTextBox } from '@remotion/layout-utils';
import { D, resolveColor } from '../design';

type Props = { quote: string; attribution?: string; color?: string };

export const PullQuote: React.FC<Props> = ({ quote, attribution, color }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const c = resolveColor(color || 'amber');
  const p = spring({ frame, fps, config: { damping: 30, stiffness: 120 } });
  const attribOpacity = interpolate(frame, [20, 40], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Auto-shrink quote text if it would overflow box. Try sizes from 52 → 28
  // until fillTextBox accepts the full quote within 4 lines.
  const maxBoxWidth = width - 280;
  let quoteFontSize = 52;
  for (const candidate of [52, 44, 38, 32, 28]) {
    const box = fillTextBox({ maxBoxWidth, maxLines: 4 });
    let exceeds = false;
    for (const word of quote.split(/\s+/)) {
      const r = box.add({ text: word + ' ', fontFamily: D.font_display, fontSize: candidate, fontWeight: '700' });
      if (r.exceedsBox) { exceeds = true; break; }
    }
    if (!exceeds) { quoteFontSize = candidate; break; }
    quoteFontSize = candidate;  // last attempted
  }

  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '0 140px',
    }}>
      <div style={{
        fontFamily: D.font_mono, fontSize: 64, color: c, opacity: 0.4,
        lineHeight: 1, marginBottom: 8, transform: `translateY(${(1 - p) * -20}px)`,
      }}>"</div>
      <div style={{
        fontFamily: D.font_display, fontSize: quoteFontSize, fontWeight: 700,
        color: D.text, textAlign: 'center', lineHeight: 1.35,
        opacity: p, transform: `scale(${0.92 + p * 0.08})`,
      }}>
        {quote}
      </div>
      <div style={{
        fontFamily: D.font_mono, fontSize: 64, color: c, opacity: 0.4,
        lineHeight: 1, marginTop: 8, transform: `translateY(${(1 - p) * 20}px)`,
      }}>"</div>
      {attribution && (
        <div style={{
          fontFamily: D.font_mono, fontSize: 18, color: D.text_dim,
          marginTop: 28, opacity: attribOpacity, letterSpacing: 2,
        }}>
          — {attribution}
        </div>
      )}
    </div>
  );
};
