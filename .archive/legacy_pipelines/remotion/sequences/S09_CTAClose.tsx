import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from 'remotion';
import { findWordFrame, getSceneDurationFrames } from '../utils/audioSync';

const MONO = 'JetBrains Mono, monospace';
const c = {
  bg: '#060A12', card: '#0C1220', cyan: '#00F0FF', purple: '#7C5CFC',
  red: '#FF3B5C', mythos: '#CC0000', green: '#00FF88', amber: '#FFB800',
  white: '#E8F4FF', dimWhite: '#4A5568',
};

const CHARS_PER_FRAME = 2;

const ORIGINAL_LINES = [
  { text: '> SCANNING: /usr/src/sys/rpc/svc_rpcsec_gss.c...', color: c.cyan },
  { text: '> VULNERABILITY FOUND: CVE-2026-4747', color: c.amber },
  { text: '> SEVERITY: CRITICAL — Remote Root Access', color: c.red },
  { text: '> EXPLOIT: COMPILED ✓', color: c.red },
  { text: '> HUMAN INVOLVEMENT: NONE', color: c.mythos, glow: '0 0 25px #CC0000, 0 0 50px #CC000066', weight: 800, spacing: 3 },
];

const NEW_LINE_TEXTS = [
  { text: '> MODEL: CLAUDE MYTHOS PREVIEW', color: c.dimWhite, phrase: "That's the world" },
  { text: '> STATUS: RESTRICTED — PROJECT GLASSWING', color: c.mythos, phrase: 'Subscribe' },
  { text: '> AVAILABLE ALTERNATIVE: CLAUDE OPUS 4.7', color: c.purple, phrase: 'understand what happens' },
  { text: '> STATUS: LIVE ✓', color: c.green, phrase: 'Drop a comment' },
];

export const S09_CTAClose: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cursorVisible = Math.floor(frame / 15) % 2 === 0;
  const totalFrames = getSceneDurationFrames('s09');

  const NEW_LINES = NEW_LINE_TEXTS.map((l, i) => ({
    ...l,
    start: findWordFrame('s09', l.phrase, Math.round((i + 1) * 100)),
  }));

  const subscribeText = 'SUBSCRIBE';
  const subStart = findWordFrame('s09', 'see you', Math.round(totalFrames * 0.75));
  const endCardFrame = subStart + 120;
  const endCardOpacity = spring({ frame: frame - endCardFrame, fps, config: { damping: 14 } });
  const fadeOut = interpolate(frame, [totalFrames - 20, totalFrames - 1], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <div style={{
      width: 1920, height: 1080, backgroundColor: '#000',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      opacity: fadeOut,
    }}>
      {/* Terminal Window — same style as Scene 1 */}
      <div style={{
        width: 1400, backgroundColor: 'rgba(6, 10, 18, 0.95)', borderRadius: 16,
        border: '1px solid rgba(0, 240, 255, 0.2)', boxShadow: '0 0 80px rgba(0, 240, 255, 0.08)',
        overflow: 'hidden',
      }}>
        {/* Title Bar */}
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

        {/* Content */}
        <div style={{ padding: '24px 28px' }}>
          {/* Original lines — fully shown */}
          {ORIGINAL_LINES.map((line, i) => (
            <div key={i} style={{
              fontSize: 28, fontFamily: MONO, color: line.color,
              fontWeight: (line as any).weight || 400,
              letterSpacing: (line as any).spacing || 0,
              textShadow: (line as any).glow || 'none',
              marginBottom: 12, whiteSpace: 'pre',
            }}>
              {line.text}
            </div>
          ))}

          {/* New lines — type on */}
          {NEW_LINES.map((line, i) => {
            const relFrame = frame - line.start;
            if (relFrame < 0) return null;
            const charsShown = Math.min(Math.floor(relFrame * CHARS_PER_FRAME), line.text.length);
            const isTyping = charsShown < line.text.length;
            const displayText = line.text.substring(0, charsShown);

            return (
              <div key={`new-${i}`} style={{
                fontSize: 28, fontFamily: MONO, color: line.color,
                marginBottom: 12, whiteSpace: 'pre',
              }}>
                {displayText}
                {isTyping && cursorVisible && <span style={{ opacity: 0.8 }}>▊</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Subscribe button */}
      {frame > subStart && (
        <div style={{ display: 'flex', gap: 4, marginTop: 40 }}>
          {subscribeText.split('').map((char, i) => {
            const charScale = spring({ frame: frame - subStart - i * 10, fps, config: { damping: 10 } });
            return (
              <div key={i} style={{
                fontFamily: MONO, fontSize: 36, fontWeight: 800,
                color: c.cyan, transform: `scale(${charScale})`,
                border: `2px solid ${c.cyan}44`, borderRadius: 6,
                width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: `${c.cyan}0A`,
              }}>
                {char}
              </div>
            );
          })}
        </div>
      )}

      {/* End card placeholders */}
      {frame > endCardFrame && (
        <div style={{ display: 'flex', gap: 30, marginTop: 40, opacity: endCardOpacity }}>
          {[0, 1].map((i) => (
            <div key={i} style={{
              width: 640, height: 360, borderRadius: 12,
              backgroundColor: c.card, border: `1px solid ${c.dimWhite}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ fontFamily: MONO, fontSize: 18, color: c.dimWhite }}>NEXT VIDEO</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
