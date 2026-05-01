import React from 'react';
import { Audio, staticFile } from 'remotion';
import { TIMELINES } from '../storyboard/timelines';
import { HF07_MondayChecklist } from './harness3/HF07_MondayChecklist';

/**
 * Isolated preview composition for hf07. Same audio + same timeline as in the
 * full film, but renders just this one scene. Use for fast iteration:
 *   npx remotion render HF07_Preview
 * vs rendering the full 8-minute HarnessEngagementFilm.
 */
export const HF07_Preview: React.FC = () => {
  const timeline = TIMELINES.hf07;
  return (
    <div style={{ width: 1920, height: 1080, backgroundColor: '#0A1628' }}>
      <Audio src={staticFile(`audio/${timeline.audioFile}`)} volume={1} />
      <HF07_MondayChecklist />
    </div>
  );
};

export const HF07_PREVIEW_FRAMES = TIMELINES.hf07?.durationFrames ?? 900;
