import React from 'react';
import { Audio, Sequence, staticFile } from 'remotion';
import { getSceneDurationFrames } from '../utils/audioSync';
import { HE01_HorseNoHarness } from './harness2/HE01_HorseNoHarness';
import { HE02_AgentFormula } from './harness2/HE02_AgentFormula';
import { HE03_GuidesSensors } from './harness2/HE03_GuidesSensors';
import { HE04_MillionLines } from './harness2/HE04_MillionLines';
import { HE05_SameModel } from './harness2/HE05_SameModel';
import { HE06_NewJob } from './harness2/HE06_NewJob';
import { HE07_ShiftOfDecade } from './harness2/HE07_ShiftOfDecade';

/**
 * "The Rise of Harness Engineering in AI" — the horse/harness angle.
 * All timings derive from Edge TTS + Whisper word timestamps.
 */
const scenes = [
  { key: 'he01', Component: HE01_HorseNoHarness },
  { key: 'he02', Component: HE02_AgentFormula },
  { key: 'he03', Component: HE03_GuidesSensors },
  { key: 'he04', Component: HE04_MillionLines },
  { key: 'he05', Component: HE05_SameModel },
  { key: 'he06', Component: HE06_NewJob },
  { key: 'he07', Component: HE07_ShiftOfDecade },
] as const;

export const HarnessEngineeringFilm: React.FC = () => {
  let cursor = 0;
  return (
    <div style={{ width: 1920, height: 1080, backgroundColor: '#0A1628' }}>
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

export const HARNESS2_TOTAL_FRAMES = scenes.reduce(
  (acc, s) => acc + getSceneDurationFrames(s.key),
  0,
);
