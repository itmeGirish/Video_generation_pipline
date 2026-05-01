import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';
import { findWordFrame } from '../utils/audioSync';

const c = {
  cyan: '#00F0FF', amber: '#FFB800', red: '#FF3B5C',
  mythos: '#CC0000', dimWhite: '#4A5568',
};
const MONO = 'JetBrains Mono, monospace';

// Lines tied to spoken phrases — timing derives from audio.
const LINES = [
  { text: '> SCANNING: /usr/src/sys/rpc/svc_rpcsec_gss.c...', color: c.cyan,   phrase: 'An AI found' },
  { text: '> VULNERABILITY FOUND: CVE-2026-4747',              color: c.amber,  phrase: 'security flaw' },
  { text: '> SEVERITY: CRITICAL — Remote Root Access',          color: c.red,    phrase: 'wrote the exploit' },
  { text: '> EXPLOIT: COMPILED ✓',                              color: c.red,    phrase: 'By itself' },
  {
    text: '> HUMAN INVOLVEMENT: NONE',
    color: c.mythos,
    phrase: 'engineers were sleeping',
    pulse: true,
    glow: '0 0 25px #CC0000, 0 0 50px #CC000066',
    weight: 800,
    spacing: 3,
  },
];

const CHARS_PER_FRAME = 3;

export const S01_TerminalHack: React.FC = () => {
  const frame = useCurrentFrame();
  const cursorVisible = Math.floor(frame / 15) % 2 === 0;

  const lineStarts = LINES.map((l, i) =>
    findWordFrame('s01', l.phrase, Math.round(i * 50)),
  );

  return (
    <div style={{ width: 1920, height: 1080, backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        width: 1400, backgroundColor: 'rgba(6, 10, 18, 0.95)', borderRadius: 16,
        border: '1px solid rgba(0, 240, 255, 0.2)',
        boxShadow: '0 0 80px rgba(0, 240, 255, 0.08)', overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#FF5F57' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#FEBC2E' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#28C840' }} />
          </div>
          <div style={{ flex: 1, textAlign: 'center', color: c.dimWhite, fontSize: 13, fontFamily: MONO }}>
            mythos_preview — autonomous_scan
          </div>
        </div>
        <div style={{ padding: '24px 28px', minHeight: 260 }}>
          {LINES.map((line, i) => {
            const start = lineStarts[i];
            const relFrame = frame - start;
            if (relFrame < 0) return null;

            const totalChars = line.text.length;
            const charsShown = Math.min(Math.floor(relFrame * CHARS_PER_FRAME), totalChars);
            const isTyping = charsShown < totalChars;
            const displayText = line.text.substring(0, charsShown);

            let opacity = 1;
            if (line.pulse && !isTyping) {
              const finishFrame = start + Math.ceil(totalChars / CHARS_PER_FRAME);
              const pulseFrame = frame - finishFrame;
              if (pulseFrame > 0 && pulseFrame < 30) {
                opacity = interpolate(Math.sin((pulseFrame / 10) * Math.PI * 2), [-1, 1], [0.3, 1]);
              }
            }

            const isCurrentlyTyping = isTyping && LINES.slice(i + 1).every((_, j) => frame < lineStarts[i + 1 + j]);

            return (
              <div key={i} style={{
                fontSize: 28, fontFamily: MONO, color: line.color, opacity,
                fontWeight: (line as any).weight || 400,
                letterSpacing: (line as any).spacing || 0,
                textShadow: (!isTyping && (line as any).glow) || 'none',
                marginBottom: 12, whiteSpace: 'pre',
              }}>
                {displayText}
                {isCurrentlyTyping && cursorVisible && <span style={{ opacity: 0.8 }}>▊</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
