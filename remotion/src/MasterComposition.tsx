import React from 'react';
import { Audio, Composition, Series, staticFile } from 'remotion';
import { TIMELINES } from './storyboard/timelines';
import { makeUniversalScenePreview } from './sequences/UniversalScenePreview';

// MasterComposition — ONE Remotion composition, ONE render (Remotion-native):
//  1. Plays the full TTS mp3 via <Audio> at the master timeline root.
//  2. Composes the LIVE per-scene components (the SAME makeUniversalScenePreview
//     used for each per-scene composition) sequentially via <Series>. The scenes
//     are reusable modular components assembled into one master timeline — there
//     is NO intermediate per-scene mp4 stitch; the final video is a single render
//     of the live scene graph (Remotion's "components → one composition → one render").
//  3. Series guarantees scene N starts at the exact frame where scene N's audio
//     starts → audio timeline == video timeline, frame-perfect by construction.
//
// Why <Series> and NOT <TransitionSeries>: TransitionSeries OVERLAPS adjacent
// scenes by TRANSITION_FRAMES, shortening the video by (N-1)*TRANSITION_FRAMES
// while the audio stays full-length → sync drifts ~12 frames per transition.
// Series has ZERO overlap, so live composition stays sync-safe. (A cross-scene
// transition therefore remains a per-scene Backdrop fade, never a master overlap.)

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
          const Scene = makeUniversalScenePreview(sid);   // the LIVE modular scene component
          return (
            <Series.Sequence key={sid} durationInFrames={tl.durationFrames}>
              <Scene />
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
