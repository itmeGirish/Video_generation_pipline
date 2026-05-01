import React from 'react';
import { Audio, Sequence, staticFile } from 'remotion';
import { getSceneDurationFrames } from '../utils/audioSync';
import { H01_DeliveryProblem } from './harness/H01_DeliveryProblem';
import { H02_WhatIs } from './harness/H02_WhatIs';
import { H03_AIAgents } from './harness/H03_AIAgents';
import { H04_BeforeAfter } from './harness/H04_BeforeAfter';
import { H05_Numbers } from './harness/H05_Numbers';
import { H06_DayOnTeam } from './harness/H06_DayOnTeam';
import { H07_WhyMatters } from './harness/H07_WhyMatters';

/**
 * "The Rise of Harness Engineering in AI"
 * 7 scenes, durations auto-derived from generated Edge TTS audio.
 * Every animation cue is triggered by Whisper word timestamps — no hardcoded frames.
 */
const scenes = [
  { key: 'h01', Component: H01_DeliveryProblem },
  { key: 'h02', Component: H02_WhatIs },
  { key: 'h03', Component: H03_AIAgents },
  { key: 'h04', Component: H04_BeforeAfter },
  { key: 'h05', Component: H05_Numbers },
  { key: 'h06', Component: H06_DayOnTeam },
  { key: 'h07', Component: H07_WhyMatters },
] as const;

export const HarnessVideo: React.FC = () => {
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

export const HARNESS_TOTAL_FRAMES = scenes.reduce(
  (acc, s) => acc + getSceneDurationFrames(s.key),
  0,
);
