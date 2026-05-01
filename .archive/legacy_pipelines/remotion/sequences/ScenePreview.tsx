import React from 'react';
import { TIMELINES } from '../storyboard/timelines';
import { VideoCaptions, WordTimestamp } from '../components/VideoCaptions';
import { HF01_MillionLines } from './harness3/HF01_MillionLines';
import { HF02_Horse } from './harness3/HF02_Horse';
import { HF03_TwoHalves } from './harness3/HF03_TwoHalves';
import { HF04_Experiment } from './harness3/HF04_Experiment';
import { HF05_RankJump } from './harness3/HF05_RankJump';
import { HF06_YourJob } from './harness3/HF06_YourJob';
import { HF07_MondayChecklist } from './harness3/HF07_MondayChecklist';
// PROFESSIONAL ARCHITECTURE (matches TdScenePreview): no embedded audio,
// no fade wrapper. Hard cuts at every boundary; continuous narration
// (vo-harness3-full.mp3) muxed at the final stitch step.

/**
 * Single-scene compositions. Render each independently to avoid Chrome
 * headless memory accumulation over 10k+ frames. ffmpeg concats them.
 *
 *   npx remotion render hf01  → out/hf01.mp4
 *   npx remotion render hf02  → out/hf02.mp4
 *   ...
 *   storyboard/stitch.py      → out/HarnessEngagementFilm.mp4
 */
const SCENE_COMPONENTS: Record<string, React.FC> = {
  hf01: HF01_MillionLines,
  hf02: HF02_Horse,
  hf03: HF03_TwoHalves,
  hf04: HF04_Experiment,
  hf05: HF05_RankJump,
  hf06: HF06_YourJob,
  hf07: HF07_MondayChecklist,
};

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

export const makeScenePreview = (sceneId: string): React.FC => {
  const Component = SCENE_COMPONENTS[sceneId];
  if (!Component) throw new Error(`Unknown scene: ${sceneId}`);
  const timeline = TIMELINES[sceneId];
  if (!timeline) throw new Error(`No timeline for: ${sceneId}`);
  const words = CAPTIONS_JSON[sceneId] ?? [];
  const Scene: React.FC = () => (
    <div style={{ width: 1920, height: 1080, backgroundColor: '#0A1628' }}>
      {/* Audio intentionally omitted — continuous narration muxed at stitch */}
      <Component />
      {words.length > 0 && (
        <VideoCaptions wordTimestamps={words} wordsPerGroup={4} accentColor="#22D3EE" />
      )}
    </div>
  );
  Scene.displayName = `Preview_${sceneId}`;
  return Scene;
};

export const SCENE_IDS = ['hf01', 'hf02', 'hf03', 'hf04', 'hf05', 'hf06', 'hf07'] as const;
