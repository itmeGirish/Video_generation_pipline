import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
} from 'remotion';
import { findWordFrame, getSceneDurationFrames } from '../utils/audioSync';

const MONO = 'JetBrains Mono, monospace';
const c = {
  bg: '#060A12', card: '#0C1220', cyan: '#00F0FF', purple: '#7C5CFC',
  green: '#00FF88', amber: '#FFB800', white: '#E8F4FF', dimWhite: '#4A5568',
};

interface CardData {
  title: string;
  icon: string;
  color: string;
  stats: string[];
  badge: string;
}

const CARDS: CardData[] = [
  {
    title: 'CLAUDE CODE\nPOWER USER',
    icon: '⚡',
    color: c.cyan,
    stats: [
      '✓ Auto-upgraded — no action needed',
      '→ Try xhigh effort on hard problems',
      '→ Run /ultrareview on your codebase',
    ],
    badge: '+12pts CursorBench | +6.8pts SWE-bench',
  },
  {
    title: 'API\nBUILDER',
    icon: '🔗',
    color: c.amber,
    stats: [
      '✓ Same price: $5 / $25 per MTok',
      '✦ NEW: Task budgets (public beta)',
      '⚠ BREAKING: temp, top_p, top_k removed',
    ],
    badge: '77.3% MCP-Atlas (Best in class)',
  },
  {
    title: 'AI-CURIOUS\nPROFESSIONAL',
    icon: '📄',
    color: c.green,
    stats: [
      '✦ 3x vision: reads fine print now',
      '✦ Better slides, docs, interfaces',
      '→ Try document analysis with images',
    ],
    badge: '3.75 MP images | Creative quality ↑',
  },
];

export const S06_WhoShouldCare: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Derived from narration — when "Type one/two/three" is spoken.
  const card1Start = findWordFrame('s06', 'Type one', 0);
  const card2Start = findWordFrame('s06', 'Type two', 800);
  const card3Start = findWordFrame('s06', 'Type three', 1500);
  const allVisibleStart = getSceneDurationFrames('s06') - 400;
  const allVisible = frame > allVisibleStart;

  const cardStarts = [card1Start, card2Start, card3Start];

  // Which card is currently in spotlight
  const spotlightIdx = frame < card2Start ? 0 : frame < card3Start ? 1 : frame < allVisibleStart ? 2 : -1;

  return (
    <div style={{
      width: 1920, height: 1080, backgroundColor: '#000',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: allVisible ? 16 : 0,
    }}>
      {CARDS.map((card, i) => {
        const enterFrame = cardStarts[i];
        if (frame < enterFrame) return null;

        const enterScale = spring({ frame: frame - enterFrame, fps, config: { damping: 15 } });
        const isSpotlight = spotlightIdx === i;
        const isAll = allVisible;

        let scale = 1;
        let opacity = 1;

        if (isAll) {
          scale = 0.75;
          opacity = 1;
        } else if (isSpotlight) {
          scale = interpolate(enterScale, [0, 1], [0.8, 1]);
          opacity = enterScale;
        } else {
          // Not spotlight, not all-visible
          scale = 0.92;
          opacity = 0.45;
        }

        // Subtle pulse when all visible
        const pulseGlow = isAll
          ? interpolate(Math.sin(frame * 0.03 + i * 2), [-1, 1], [0.15, 0.4])
          : isSpotlight ? 0.4 : 0;

        return (
          <div
            key={i}
            style={{
              width: 480, height: 350, borderRadius: 20,
              backgroundColor: c.card,
              border: `2px solid ${isSpotlight || isAll ? card.color : `${card.color}33`}`,
              boxShadow: `0 0 ${40 * pulseGlow}px ${card.color}${Math.floor(pulseGlow * 99).toString().padStart(2, '0')}`,
              background: isSpotlight
                ? `linear-gradient(135deg, ${c.card}, ${card.color}0D)`
                : c.card,
              transform: `scale(${scale})`,
              opacity,
              padding: 30,
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.3s, opacity 0.3s',
            }}
          >
            {/* Icon */}
            <div style={{ fontSize: 64, marginBottom: 12 }}>{card.icon}</div>

            {/* Title */}
            <div style={{
              fontFamily: MONO, fontSize: 20, fontWeight: 800, color: card.color,
              whiteSpace: 'pre-line', lineHeight: 1.3, marginBottom: 16,
            }}>
              {card.title}
            </div>

            {/* Stats */}
            <div style={{ flex: 1 }}>
              {card.stats.map((stat, j) => (
                <div key={j} style={{
                  fontFamily: MONO, fontSize: 14, color: c.white,
                  marginBottom: 8, lineHeight: 1.4,
                }}>
                  {stat}
                </div>
              ))}
            </div>

            {/* Bottom badge */}
            <div style={{
              fontFamily: MONO, fontSize: 12, color: card.color,
              backgroundColor: `${card.color}15`, padding: '6px 12px',
              borderRadius: 8, textAlign: 'center',
            }}>
              {card.badge}
            </div>
          </div>
        );
      })}
    </div>
  );
};
