/**
 * Render the master composition (audio + scenes stitched via TransitionSeries)
 * to a single mp4. Replaces ffmpeg stitch step in build_video.py.
 *
 * Per-scene mp4s must already be in remotion/out/ (Step 9 produces them).
 * Master audio must already be in projects/<name>/audio/ (Step 4 produces it).
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

// MasterComposition references each scene mp4 via staticFile('out/<sid>.mp4').
// staticFile() resolves under the bundle's publicDir, so we must mirror the
// per-scene mp4s from remotion/out/ into remotion/public/out/ before bundling.
// MASTER_SCENES (when set) limits which mp4s we copy.
const sceneOutDir = path.resolve(REMOTION_DIR, 'out');
const publicOutDir = path.resolve(REMOTION_DIR, 'public', 'out');
fs.mkdirSync(publicOutDir, { recursive: true });
const _filter = (process.env.MASTER_SCENES || '').trim();
const _allowed = _filter ? new Set(_filter.split(',').map((s) => s.trim())) : null;
const copiedScenes = [];
for (const f of fs.readdirSync(sceneOutDir)) {
  if (!f.endsWith('.mp4')) continue;
  const sid = f.replace(/\.mp4$/, '');
  if (_allowed && !_allowed.has(sid)) continue;
  fs.copyFileSync(path.join(sceneOutDir, f), path.join(publicOutDir, f));
  copiedScenes.push(f);
}
console.log(`▶ mirrored ${copiedScenes.length} scene mp4(s) into public/out/`);

const projectIdSafe = PROJECT.replace(/[_]/g, '-');
const masterCompId = `${projectIdSafe}-master`;
const outPath = process.argv[2] || path.resolve(projectDir, 'out', 'master.mp4');
fs.mkdirSync(path.dirname(outPath), { recursive: true });

// Inject env vars at bundle time. Remotion's bundler does NOT auto-inline
// arbitrary process.env vars, so without DefinePlugin the bundled
// MasterComposition would see undefined for these.
const transitionFrames = process.env.MASTER_TRANSITION_FRAMES || '12';
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
        'process.env.MASTER_TRANSITION_FRAMES': JSON.stringify(transitionFrames),
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

await renderMedia({
  composition,
  serveUrl,
  codec: 'h264',
  outputLocation: outPath,
  // Audio is muxed by Remotion since the composition has <Audio>
  audioCodec: 'aac',
  audioBitrate: '192k',
  pixelFormat: 'yuv420p',
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

// Clean up: remove the audio + scene mp4s we copied into public/.
try { fs.unlinkSync(audioDst); } catch (_) { /* ignore */ }
for (const f of copiedScenes) {
  try { fs.unlinkSync(path.join(publicOutDir, f)); } catch (_) { /* ignore */ }
}
try { fs.rmdirSync(publicOutDir); } catch (_) { /* not empty / not ours, ignore */ }
