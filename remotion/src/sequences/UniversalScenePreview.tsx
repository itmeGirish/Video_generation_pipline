import React from 'react';
import { AbsoluteFill } from 'remotion';
import { TIMELINES } from '../storyboard/timelines';
import { VideoCaptions, WordTimestamp } from '../components/VideoCaptions';
import { UniversalScene, VisualBlock } from '../universal/UniversalScene';
import { D } from '../universal/design';

// Lazy-load captions
const CAPTIONS_JSON: Record<string, WordTimestamp[]> = (() => {
  const map: Record<string, WordTimestamp[]> = {};
  try {
    const ctx = (require as any).context('../../public/captions', false, /\.json$/);
    ctx.keys().forEach((k: string) => {
      const id = k.replace('./', '').replace('.json', '');
      map[id] = ctx(k);
    });
  } catch {}
  return map;
})();

// Lazy-load scene visual blocks (one per scene)
const SCENE_BLOCKS: Record<string, VisualBlock[]> = (() => {
  const map: Record<string, VisualBlock[]> = {};
  try {
    const ctx = (require as any).context('../../public/scenes', false, /\.json$/);
    ctx.keys().forEach((k: string) => {
      const id = k.replace('./', '').replace('.json', '');
      map[id] = ctx(k);
    });
  } catch {}
  return map;
})();

export const makeUniversalScenePreview = (sceneId: string): React.FC => {
  const timeline = TIMELINES[sceneId];
  if (!timeline) throw new Error(`No timeline for: ${sceneId}`);
  const blocks = SCENE_BLOCKS[sceneId] ?? [];
  const words = CAPTIONS_JSON[sceneId] ?? [];
  // Composition dims (width/height/fps) come from Root.tsx, which reads them
  // from VIDEO_WIDTH / VIDEO_HEIGHT env (set by build_video.py from config.yaml).
  // AbsoluteFill picks them up automatically — never hardcode dimensions here.
  const Preview: React.FC = () => (
    <AbsoluteFill style={{ backgroundColor: D.bg, overflow: 'hidden' }}>
      <UniversalScene blocks={blocks} />
      {words.length > 0 && (
        <VideoCaptions wordTimestamps={words} wordsPerGroup={4} accentColor={D.cyan} />
      )}
    </AbsoluteFill>
  );
  Preview.displayName = `universal_${sceneId}`;
  return Preview;
};
