/**
 * Render the master composition — ONE live render of the per-scene COMPONENTS composed via
 * a plain <Series> (zero overlap, no master fade) + the master audio → a single mp4. The
 * scenes render LIVE (no intermediate per-scene mp4 stitch); this is the Remotion-native
 * "modular components → one master composition → one render" assembly.
 *
 * Master audio must already be in projects/<name>/audio/ (Step 4 produces it).
 * (Per-scene mp4s are NO LONGER required by the master — they remain only for the
 *  per-scene render→verify loop. Scene JSONs in remotion/public/scenes/ feed the live scenes.)
 *
 * Usage:
 *   PROJECT=difference_txt MASTER_AUDIO_FILE=vo-difference_txt-full.mp3 \
 *       VIDEO_FPS=30 VIDEO_WIDTH=1920 VIDEO_HEIGHT=1080 \
 *       node render_master.mjs <output_path>
 */
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import webpack from 'webpack';

const REMOTION_DIR = path.resolve('.');
if (!process.env.PROJECT) {
  console.error('ERROR: PROJECT env var required (e.g. PROJECT=difference_txt).');
  process.exit(1);
}
const PROJECT = process.env.PROJECT;
const projectDir = path.resolve(REMOTION_DIR, `../projects/${PROJECT}`);
const projectScenesDir = path.resolve(projectDir, 'scenes');

// Audio: copy/symlink the project audio into remotion/public/ so staticFile()
// can resolve it. The master composition references staticFile(MASTER_AUDIO_FILE).
// MASTER_AUDIO_FILE is OPTIONAL. When omitted, the master relies on the per-scene
// mp4s' BAKED audio — <Series> concatenates them frame-perfectly, so the full
// narration plays with zero overlay and zero double-audio. Provide it only when the
// scene mp4s are silent and a single continuous TTS track should be overlaid instead.
const audioFileName = process.env.MASTER_AUDIO_FILE || '';
if (audioFileName) {
  const audioSrc = path.resolve(projectDir, 'audio', audioFileName);
  const audioDst = path.resolve(REMOTION_DIR, 'public', audioFileName);
  if (!fs.existsSync(audioSrc)) {
    console.error(`ERROR: audio file not found: ${audioSrc}`);
    process.exit(1);
  }
  fs.copyFileSync(audioSrc, audioDst);
} else {
  console.warn('⚠ no MASTER_AUDIO_FILE — the master will be SILENT unless every scene mp4 has\n'
    + '  BAKED audio. Per-scene renders in this pipeline are VISUAL-ONLY (silent), so you almost\n'
    + '  always want MASTER_AUDIO_FILE=<concatenated narration>. Verify the output is not silent\n'
    + '  (ffmpeg -i out.mp4 -af volumedetect -f null -).');
}

// The master renders the per-scene COMPONENTS live (via makeUniversalScenePreview),
// so there is NO per-scene mp4 to mirror. The live scenes read the scene JSONs already
// in remotion/public/scenes/ (mirrored by build_video.py step 7.5). MASTER_SCENES
// (when set) still filters which scenes the composition includes (handled in
// MasterComposition.tsx via the same env var).

const projectIdSafe = PROJECT.replace(/[_]/g, '-');
const masterCompId = `${projectIdSafe}-master`;
const outPath = process.argv[2] || path.resolve(projectDir, 'out', 'master.mp4');
fs.mkdirSync(path.dirname(outPath), { recursive: true });

// Inject env vars at bundle time. Remotion's bundler does NOT auto-inline
// arbitrary process.env vars, so without DefinePlugin the bundled
// MasterComposition would see undefined for these.
// NOTE: MasterComposition uses a plain <Series> (zero overlap, no crossfade) so the
// audio and video stay frame-perfect. There is intentionally NO transition-frames input.
const masterScenes = process.env.MASTER_SCENES || '';
function webpackOverride(config) {
  return {
    ...config,
    resolve: {
      ...config.resolve,
      alias: {
        ...(config.resolve?.alias ?? {}),
        '@project-scenes': projectScenesDir,
        '@remotion-components': path.resolve(REMOTION_DIR, 'src/components'),
      },
      modules: [
        ...(config.resolve?.modules ?? []),
        path.resolve(REMOTION_DIR, 'node_modules'),
      ],
    },
    plugins: [
      ...(config.plugins ?? []),
      new webpack.DefinePlugin({
        'process.env.PROJECT': JSON.stringify(PROJECT),
        'process.env.MASTER_AUDIO_FILE': JSON.stringify(audioFileName),
        'process.env.MASTER_SCENES': JSON.stringify(masterScenes),
      }),
    ],
  };
}

console.log('▶ Bundling master composition...');
const t0 = Date.now();
const serveUrl = await bundle({
  entryPoint: path.resolve(REMOTION_DIR, 'src/index.ts'),
  webpackOverride,
  publicDir: path.resolve(REMOTION_DIR, 'public'),
});
console.log(`✓ bundled in ${((Date.now() - t0) / 1000).toFixed(1)}s`);

console.log(`▶ ${masterCompId} → ${path.basename(outPath)}`);
const composition = await selectComposition({
  serveUrl,
  id: masterCompId,
});

// RENDERING INTELLIGENCE — collect the RuntimeProbe's telemetry Artifacts.
// The probe (inside every scene component) emits [data-cast-id] layout boxes at
// sampled frames; we persist them beside the output for the rules engine
// (python -m storyboard.render_intelligence) to verify against the contract.
const telemetryDir = path.resolve(path.dirname(outPath), 'telemetry');
fs.rmSync(telemetryDir, { recursive: true, force: true });
let telemetryCount = 0;

await renderMedia({
  composition,
  serveUrl,
  codec: 'h264',
  outputLocation: outPath,
  // Audio is muxed by Remotion since the composition has <Audio>
  audioCodec: 'aac',
  audioBitrate: '192k',
  pixelFormat: 'yuv420p',
  // Per-frame render timeout (default 33s is too tight for heavy scenes under
  // parallel concurrency contention — a slow frame times out even though it would
  // finish). Both env-configurable so a heavy master can render without spurious fails.
  timeoutInMilliseconds: Number(process.env.RENDER_TIMEOUT_MS) || 120000,
  ...(process.env.RENDER_CONCURRENCY ? { concurrency: Number(process.env.RENDER_CONCURRENCY) } : {}),
  onArtifact: (artifact) => {
    const dest = path.resolve(telemetryDir, path.basename(artifact.filename));
    fs.mkdirSync(telemetryDir, { recursive: true });
    fs.writeFileSync(dest, artifact.content);
    telemetryCount++;
  },
  // The single render takes longer than per-scene; expose progress.
  onProgress: ({ progress, renderedFrames, encodedFrames }) => {
    if (renderedFrames % 60 === 0) {
      const pct = (progress * 100).toFixed(1);
      process.stdout.write(`  ${pct}%  rendered=${renderedFrames}  encoded=${encodedFrames}\r`);
    }
  },
});

const stats = fs.statSync(outPath);
console.log(`\n✓ master rendered: ${(stats.size / 1024 / 1024).toFixed(1)} MB → ${outPath}`);
if (telemetryCount > 0) {
  console.log(`✓ telemetry: ${telemetryCount} samples → ${telemetryDir}`);
  console.log('  verify: python -m storyboard.telemetry_rules <project>');
}

// Clean up: remove the audio we copied into public/.
if (audioFileName) {
  try { fs.unlinkSync(path.resolve(REMOTION_DIR, 'public', audioFileName)); } catch (_) { /* ignore */ }
}
