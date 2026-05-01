/**
 * Render each scene programmatically against a SINGLE bundled serveUrl.
 * Applies the same webpack aliases as remotion.config.ts.
 */
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import webpack from 'webpack';

const HF_SCENES = ['hf01', 'hf02', 'hf03', 'hf04', 'hf05', 'hf06', 'hf07'];
const RH_SCENES = Array.from({ length: 12 }, (_, i) => `rh${String(i + 1).padStart(2, '0')}`);
const TD_SCENES = Array.from({ length: 10 }, (_, i) => `td${String(i + 1).padStart(2, '0')}`);
const SCENES = process.argv.includes('--td') ? TD_SCENES
  : process.argv.includes('--rh') ? RH_SCENES
  : HF_SCENES;
const REMOTION_DIR = path.resolve('.');
const OUT_DIR = path.join(REMOTION_DIR, 'out');

// Same aliases as remotion.config.ts
// PROJECT must be explicit — no hardcoded defaults.
// Pass via env: PROJECT=harness_3 node render_scenes.mjs
if (!process.env.PROJECT) {
  console.error('ERROR: PROJECT env var required. Example: PROJECT=harness_3 node render_scenes.mjs');
  process.exit(1);
}
const PROJECT = process.env.PROJECT;
const projectDir = path.resolve(REMOTION_DIR, `../projects/${PROJECT}`);
const projectScenesDir = path.resolve(projectDir, 'scenes');
const shortScenesDir = path.resolve(projectDir, 'short/default/scenes');
const storyboardPath = path.resolve(projectDir, 'storyboard/storyboard.json');
const shortsStoryboardPath = path.resolve(projectDir, 'short/default/storyboard/shorts_storyboard.json');

let storyboardJson = 'null';
if (fs.existsSync(storyboardPath)) storyboardJson = fs.readFileSync(storyboardPath, 'utf-8');
let shortsStoryboardJson = 'null';
if (fs.existsSync(shortsStoryboardPath)) shortsStoryboardJson = fs.readFileSync(shortsStoryboardPath, 'utf-8');

function webpackOverride(config) {
  return {
    ...config,
    resolve: {
      ...config.resolve,
      alias: {
        ...(config.resolve?.alias ?? {}),
        '@project-scenes': projectScenesDir,
        '@project-short-scenes': shortScenesDir,
        '@remotion-components': path.resolve(REMOTION_DIR, 'src/components'),
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
        'process.env.__STORYBOARD_JSON__': storyboardJson,
        'process.env.__SHORTS_STORYBOARD_JSON__': shortsStoryboardJson,
      }),
    ],
  };
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  // Filter out flags; the remaining positional args are scene IDs if any
  const onlyScenes = args.filter((a) => !a.startsWith('--'));
  const todo = onlyScenes.length ? onlyScenes : SCENES;

  console.log('▶ Bundling once...');
  const t0 = Date.now();
  const serveUrl = await bundle({
    entryPoint: path.resolve('./src/index.ts'),
    webpackOverride,
    publicDir: projectDir,  // matches remotion.config.ts: Config.setPublicDir(projectDir)
  });
  console.log(`✓ bundled in ${((Date.now() - t0) / 1000).toFixed(1)}s`);

  // Per-scene retry policy (research-backed):
  //   - Remotion's own convention is `retries: 1` (delayRender retries),
  //     so we mirror it here at the scene level: 1 initial + 1 retry.
  //   - Backoff between attempts gives Chromium time to release file
  //     handles on Windows (no Remotion doc mandates this — empirical).
  //   - Already-rendered scenes (size-validated) are preserved across retries
  //     and across whole-script restarts — see the size guard above.
  //   - serveUrl is reused across all attempts and all scenes; the bundle
  //     is webpack-static and a Chromium tab crash cannot corrupt it
  //     (https://www.remotion.dev/docs/bundle/).
  const MAX_ATTEMPTS = 2;
  const RETRY_BACKOFF_MS = 2000;
  const failed = [];

  for (const sceneId of todo) {
    const out = path.join(OUT_DIR, `${sceneId}.mp4`);
    if (!force && fs.existsSync(out) && fs.statSync(out).size > 100_000) {
      console.log(`⏭  ${sceneId} already rendered — skipping`);
      continue;
    }

    console.log(`\n▶ ${sceneId} → ${path.basename(out)}`);

    let lastErr = null;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const tScene = Date.now();
      try {
        // Re-select composition on each attempt — cheap (data-only object,
        // no live browser handles) and guards against any stale state from a
        // prior crash. https://www.remotion.dev/docs/renderer/select-composition
        const comp = await selectComposition({
          serveUrl,
          id: sceneId,
          inputProps: {},
        });

        let last = 0;
        await renderMedia({
          serveUrl,
          composition: comp,
          codec: 'h264',
          outputLocation: out,
          // Stability set, all citations in render_scenes.mjs comment block above main():
          //   concurrency: 1                  → render frames serially (smallest mem footprint)
          //   disallowParallelEncoding: true  → docs: "more memory-efficient, but possibly slower"
          //   gl: 'swangle'                   → docs: 'angle' has memory leak that crashes long renders
          //   timeoutInMilliseconds: 300000   → 5 min per frame, slack for slow primitives
          concurrency: 1,
          disallowParallelEncoding: true,
          timeoutInMilliseconds: 300000,
          chromiumOptions: { disableWebSecurity: true, gl: 'swangle' },
          offthreadVideoCacheSizeInBytes: 256 * 1024 * 1024,
          onProgress: ({ renderedFrames }) => {
            if (renderedFrames - last >= 100) {
              last = renderedFrames;
              process.stdout.write(`\r  ${renderedFrames}/${comp.durationInFrames}      `);
            }
          },
        });

        console.log(
          `\n✓ ${sceneId}: ${(fs.statSync(out).size / 1024 / 1024).toFixed(1)} MB in ${(
            (Date.now() - tScene) /
            1000
          ).toFixed(0)}s` + (attempt > 1 ? ` (attempt ${attempt}/${MAX_ATTEMPTS})` : ''),
        );
        lastErr = null;
        break;
      } catch (err) {
        lastErr = err;
        const msg = err && err.message ? err.message : String(err);
        console.error(
          `\n✗ ${sceneId} attempt ${attempt}/${MAX_ATTEMPTS} failed after ${(
            (Date.now() - tScene) /
            1000
          ).toFixed(0)}s: ${msg.split('\n')[0]}`,
        );
        // Remotion does NOT delete the partial output on throw
        // (verified in renderer source render-media.js:451-495). Remove
        // the truncated mp4 so the next attempt's size guard doesn't
        // mistake it for a finished render.
        if (fs.existsSync(out)) {
          try { fs.unlinkSync(out); } catch {}
        }
        if (attempt < MAX_ATTEMPTS) {
          await new Promise((r) => setTimeout(r, RETRY_BACKOFF_MS));
        }
      }
    }
    if (lastErr) {
      failed.push({ sceneId, error: lastErr.message || String(lastErr) });
    }
  }

  if (failed.length) {
    console.error(`\n✗ ${failed.length} scene(s) failed after ${MAX_ATTEMPTS} attempts:`);
    for (const f of failed) console.error(`  - ${f.sceneId}: ${f.error.split('\n')[0]}`);
    // Distinct exit code 2 = "partial failure" (some scenes succeeded).
    // build_video.py can decide whether to stitch what's there or abort.
    process.exit(2);
  }

  console.log('\n✓ All scenes done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
