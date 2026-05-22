/**
 * Render a single still frame for storyboard/preview_bullet.py.
 *
 * Called by preview_bullet.py — do NOT invoke directly.
 * Env vars set by caller: PROJECT, VIDEO_FPS, VIDEO_WIDTH, VIDEO_HEIGHT.
 *
 * Usage:
 *   node preview_still.mjs --composition <id> --frame <n> --output <path>
 */
import { bundle }               from '@remotion/bundler';
import { renderStill,
         selectComposition,
         openBrowser }          from '@remotion/renderer';
import fs                       from 'node:fs';
import path                     from 'node:path';
import process                  from 'node:process';
import webpack                  from 'webpack';

// ── env validation ─────────────────────────────────────────────────────────────
if (!process.env.PROJECT) {
  console.error('ERROR: PROJECT env var required');
  process.exit(1);
}

const PROJECT      = process.env.PROJECT;
const VIDEO_FPS    = process.env.VIDEO_FPS    || '30';
const VIDEO_WIDTH  = process.env.VIDEO_WIDTH  || '1920';
const VIDEO_HEIGHT = process.env.VIDEO_HEIGHT || '1080';

const REMOTION_DIR    = path.resolve('.');
const projectDir      = path.resolve(REMOTION_DIR, `../projects/${PROJECT}`);
const projectScenesDir = path.resolve(projectDir, 'scenes');
const shortScenesDir  = path.resolve(projectDir, 'short/default/scenes');

// ── parse CLI args ─────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
let compositionId = null;
let frame         = 45;
let outputPath    = null;

for (let i = 0; i < args.length; i++) {
  if      (args[i] === '--composition') compositionId = args[++i];
  else if (args[i] === '--frame')       frame         = parseInt(args[++i], 10);
  else if (args[i] === '--output')      outputPath    = path.resolve(args[++i]);
}

if (!compositionId || !outputPath) {
  console.error('ERROR: --composition <id> and --output <path> are required');
  process.exit(1);
}

// ── webpack override (mirrors render_scenes.mjs) ──────────────────────────────
function webpackOverride(config) {
  return {
    ...config,
    resolve: {
      ...config.resolve,
      alias: {
        ...(config.resolve?.alias ?? {}),
        '@project-scenes':       projectScenesDir,
        '@project-short-scenes': shortScenesDir,
        '@remotion-components':  path.resolve(REMOTION_DIR, 'src/components'),
      },
      modules: [
        ...(config.resolve?.modules ?? []),
        path.resolve(REMOTION_DIR, 'node_modules'),
        'node_modules',
      ],
    },
    plugins: [
      ...(config.plugins ?? []),
      new webpack.DefinePlugin({
        'process.env.__STORYBOARD_JSON__':        'null',
        'process.env.__SHORTS_STORYBOARD_JSON__': 'null',
      }),
    ],
  };
}

// ── main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`▶ preview_still — composition: ${compositionId}, frame: ${frame}`);

  // Bundle — same entry + publicDir as render_scenes.mjs
  const t0 = Date.now();
  const serveUrl = await bundle({
    entryPoint:     path.resolve('./src/index.ts'),
    webpackOverride,
    publicDir:      projectDir,
  });
  console.log(`  bundled in ${((Date.now() - t0) / 1000).toFixed(1)}s`);

  const browser = await openBrowser('chrome', {
    chromiumOptions: { gl: 'swangle' },
  });

  try {
    const comp = await selectComposition({
      serveUrl,
      id:               compositionId,
      inputProps:       {},
      puppeteerInstance: browser,
      envVariables: {
        PROJECT,
        VIDEO_FPS,
        VIDEO_WIDTH,
        VIDEO_HEIGHT,
      },
    });

    await renderStill({
      composition:       comp,
      serveUrl,
      output:            outputPath,
      inputProps:        {},
      imageFormat:       'jpeg',
      jpegQuality:       92,
      frame,
      puppeteerInstance: browser,
      envVariables: {
        PROJECT,
        VIDEO_FPS,
        VIDEO_WIDTH,
        VIDEO_HEIGHT,
      },
    });

    console.log(`  ✓ still → ${outputPath}`);
  } finally {
    await browser.close({ silent: true }).catch(() => {});
  }
}

main().catch((err) => {
  console.error('preview_still failed:', err?.message ?? err);
  process.exit(1);
});
