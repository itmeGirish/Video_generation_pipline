/**
 * Main Scene Registry
 *
 * Imports scenes from the project directory via webpack alias.
 * The alias is configured at build time by render.mjs.
 *
 * Projects must export:
 * - PROJECT_SCENES: Record<string, SceneComponent> - scene registry
 * - SceneComponent: type for scene components
 */

import React from "react";

// Import project scenes via webpack alias (configured at build time in render.mjs)
// @ts-ignore - alias is configured dynamically at build time
import { PROJECT_SCENES, SceneComponent as ProjectSceneComponent } from "@project-scenes";

// Optional per-scene animationCompletionFrames export map
// (architectural fix #3 — Animation Completion Contract).
// @ts-ignore - optional export
import * as ProjectScenesModule from "@project-scenes";

// Re-export types and scenes
export type SceneComponent = ProjectSceneComponent;
export { PROJECT_SCENES };

const COMPLETION_MAP: Record<string, (d?: number) => number> =
  (ProjectScenesModule as any).PROJECT_SCENE_COMPLETIONS || {};

/**
 * Get a scene component by full path (e.g., "llm-inference/hook")
 *
 * @param scenePath - Full scene path in "project/type" format
 * @returns The scene component or undefined if not found
 */
export function getSceneByPath(scenePath: string): SceneComponent | undefined {
  const parts = scenePath.split("/");

  if (parts.length === 2) {
    const [project, type] = parts;
    // All scenes now come from the current project
    return PROJECT_SCENES[type];
  }

  // Fallback: try direct type lookup
  return PROJECT_SCENES[scenePath];
}

/**
 * Get all available scene paths
 */
export function getAllScenePaths(): string[] {
  return Object.keys(PROJECT_SCENES).map((type) => `project/${type}`);
}

/**
 * Check if a scene path exists
 */
export function hasScene(scenePath: string): boolean {
  return getSceneByPath(scenePath) !== undefined;
}

/**
 * Get all scene types
 */
export function getSceneTypes(): string[] {
  return Object.keys(PROJECT_SCENES);
}

/**
 * Look up the animation completion frame count for a scene.
 * If the scene exports one, return it; otherwise return the provided default
 * (which means "assume the scene fills its whole duration — no gap").
 *
 * This is the runtime half of the Animation Completion Contract.
 */
export function getSceneAnimationCompletion(
  scenePath: string,
  defaultDurationInFrames: number
): number {
  const parts = scenePath.split("/");
  const key = parts.length === 2 ? parts[1] : scenePath;
  const fn = COMPLETION_MAP[key];
  if (typeof fn === "function") {
    try {
      return fn(defaultDurationInFrames) || defaultDurationInFrames;
    } catch {
      return defaultDurationInFrames;
    }
  }
  return defaultDurationInFrames;
}
