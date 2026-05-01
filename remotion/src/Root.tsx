import { Composition, cancelRender, continueRender, delayRender } from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadJetBrainsMono } from "@remotion/google-fonts/JetBrainsMono";
import { makeUniversalScenePreview } from "./sequences/UniversalScenePreview";
import { TIMELINES } from "./storyboard/timelines";

// Video dimensions from environment or defaults (match config.yaml)
const VIDEO_WIDTH = Number(process.env.VIDEO_WIDTH) || 1920;
const VIDEO_HEIGHT = Number(process.env.VIDEO_HEIGHT) || 1080;

// Block render until fonts are fully loaded. Without this, the first frames
// can render with fallback fonts and any per-bullet `fitText`/`measureText`
// call (rule 19) returns measurements based on the wrong glyphs — text either
// clips or shrinks unnecessarily. delayRender pauses every Composition until
// continueRender fires, so this gates ALL scenes uniformly.
const fontHandle = delayRender("Loading display + mono fonts");
Promise.all([
  loadInter().waitUntilDone(),
  loadJetBrainsMono().waitUntilDone(),
])
  .then(() => continueRender(fontHandle))
  .catch((err) => cancelRender(err));

// Auto-discovered from TIMELINES at module load. timelines.ts is patched by
// build_video.py step 8 with one entry per scene of the active project.
const SCENE_IDS = Object.keys(TIMELINES);

/**
 * Root component — registers one Composition per scene of the active project.
 *
 * The pipeline is single-purpose: structured script → LLM-emitted React code
 * per bullet → DynamicBlock renders at runtime. There are no fixed primitives
 * and no per-scene .tsx files.
 *
 * Scene durations + fps come from TIMELINES (written by build_video.py from
 * config.yaml). Width/height come from env (VIDEO_WIDTH/VIDEO_HEIGHT, also
 * set by build_video.py from config.yaml).
 */
export const RemotionRoot: React.FC = () => {
  return (
    <>
      {SCENE_IDS.map((id) => (
        <Composition
          key={id}
          id={id}
          component={makeUniversalScenePreview(id)}
          durationInFrames={TIMELINES[id].durationFrames}
          fps={TIMELINES[id].fps}
          width={VIDEO_WIDTH}
          height={VIDEO_HEIGHT}
        />
      ))}
    </>
  );
};
