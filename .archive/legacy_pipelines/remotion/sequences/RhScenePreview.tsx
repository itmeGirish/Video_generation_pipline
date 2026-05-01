import React from 'react';
import { Audio, staticFile } from 'remotion';
import { TIMELINES } from '../storyboard/timelines';
import { VideoCaptions, WordTimestamp } from '../components/VideoCaptions';
import { RH01_ColdOpen } from './rh/RH01_ColdOpen';
import { RH02_Title } from './rh/RH02_Title';
import { RH03_RealQuestion } from './rh/RH03_RealQuestion';
import { RH04_Definition } from './rh/RH04_Definition';
import { RH05_FiveParts } from './rh/RH05_FiveParts';
import { RH06_LiveDemo } from './rh/RH06_LiveDemo';
import { RH07_Tradeoffs } from './rh/RH07_Tradeoffs';
import { RH08_ThreeLevels } from './rh/RH08_ThreeLevels';
import { RH09_Reframe } from './rh/RH09_Reframe';
import { RH10_CTA } from './rh/RH10_CTA';
import { RH11_LoopbackCloser } from './rh/RH11_LoopbackCloser';
import { RH12_EndCard } from './rh/RH12_EndCard';

const RH_SCENE_COMPONENTS: Record<string, React.FC> = {
  rh01: RH01_ColdOpen,
  rh02: RH02_Title,
  rh03: RH03_RealQuestion,
  rh04: RH04_Definition,
  rh05: RH05_FiveParts,
  rh06: RH06_LiveDemo,
  rh07: RH07_Tradeoffs,
  rh08: RH08_ThreeLevels,
  rh09: RH09_Reframe,
  rh10: RH10_CTA,
  rh11: RH11_LoopbackCloser,
  rh12: RH12_EndCard,
};

// Lazy-load captions from public/captions at module init (bundler includes them as static files)
const CAPTIONS_JSON: Record<string, WordTimestamp[]> = (() => {
  const map: Record<string, WordTimestamp[]> = {};
  try {
    const ctx = (require as any).context('../../public/captions', false, /\.json$/);
    ctx.keys().forEach((k: string) => {
      const id = k.replace('./', '').replace('.json', '');
      map[id] = ctx(k);
    });
  } catch {
    // Fallback: no captions available
  }
  return map;
})();

export const makeRhScenePreview = (sceneId: string): React.FC => {
  const Component = RH_SCENE_COMPONENTS[sceneId];
  if (!Component) throw new Error(`Unknown rh scene: ${sceneId}`);
  const timeline = TIMELINES[sceneId];
  if (!timeline) throw new Error(`No timeline for: ${sceneId}`);
  const words = CAPTIONS_JSON[sceneId] ?? [];
  const Preview: React.FC = () => (
    <div style={{ width: 1920, height: 1080, backgroundColor: '#0A0A0F', overflow: 'hidden' }}>
      <Audio src={staticFile(`audio/${timeline.audioFile}`)} volume={1} />
      <Component />
      {words.length > 0 && <VideoCaptions wordTimestamps={words} wordsPerGroup={4} accentColor="#00E5FF" />}
    </div>
  );
  Preview.displayName = `rh_${sceneId}`;
  return Preview;
};

export const RH_SCENE_IDS = [
  'rh01', 'rh02', 'rh03', 'rh04', 'rh05', 'rh06',
  'rh07', 'rh08', 'rh09', 'rh10', 'rh11', 'rh12',
] as const;
