import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { D } from '../design';

type Vignette = { title: string; kind: string; icon?: string; body?: object };
type Props = { header?: string; vignettes: Vignette[] };

const renderBody = (kind: string) => {
  if (kind === 'code') {
    return (
      <div style={{ fontFamily: D.font_mono, fontSize: 12, color: D.cyan, lineHeight: 1.5 }}>
        <div>function run() {'{'}</div>
        <div style={{ paddingLeft: 12 }}>const x = await api();</div>
        <div style={{ paddingLeft: 12 }}>return x.map(...);</div>
        <div>{'}'}</div>
      </div>
    );
  }
  if (kind === 'terminal') {
    return (
      <div style={{ fontFamily: D.font_mono, fontSize: 12, color: D.green, lineHeight: 1.5 }}>
        <div>$ npm test</div>
        <div style={{ color: D.text_dim }}>running 247 tests...</div>
        <div style={{ color: D.green }}>✓ all passed</div>
      </div>
    );
  }
  if (kind === 'pr') {
    return (
      <div style={{ fontFamily: D.font_mono, fontSize: 12, color: D.text }}>
        <div style={{ color: D.amber }}>+ feat: add agent loop</div>
        <div style={{ color: D.green }}>✓ ready to merge</div>
        <div style={{ color: D.text_dim, marginTop: 4 }}>3 reviewers approved</div>
      </div>
    );
  }
  return (
    <div style={{ fontFamily: D.font_mono, fontSize: 12, color: D.text_dim }}>
      ─── ─── ───<br />─── ─── ───
    </div>
  );
};

export const MiniUiGrid: React.FC<Props> = ({ header, vignettes }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cols = vignettes.length <= 3 ? vignettes.length : 3;

  return (
    <div style={{
      position: 'absolute', inset: 0, padding: 80,
      display: 'flex', flexDirection: 'column', gap: 24,
    }}>
      {header && (
        <div style={{
          fontFamily: D.font_mono, fontSize: 22, color: D.cyan, letterSpacing: 4,
          textAlign: 'center',
          opacity: interpolate(frame, [0, 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
        }}>
          {header}
        </div>
      )}
      <div style={{
        display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: 20, flex: 1,
      }}>
        {vignettes.map((v, i) => {
          const start = 8 + i * 6;
          const p = spring({ frame: frame - start, fps, config: { damping: 13, stiffness: 200 } });
          return (
            <div key={i} style={{
              backgroundColor: D.surface, border: `1.5px solid ${D.cyan}55`, borderRadius: 10,
              padding: 18, transform: `scale(${p})`, opacity: p,
              boxShadow: `0 0 14px ${D.cyan}22`,
              display: 'flex', flexDirection: 'column', gap: 12,
            }}>
              <div style={{
                fontFamily: D.font_display, fontSize: 18, color: D.text, fontWeight: 700,
                borderBottom: `1px solid ${D.text_dim}33`, paddingBottom: 8,
              }}>
                {v.title}
              </div>
              <div style={{ flex: 1 }}>{renderBody(v.kind)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
