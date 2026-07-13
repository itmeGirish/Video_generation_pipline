import { Composition, continueRender, delayRender, staticFile } from "remotion";
import { makeUniversalScenePreview } from "./sequences/UniversalScenePreview";
import { TIMELINES } from "./storyboard/timelines";
import { registerMasterComposition } from "./MasterComposition";

// Video dimensions from environment or defaults (match config.yaml)
const VIDEO_WIDTH = Number(process.env.VIDEO_WIDTH) || 1920;
const VIDEO_HEIGHT = Number(process.env.VIDEO_HEIGHT) || 1080;

// Block render until fonts are fully loaded. Without this, the first frames
// can render with fallback fonts and any per-bullet `fitText`/`measureText`
// call (rule 19) returns measurements based on the wrong glyphs — text either
// clips or shrinks unnecessarily. delayRender pauses every Composition until
// continueRender fires, so this gates ALL scenes uniformly.
// Fonts are VENDORED in public/fonts/ and loaded via FontFace from staticFile —
// zero network requests at render time. The previous google-fonts package loaders
// fetched from fonts.gstatic.com on every render; on an unstable connection that
// intermittently failed the headless render (font ERR_CONNECTION_CLOSED / 30s
// delayRender timeout). Local files also mean 'Space Grotesk' (the design token
// font_display) actually renders instead of silently falling back to sans-serif.
const FONT_FILES: Array<[family: string, file: string, weight: string]> = [
  ["Inter", "fonts/Inter-400.woff2", "400"],
  ["Inter", "fonts/Inter-600.woff2", "600"],
  ["Inter", "fonts/Inter-700.woff2", "700"],
  ["JetBrains Mono", "fonts/JetBrainsMono-400.woff2", "400"],
  ["JetBrains Mono", "fonts/JetBrainsMono-700.woff2", "700"],
  ["Space Grotesk", "fonts/SpaceGrotesk-400.woff2", "400"],
  ["Space Grotesk", "fonts/SpaceGrotesk-500.woff2", "500"],
  ["Space Grotesk", "fonts/SpaceGrotesk-700.woff2", "700"],
];
const fontHandle = delayRender("Loading local display + mono fonts");
Promise.all(
  FONT_FILES.map(([family, file, weight]) => {
    const face = new FontFace(family, `url('${staticFile(file)}') format('woff2')`, { weight });
    return face.load().then((loaded) => {
      document.fonts.add(loaded);
    });
  }),
)
  .then(() => continueRender(fontHandle))
  // A font failure must NOT abort the render — continue with whatever loaded
  // (fallback for a frame is far better than a failed scene).
  .catch(() => continueRender(fontHandle));

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
      {/*
        Master composition: composes the LIVE per-scene components + master audio
        in ONE Remotion render via <Series> (zero overlap → sync-safe). Scenes are
        reusable modular components assembled into one master timeline — no
        intermediate per-scene mp4 stitch. See remotion/src/MasterComposition.tsx.
      */}
      {registerMasterComposition()}
    </>
  );
};
