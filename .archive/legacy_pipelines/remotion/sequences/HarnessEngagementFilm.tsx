import React from 'react';
import { Audio, Sequence, staticFile } from 'remotion';
import { getSceneDurationFrames } from '../utils/audioSync';
import { HF01_MillionLines } from './harness3/HF01_MillionLines';
import { HF02_Horse } from './harness3/HF02_Horse';
import { HF03_TwoHalves } from './harness3/HF03_TwoHalves';
import { HF04_Experiment } from './harness3/HF04_Experiment';
import { HF05_RankJump } from './harness3/HF05_RankJump';
import { HF06_YourJob } from './harness3/HF06_YourJob';
import { HF07_MondayChecklist } from './harness3/HF07_MondayChecklist';

/**
 * "The Rise of Harness Engineering in AI" — engagement-optimized cut.
 * Payoff-first cold open, horse metaphor, guides+sensors, OpenAI experiment,
 * rank jump, day-in-life vignettes, Monday checklist close.
 */
const scenes = [
  { key: 'hf01', Component: HF01_MillionLines },
  { key: 'hf02', Component: HF02_Horse },
  { key: 'hf03', Component: HF03_TwoHalves },
  { key: 'hf04', Component: HF04_Experiment },
  { key: 'hf05', Component: HF05_RankJump },
  { key: 'hf06', Component: HF06_YourJob },
  { key: 'hf07', Component: HF07_MondayChecklist },
] as const;

export const HarnessEngagementFilm: React.FC = () => {
  let cursor = 0;
  return (
    <div style={{ width: 1920, height: 1080, backgroundColor: '#0A1628' }}>
      {/* Single concatenated audio at root — avoids race condition in Remotion's asset cache */}
      <Audio src={staticFile('audio/vo-hf-full.mp3')} volume={1} />
      {scenes.map(({ key, Component }) => {
        const duration = getSceneDurationFrames(key);
        const from = cursor;
        cursor += duration;
        return (
          <Sequence key={key} from={from} durationInFrames={duration}>
            <Component />
          </Sequence>
        );
      })}
    </div>
  );
};

export const HARNESS3_TOTAL_FRAMES = scenes.reduce(
  (acc, s) => acc + getSceneDurationFrames(s.key),
  0,
);
