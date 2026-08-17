/**
 * Exercise Media Service - demonstration images for exercises.
 *
 * Frames are self-hosted in the project's Supabase Storage bucket
 * (`exercise-media`), uploaded via scripts/upload-exercise-media.mjs. There is
 * no third-party runtime dependency: when Supabase isn't configured (offline
 * dev without env vars) no media is returned and the UI hides the demo.
 *
 * The dbId -> folder map lives in ../data/exerciseMediaFolders.js (shared with
 * the upload script). Each folder holds 0.jpg (start) and 1.jpg (end).
 */

import { MEDIA_FOLDERS } from '../data/exerciseMediaFolders.js';

// Read lazily so tests can stub import.meta.env before each call.
const mediaBase = () => {
  const url = import.meta.env?.VITE_SUPABASE_URL;
  return url ? `${url}/storage/v1/object/public/exercise-media` : null;
};

/**
 * Whether we have demonstration media for a given exercise.
 * @param {number|string|undefined|null} dbId
 * @returns {boolean}
 */
export function hasExerciseMedia(dbId) {
  return dbId != null && Boolean(MEDIA_FOLDERS[dbId]);
}

/**
 * Demonstration frames for an exercise, or null when we have none (custom
 * exercises have no dbId; others may simply not be mapped yet; or Supabase is
 * not configured, e.g. offline dev).
 * @param {number|string|undefined|null} dbId
 * @returns {{ frames: string[] } | null}
 */
export function getExerciseMedia(dbId) {
  const folder = dbId != null ? MEDIA_FOLDERS[dbId] : undefined;
  const base = mediaBase();
  if (!folder || !base) return null;
  return {
    frames: [`${base}/${folder}/0.jpg`, `${base}/${folder}/1.jpg`]
  };
}
