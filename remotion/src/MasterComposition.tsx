import React from 'react';
import { Audio, Composition, Series, Video, staticFile } from 'remotion';
import { TIMELINES } from './storyboard/timelines';

// MasterComposition — single Remotion composition that:
//  1. Plays the full TTS mp3 via <Audio> at the master timeline root
//  2. Plays per-scene mp4s sequentially via <Series> — NO overlap, NO frame stealing.
//     Series guarantees: scene N video starts at the exact frame where scene N audio starts.
//     Audio timeline = Video timeline = frame-perfect sync by construction.
//  3. Single render → audio + visuals always frame-accurately aligned.
//     NO ffmpeg stitch step. NO TransitionSeries overlap drift.
//
// Why NOT TransitionSeries: TransitionSeries overlaps adjacent scenes by
// TRANSITION_FRAMES. This shortens the master video by (N-1)*TRANSITION_FRAMES
// while the audio remains full-length → sync drifts 12 frames per transition,
// last N*12 frames of audio have no matching video. Series has zero overlap.

// process.env.PROJECT and process.env.MASTER_AUDIO_FILE are inlined at bundle
// time by render_master.mjs (webpack.DefinePlugin).
const PROJECT = (process.env.PROJECT || '').replace(/[_]/g, '-');
const AUDIO_FILE = process.env.MASTER_AUDIO_FILE || '';

// Optional MASTER_SCENES env (comma-separated) filters to a subset.
// Correct ONLY when the filtered scenes start at the script's beginning (s01, s01+s02, etc.)
// because the audio always plays from t=0.
const _allSorted = Object.keys(TIMELINES).sort();
const _sceneFilter = (process.env.MASTER_SCENES || '').trim();
const SCENE_IDS = _sceneFilter
  ? _sceneFilter.split(',').map((s: string) => s.trim()).filter((s: string) => TIMELINES[s])
  : _allSorted;

// Total master duration = exact sum of scene durations.
// No subtraction — Series has no overlap so video duration == audio duration.
function computeMasterDurationFrames(): number {
  return SCENE_IDS.reduce((acc: number, id: string) => acc + TIMELINES[id].durationFrames, 0);
}

const MasterRoot: React.FC = () => {
  return (
    <>
      {AUDIO_FILE && (
        <Audio src={staticFile(AUDIO_FILE)} />
      )}
      <Series>
        {SCENE_IDS.map((sid: string) => {
          const tl = TIMELINES[sid];
          return (
            <Series.Sequence key={sid} durationInFrames={tl.durationFrames}>
              <Video
                src={staticFile(`out/${sid}.mp4`)}
                startFrom={0}
                endAt={tl.durationFrames}
              />
            </Series.Sequence>
          );
        })}
      </Series>
    </>
  );
};

export const registerMasterComposition = (): React.ReactElement => {
  const fps = Number(process.env.VIDEO_FPS) || 30;
  const width = Number(process.env.VIDEO_WIDTH) || 1920;
  const height = Number(process.env.VIDEO_HEIGHT) || 1080;
  const masterId = `${PROJECT}-master` || 'project-master';
  const totalFrames = computeMasterDurationFrames();
  if (totalFrames <= 0) return <></>;
  return (
    <Composition
      id={masterId}
      component={MasterRoot}
      durationInFrames={totalFrames}
      fps={fps}
      width={width}
      height={height}
      defaultProps={{}}
    />
  );
};
