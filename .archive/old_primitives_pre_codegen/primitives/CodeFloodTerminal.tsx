import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { D } from '../design';

type PrCounter = { from: number; to: number };
type Props = { files: string[]; pr_counter?: PrCounter };

const CODE_LINES = [
  'export const handler = async (req) => {',
  '  const { user, action } = req.body;',
  '  await db.transaction(async (tx) => {',
  '    return tx.users.update({ where: { id: user } });',
  '  });',
  '  return { ok: true };',
  '};',
  'function compute(x: number, y: number): number {',
  '  return Math.sqrt(x * x + y * y);',
  '}',
  'class Repository<T> {',
  '  constructor(private table: string) {}',
  '  async find(id: string): Promise<T | null> { ... }',
  '}',
];

export const CodeFloodTerminal: React.FC<Props> = ({ files, pr_counter }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const visibleLines = Math.min(CODE_LINES.length * 3, Math.floor(frame / 3));
  const fileIdx = Math.floor((frame / fps) * 2) % Math.max(1, files.length);
  const counterVal = pr_counter
    ? Math.floor(interpolate(frame, [0, durationInFrames - fps], [pr_counter.from, pr_counter.to], { extrapolateRight: 'clamp' }))
    : null;

  return (
    <div style={{
      position: 'absolute', inset: 0, padding: 60,
      display: 'flex', flexDirection: 'column', gap: 16,
    }}>
      <div style={{
        backgroundColor: D.surface, borderRadius: 10, overflow: 'hidden',
        border: `1.5px solid ${D.cyan}55`, height: '100%',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Title bar with file path */}
        <div style={{
          padding: '12px 20px', backgroundColor: D.bg, borderBottom: `1px solid ${D.cyan}33`,
          fontFamily: D.font_mono, fontSize: 14, color: D.text_dim,
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: D.red }} />
          <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: D.amber }} />
          <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: D.green }} />
          <div style={{ flex: 1, color: D.cyan }}>
            {files[fileIdx] || 'src/handler.ts'}
          </div>
          {counterVal !== null && (
            <div style={{ color: D.amber, fontWeight: 700 }}>
              PRs: {counterVal.toLocaleString()}
            </div>
          )}
        </div>
        {/* Code stream */}
        <div style={{
          flex: 1, padding: 24, overflow: 'hidden',
          fontFamily: D.font_mono, fontSize: 18, color: D.text,
          lineHeight: 1.6,
        }}>
          {Array.from({ length: visibleLines }, (_, i) => {
            const line = CODE_LINES[i % CODE_LINES.length];
            const opacity = interpolate(frame, [i * 3, i * 3 + 6], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
            return (
              <div key={i} style={{ opacity, color: i % 5 === 0 ? D.cyan : D.text }}>
                {line}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
