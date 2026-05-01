// Design tokens — auto-generated from project config.yaml at build time.
// DO NOT hardcode values here. The build script writes config_tokens.json
// from the active project's config.yaml.
import tokens from './config_tokens.json';

export type DesignTokens = {
  bg: string; surface: string; text: string; text_dim: string;
  amber: string; cyan: string; violet: string;
  green: string; red: string; white: string;
  font_display: string; font_mono: string;
  spring_damping: number; spring_stiffness: number;
  fade_frames: number; type_speed_cps: number;
  dot_grid_opacity: number; dot_grid_spacing: number;
};

export const D: DesignTokens = tokens as DesignTokens;

// Color name → token resolver (so visual blocks can say color: 'amber' and we look it up)
export const resolveColor = (name?: string): string => {
  if (!name) return D.text;
  const c = (D as unknown as Record<string, string>)[name];
  return c || name; // fallback to literal value if not a token name
};
