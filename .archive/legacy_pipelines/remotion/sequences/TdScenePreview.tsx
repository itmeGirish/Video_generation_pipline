import React from 'react';
import { TIMELINES } from '../storyboard/timelines';
import { VideoCaptions, WordTimestamp } from '../components/VideoCaptions';
// NOTE: Audio is intentionally NOT embedded per-scene anymore.
// Continuous narration (vo-trading-full.mp3) is overlaid at the final stitch
// step so the narrator's prosody is unbroken across scene boundaries.
// See storyboard/compile_td_continuous.py and storyboard/stitch_td_continuous.py.
import { TD01_ColdOpen } from './td/TD01_ColdOpen';
import { TD02_PatternInterrupt } from './td/TD02_PatternInterrupt';
import { TD03_TheSetup } from './td/TD03_TheSetup';
import { TD04_PostTradeJournal } from './td/TD04_PostTradeJournal';
import { TD05_NewsTriage } from './td/TD05_NewsTriage';
import { TD06_EarningsCall } from './td/TD06_EarningsCall';
import { TD07_StressTest } from './td/TD07_StressTest';
import { TD08_WhatFailed } from './td/TD08_WhatFailed';
import { TD09_The3Prompts } from './td/TD09_The3Prompts';
import { TD10_Outro } from './td/TD10_Outro';

const TD_SCENE_COMPONENTS: Record<string, React.FC> = {
  td01: TD01_ColdOpen,
  td02: TD02_PatternInterrupt,
  td03: TD03_TheSetup,
  td04: TD04_PostTradeJournal,
  td05: TD05_NewsTriage,
  td06: TD06_EarningsCall,
  td07: TD07_StressTest,
  td08: TD08_WhatFailed,
  td09: TD09_The3Prompts,
  td10: TD10_Outro,
};

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

// PROFESSIONAL ARCHITECTURE: no scene-level transition wrapper.
// Hard cuts at every boundary (intra-scene phase + inter-scene). The continuous
// audio track muxed at stitch step provides the only continuity glue — exactly
// how documentary editors and top YouTube explainers (Ali Abdaal, MKBHD, etc)
// achieve invisible cuts. Adding ANY transition technique (fade/slide/blackout)
// draws the eye to the boundary; hard cut + continuous audio bypasses perception.
export const makeTdScenePreview = (sceneId: string): React.FC => {
  const Component = TD_SCENE_COMPONENTS[sceneId];
  if (!Component) throw new Error(`Unknown td scene: ${sceneId}`);
  const timeline = TIMELINES[sceneId];
  if (!timeline) throw new Error(`No timeline for: ${sceneId}`);
  const words = CAPTIONS_JSON[sceneId] ?? [];
  const Preview: React.FC = () => (
    <div style={{ width: 1920, height: 1080, backgroundColor: '#0F1419', overflow: 'hidden' }}>
      <Component />
      {words.length > 0 && (
        <VideoCaptions wordTimestamps={words} wordsPerGroup={4} accentColor="#22D3EE" />
      )}
    </div>
  );
  Preview.displayName = `td_${sceneId}`;
  return Preview;
};

export const TD_SCENE_IDS = [
  'td01', 'td02', 'td03', 'td04', 'td05',
  'td06', 'td07', 'td08', 'td09', 'td10',
] as const;
