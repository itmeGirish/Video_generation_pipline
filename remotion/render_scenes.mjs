/**
 * Render each scene programmatically against a SINGLE bundled serveUrl.
 * Applies the same webpack aliases as remotion.config.ts.
 */
import { bundle } from '@remotion/bundler';
import {
  renderMedia,
  selectComposition,
  openBrowser,
  makeCancelSignal,
} from '@remotion/renderer';

const isUserCancelledRender = (err) =>
  err && (String(err.message || err).toLowerCase().includes('cancel') ||
          String(err.message || err).toLowerCase().includes('abort'));
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import webpack from 'webpack';

// Scene IDs come from build_video.py via positional CLI args.
// Earlier dead constants (HF_SCENES, RH_SCENES, TD_SCENES) belonged to the
// pre-codegen pipeline and have been removed — every scene is per-bullet
// codegen now (rule 04). If no scene IDs are passed, the script errors
// rather than guessing — see main() below.
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
  // Positional args are scene IDs. Without them we can't render anything —
  // callers (build_video.py) always pass them.
  const todo = args.filter((a) => !a.startsWith('--'));
  if (todo.length === 0) {
    console.error('ERROR: no scene IDs provided. Pass them as positional args, e.g.:');
    console.error('  PROJECT=my_project node render_scenes.mjs my_project-s01 my_project-s02');
    process.exit(1);
  }

  console.log('▶ Bundling once...');
  const t0 = Date.now();
  const serveUrl = await bundle({
    entryPoint: path.resolve('./src/index.ts'),
    webpackOverride,
    publicDir: path.resolve(projectDir, 'public'),  // assets live in projects/<name>/public/ (rule 17); staticFile('img/x.jpg') resolves there with NO 'public/' prefix
  });
  console.log(`✓ bundled in ${((Date.now() - t0) / 1000).toFixed(1)}s`);

  // Browser reuse pattern (verified — remotion.dev/docs/renderer/open-browser):
  // - Open ONE Chromium for the entire run; share via `puppeteerInstance`.
  // - chromiumOptions on renderMedia are IGNORED when puppeteerInstance is
  //   set, so all flags (gl, disableWebSecurity) MUST be set here at openBrowser
  //   time. Verified in the Remotion docs — passing them to renderMedia
  //   silently does nothing once puppeteerInstance is in play.
  // - Restart the browser every BROWSER_RESTART_EVERY scenes to bound
  //   accumulated Chromium memory (the docs note even swangle has small
  //   leakage on multi-thousand-frame renders).
  const BROWSER_RESTART_EVERY = 5;
  let browser = null;
  // disableWebSecurity removed (was widening the attack surface for any
  // external resource an LLM-emitted code blob might fetch — spec only
  // mandates `gl: 'swangle'`). If a future bullet legitimately needs to
  // fetch cross-origin assets (e.g. CDN fonts), set it via env var rather
  // than enabling globally.
  const openSharedBrowser = async () => openBrowser('chrome', {
    chromiumOptions: { gl: 'swangle' },
  });
  const closeSharedBrowser = async () => {
    if (browser) {
      try { await browser.close({ silent: true }); } catch {}
      browser = null;
    }
  };
  // Graceful cleanup on Ctrl+C / kill — without this, the parent Python's
  // taskkill may leave Chromium pages in a half-closed state.
  for (const sig of ['SIGINT', 'SIGTERM', 'SIGBREAK']) {
    process.on(sig, async () => {
      console.error(`\n[render_scenes] received ${sig} — closing browser`);
      await closeSharedBrowser();
      process.exit(sig === 'SIGINT' ? 130 : 143);
    });
  }
  browser = await openSharedBrowser();

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
  // Hung-render watchdog: if `onProgress` hasn't fired in this many ms, the
  // render is considered stalled and gets cancelled (then retried per the
  // attempt loop above). Verified pattern: makeCancelSignal + Promise.race +
  // tracking lastProgress timestamp. See remotion.dev/docs/renderer/make-cancel-signal.
  const STALL_TIMEOUT_MS = 120000;   // 2 minutes with no frame progress = stuck
  const failed = [];
  let scenesRendered = 0;
  // Per-scene render journal — time, attempts, size, status, error. Written to
  // out/render_journal.json so the production record (how long each scene took,
  // what errored, how many attempts to get a clean render) is reviewable later
  // instead of scrolling past in the console. Feeds the human verification.md.
  const journal = [];

  for (const sceneId of todo) {
    const out = path.join(OUT_DIR, `${sceneId}.mp4`);
    // Atomic write target: render to <sid>_inprogress.mp4, then fs.renameSync
    // to <sid>.mp4 after the size guard passes. Without atomic write, a SIGKILL
    // between renderMedia's last frame and process exit leaves a truncated mp4
    // that the next-build's size-guard (>100KB) might let through silently.
    //
    // The in-progress filename MUST end in .mp4 — Remotion 4.0.455+ added
    // strict output-filename extension validation that rejects ".mp4.inprogress"
    // ("filename must end in mp4, mkv, mov..."). The "_inprogress" infix keeps
    // the .mp4 extension while still distinguishing the temporary file from
    // the final atomic-rename target.
    const inprogress = out.replace(/\.mp4$/, '_inprogress.mp4');
    if (!force && fs.existsSync(out) && fs.statSync(out).size > 100_000) {
      console.log(`⏭  ${sceneId} already rendered — skipping`);
      continue;
    }
    // Clean up any orphaned .inprogress from a prior crash before rendering
    if (fs.existsSync(inprogress)) {
      try { fs.unlinkSync(inprogress); } catch {}
    }

    console.log(`\n▶ ${sceneId} → ${path.basename(out)}`);

    let lastErr = null;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const tScene = Date.now();

      // Per-attempt cancel signal + stall watchdog. If renderMedia stops
      // calling onProgress for STALL_TIMEOUT_MS, cancelSignal fires and the
      // render rejects with a UserCancelled error — caught below and counted
      // as a normal retry.
      const { cancelSignal, cancel } = makeCancelSignal();
      let lastProgressAt = Date.now();
      const watchdog = setInterval(() => {
        if (Date.now() - lastProgressAt > STALL_TIMEOUT_MS) {
          console.error(`\n  [watchdog] no progress for ${STALL_TIMEOUT_MS / 1000}s — cancelling`);
          cancel();
        }
      }, 5000);

      try {
        // Re-select composition on each attempt — cheap (data-only object,
        // no live browser handles) and guards against any stale state from a
        // prior crash. https://www.remotion.dev/docs/renderer/select-composition
        const comp = await selectComposition({
          serveUrl,
          id: sceneId,
          inputProps: {},
          puppeteerInstance: browser,
        });

        let last = 0;
        await renderMedia({
          serveUrl,
          composition: comp,
          codec: 'h264',
          outputLocation: inprogress,   // atomic write — rename after success
          // Browser-reuse via puppeteerInstance. NOTE: chromiumOptions.gl /
          // disableWebSecurity / etc. set on renderMedia are SILENTLY IGNORED
          // when puppeteerInstance is set — those flags must be set at
          // openBrowser time (above). Documented in render-media.md.
          puppeteerInstance: browser,
          // Stability knobs that ARE honored even with shared browser:
          // concurrency: MUST default to 1 — concurrency>1 with a shared
          // puppeteerInstance DEADLOCKS (0 CPU idle-hang, verified on s03 2026-06-04).
          // Long scenes are handled by raising RENDER_TIMEOUT_PER_SCENE_S instead.
          concurrency: Number(process.env.RENDER_CONCURRENCY) || 1,
          disallowParallelEncoding: true,
          timeoutInMilliseconds: 300000,
          offthreadVideoCacheSizeInBytes: 256 * 1024 * 1024,
          cancelSignal,
          onProgress: ({ renderedFrames }) => {
            lastProgressAt = Date.now();   // reset watchdog
            if (renderedFrames - last >= 100) {
              last = renderedFrames;
              process.stdout.write(`\r  ${renderedFrames}/${comp.durationInFrames}      `);
            }
          },
        });

        // Health-gate the inprogress file BEFORE atomic rename. Without this,
        // renderMedia can return success while leaving a 0-byte or truncated
        // file (rare but seen on disk-full).
        if (!fs.existsSync(inprogress) || fs.statSync(inprogress).size < 100_000) {
          throw new Error(`render produced ${fs.existsSync(inprogress) ? fs.statSync(inprogress).size : 0} bytes — too small`);
        }
        // Atomic commit: rename .inprogress → final name. fs.renameSync is
        // atomic on the same filesystem.
        fs.renameSync(inprogress, out);
        console.log(
          `\n✓ ${sceneId}: ${(fs.statSync(out).size / 1024 / 1024).toFixed(1)} MB in ${(
            (Date.now() - tScene) /
            1000
          ).toFixed(0)}s` + (attempt > 1 ? ` (attempt ${attempt}/${MAX_ATTEMPTS})` : ''),
        );
        lastErr = null;
        scenesRendered++;
        journal.push({
          sceneId,
          status: 'ok',
          seconds: +((Date.now() - tScene) / 1000).toFixed(1),
          attempts: attempt,
          sizeMB: +(fs.statSync(out).size / 1024 / 1024).toFixed(1),
          error: null,
        });
        break;
      } catch (err) {
        lastErr = err;
        const msg = err && err.message ? err.message : String(err);
        const cancelled = isUserCancelledRender(err);
        console.error(
          `\n✗ ${sceneId} attempt ${attempt}/${MAX_ATTEMPTS} ${cancelled ? 'STALLED' : 'failed'} after ${(
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
        // Same for the .inprogress staging file — must be cleared so the
        // size-guard at the top of the next attempt doesn't reject prematurely.
        if (fs.existsSync(inprogress)) {
          try { fs.unlinkSync(inprogress); } catch {}
        }
        // Stalled render likely left Chromium in a bad state — recycle the
        // shared browser before retry. Crashed render same logic.
        await closeSharedBrowser();
        browser = await openSharedBrowser();
        if (attempt < MAX_ATTEMPTS) {
          await new Promise((r) => setTimeout(r, RETRY_BACKOFF_MS));
        }
      } finally {
        clearInterval(watchdog);
      }
    }
    if (lastErr) {
      failed.push({ sceneId, error: lastErr.message || String(lastErr) });
      journal.push({
        sceneId,
        status: 'failed',
        seconds: null,
        attempts: MAX_ATTEMPTS,
        sizeMB: null,
        error: (lastErr.message || String(lastErr)).split('\n')[0],
      });
    }

    // Periodic browser restart to bound memory accumulation across many
    // scenes (no Remotion doc prescribes this; deduced from the swangle
    // long-render leak warning in remotion.dev/docs/chromium-flags).
    if (scenesRendered > 0 && scenesRendered % BROWSER_RESTART_EVERY === 0) {
      console.log(`  [browser] restarting after ${scenesRendered} scenes (memory bound)`);
      await closeSharedBrowser();
      browser = await openSharedBrowser();
    }
  }

  await closeSharedBrowser();

  // ── Write the per-scene render journal (always, even on partial failure) ──
  try {
    const okScenes = journal.filter((j) => j.status === 'ok');
    const totalRenderSec = +okScenes.reduce((s, j) => s + (j.seconds || 0), 0).toFixed(1);
    const retried = okScenes.filter((j) => j.attempts > 1).length;
    fs.writeFileSync(
      path.join(OUT_DIR, 'render_journal.json'),
      JSON.stringify({
        project: PROJECT,
        rendered_at: new Date().toISOString(),
        scenes_total: journal.length,
        scenes_ok: okScenes.length,
        scenes_failed: failed.length,
        scenes_retried: retried,            // succeeded but needed >1 attempt
        total_render_seconds: totalRenderSec,
        slowest_scene: okScenes.length
          ? okScenes.reduce((a, b) => (b.seconds > a.seconds ? b : a)).sceneId
          : null,
        scenes: journal,                    // per-scene: seconds, attempts, sizeMB, status, error
      }, null, 2),
    );
    console.log(`  [journal] wrote out/render_journal.json (${journal.length} scenes, ${totalRenderSec}s render, ${retried} retried, ${failed.length} failed)`);
  } catch (e) {
    console.error(`  [journal] could not write render_journal.json: ${e.message}`);
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
