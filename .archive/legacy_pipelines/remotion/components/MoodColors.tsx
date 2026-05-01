/**
 * MoodColors — Design system for dark-theme YouTube video.
 *
 * ALL sizes designed for VIDEO (not documents):
 * - Text 2-3x larger than web
 * - High contrast white on dark
 * - Bold accent color blocks (not tiny labels)
 * - Frame-filling content
 */

export type MoodName = "primary" | "danger" | "success" | "warning" | "neutral";

export interface MoodColors {
  accent: string;
  cardBorder: string;
  cardBg: string;
}

const MOODS: Record<MoodName, MoodColors> = {
  // ALL moods use SAME neutral borders — only TEXT shows accent color
  // This prevents colored border bleed on dark backgrounds
  primary: {
    accent: "#00AAFF",
    cardBorder: "rgba(255, 255, 255, 0.12)",
    cardBg: "rgba(255, 255, 255, 0.04)",
  },
  danger: {
    accent: "#FF4757",
    cardBorder: "rgba(255, 255, 255, 0.12)",
    cardBg: "rgba(255, 255, 255, 0.04)",
  },
  success: {
    accent: "#00D68F",
    cardBorder: "rgba(255, 255, 255, 0.12)",
    cardBg: "rgba(255, 255, 255, 0.04)",
  },
  warning: {
    accent: "#FFAA00",
    cardBorder: "rgba(255, 255, 255, 0.12)",
    cardBg: "rgba(255, 255, 255, 0.04)",
  },
  neutral: {
    accent: "#8899AA",
    cardBorder: "rgba(255, 255, 255, 0.10)",
    cardBg: "rgba(255, 255, 255, 0.03)",
  },
};

export function getMood(name: string): MoodColors {
  return MOODS[name as MoodName] ?? MOODS.primary;
}

/** Fixed colors — dark theme, high contrast */
export const FIXED = {
  bg: "#0B0B1A",
  text: "#FFFFFF",
  textDim: "#CCCCDD",
  textMuted: "#8888AA",
  surface: "#14142A",
  fontPrimary: "'Inter', 'Outfit', system-ui, sans-serif",
  fontMono: "'JetBrains Mono', 'SF Mono', Consolas, monospace",
};

/**
 * Typography — VIDEO sizes (2-3x larger than web).
 * Designed for 1080p YouTube viewing on phones.
 * Minimum 24px. Hero text 96px.
 */
export const TYPE_SIZES: Record<string, { size: number; weight: number; lineHeight: number }> = {
  hero:     { size: 96, weight: 800, lineHeight: 1.0 },
  h1:       { size: 64, weight: 700, lineHeight: 1.1 },
  h2:       { size: 48, weight: 600, lineHeight: 1.15 },
  h3:       { size: 36, weight: 600, lineHeight: 1.2 },
  body:     { size: 30, weight: 400, lineHeight: 1.4 },
  label:    { size: 24, weight: 600, lineHeight: 1.2 },
  stat:     { size: 80, weight: 800, lineHeight: 1.0 },
  caption:  { size: 24, weight: 400, lineHeight: 1.3 },
  code:     { size: 26, weight: 400, lineHeight: 1.5 },
};

const MIN_FONT = 24;
const MAX_FONT = 120;

export function getTypeStyle(role: string, scale: number): React.CSSProperties {
  const t = TYPE_SIZES[role] ?? TYPE_SIZES.body;
  const clamped = Math.max(MIN_FONT * scale, Math.min(MAX_FONT * scale, t.size * scale));
  return {
    fontSize: clamped,
    fontWeight: t.weight,
    lineHeight: t.lineHeight,
    fontFamily: role === "code" ? FIXED.fontMono : FIXED.fontPrimary,
  };
}

export default MOODS;
