import React from 'react';
import { Audio, Sequence, staticFile } from 'remotion';
import { getSceneDurationFrames } from '../utils/audioSync';
import { S01_TerminalHack } from './S01_TerminalHack';
import { S02_DoubleReveal } from './S02_DoubleReveal';
import { S03_BenchmarkRace } from './S03_BenchmarkRace';
import { S04_XhighTaskBudgets } from './S04_XhighTaskBudgets';
import { S05_MythosStory } from './S05_MythosStory';
import { S06_WhoShouldCare } from './S06_WhoShouldCare';
import { S07_CompetitiveLandscape } from './S07_CompetitiveLandscape';
import { S08_BiggerQuestion } from './S08_BiggerQuestion';
import { S09_CTAClose } from './S09_CTAClose';

/**
 * Scene lengths and boundaries are DERIVED from audio duration, not hardcoded.
 * Change the narration in build_audio.py → re-run → video auto-adjusts.
 */
const scenes = [
  { key: 's01', Component: S01_TerminalHack },
  { key: 's02', Component: S02_DoubleReveal },
  { key: 's03', Component: S03_BenchmarkRace },
  { key: 's04', Component: S04_XhighTaskBudgets },
  { key: 's05', Component: S05_MythosStory },
  { key: 's06', Component: S06_WhoShouldCare },
  { key: 's07', Component: S07_CompetitiveLandscape },
  { key: 's08', Component: S08_BiggerQuestion },
  { key: 's09', Component: S09_CTAClose },
] as const;

export const Claude47Video: React.FC = () => {
  let cursor = 0;
  return (
    <div style={{ width: 1920, height: 1080, backgroundColor: '#000' }}>
      {scenes.map(({ key, Component }) => {
        const duration = getSceneDurationFrames(key);
        const from = cursor;
        cursor += duration;
        return (
          <Sequence key={key} from={from} durationInFrames={duration}>
            <Audio src={staticFile(`audio/vo-${key}.mp3`)} volume={1} />
            <Component />
          </Sequence>
        );
      })}
    </div>
  );
};

/** Total video duration in frames (sum of all scene audio). */
export const TOTAL_FRAMES = scenes.reduce(
  (acc, s) => acc + getSceneDurationFrames(s.key),
  0,
);
