// Audio-driven animation sync utilities.
// All scene timings derive from word timestamps — no hardcoded frames.

import { SCENE_AUDIO as CLAUDE_AUDIO, WordTimestamp, FPS } from '../audio-timestamps';
import { HARNESS_AUDIO } from '../harness-timestamps';
import { HARNESS2_AUDIO } from '../harness2-timestamps';
import { HARNESS3_AUDIO } from '../harness3-timestamps';

const SCENE_AUDIO = { ...CLAUDE_AUDIO, ...HARNESS_AUDIO, ...HARNESS2_AUDIO, ...HARNESS3_AUDIO };

const normalize = (s: string) =>
  s.toLowerCase().replace(/[.,!?;:'"]/g, '').trim();

function findPhraseIndex(words: WordTimestamp[], phrase: string, skipBefore = 0): number {
  const phraseWords = normalize(phrase).split(/\s+/);
  if (phraseWords.length === 0) return -1;

  for (let i = skipBefore; i <= words.length - phraseWords.length; i++) {
    let match = true;
    for (let j = 0; j < phraseWords.length; j++) {
      const w = normalize(words[i + j].word);
      const p = phraseWords[j];
      // Fuzzy: one contains the other (handles "Mythos" vs "Mythos.")
      if (w !== p && !w.includes(p) && !p.includes(w)) {
        match = false;
        break;
      }
    }
    if (match) return i;
  }
  return -1;
}

/** Frame when phrase BEGINS being spoken. Returns `fallbackFrame` if not found. */
export const findWordFrame = (
  sceneKey: string,
  phrase: string,
  fallbackFrame = 0,
  occurrence = 0,
): number => {
  const scene = SCENE_AUDIO[sceneKey];
  if (!scene) return fallbackFrame;

  let skipBefore = 0;
  let found = -1;
  for (let occ = 0; occ <= occurrence; occ++) {
    found = findPhraseIndex(scene.words, phrase, skipBefore);
    if (found < 0) return fallbackFrame;
    skipBefore = found + 1;
  }
  return Math.round(scene.words[found].start * FPS);
};

/** Frame when phrase FINISHES being spoken. */
export const findWordEndFrame = (
  sceneKey: string,
  phrase: string,
  fallbackFrame = 0,
): number => {
  const scene = SCENE_AUDIO[sceneKey];
  if (!scene) return fallbackFrame;

  const phraseWords = normalize(phrase).split(/\s+/);
  const idx = findPhraseIndex(scene.words, phrase);
  if (idx < 0) return fallbackFrame;
  return Math.round(scene.words[idx + phraseWords.length - 1].end * FPS);
};

/** Total audio duration for a scene in frames. */
export const getSceneDurationFrames = (sceneKey: string, fallback = 900): number => {
  const scene = SCENE_AUDIO[sceneKey];
  return scene ? scene.durationFrames : fallback;
};

/**
 * Helper for sub-animation Sequence timings inside a scene.
 * Given a list of {name, phrase} markers in narration order, return the start/duration
 * for each sub-Sequence so that each visual starts when the narrator mentions it.
 */
export const deriveSubSequences = (
  sceneKey: string,
  markers: Array<{ name: string; phrase: string }>,
): Array<{ name: string; from: number; duration: number }> => {
  const total = getSceneDurationFrames(sceneKey);

  const starts = markers.map((m, i) => {
    // First sub always starts at 0 (fills the lead-in before the marker phrase)
    if (i === 0) return 0;
    return findWordFrame(sceneKey, m.phrase, Math.round((i / markers.length) * total));
  });

  return markers.map((m, i) => {
    const from = starts[i];
    const next = i + 1 < starts.length ? starts[i + 1] : total;
    return { name: m.name, from, duration: Math.max(1, next - from) };
  });
};
