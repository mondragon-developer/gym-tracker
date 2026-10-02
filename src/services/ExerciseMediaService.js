/**
 * Exercise Media Service - demonstration images for exercises.
 *
 * Legacy frames are self-hosted in the project's Supabase Storage bucket
 * (`exercise-media`), uploaded via scripts/upload-exercise-media.mjs. There is
 * no third-party runtime dependency. Functional fitness GIFs and posters ship
 * with the app, so those demos also work without Supabase configuration.
 *
 * The dbId -> folder map lives in ../data/exerciseMediaFolders.js (shared with
 * the upload script). Each folder holds 0.jpg (start) and 1.jpg (end).
 */

import { MEDIA_FOLDERS } from '../data/exerciseMediaFolders.js';
import { FUNCTIONAL_IDS } from '../data/functionalExercises.js';
const functional = new Set(FUNCTIONAL_IDS);

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
  return dbId != null && (functional.has(Number(dbId)) || Boolean(MEDIA_FOLDERS[dbId]));
}

/**
 * Demonstration frames for an exercise, or null when we have none (custom
 * exercises have no dbId; others may simply not be mapped yet; or Supabase is
 * not configured, e.g. offline dev).
 * @param {number|string|undefined|null} dbId
 * @returns {{ frames: string[], gif?: string, poster?: string, source?: string } | null}
 */
export function getExerciseMedia(dbId) {
  if (dbId != null && functional.has(Number(dbId))) {
    const base = `${import.meta.env.BASE_URL || '/'}exercise-media/functional/${Number(dbId)}`;
    return { gif: `${base}.gif`, poster: `${base}.jpg`, frames: [], source: 'free-exercise-db' };
  }
  const folder = dbId != null ? MEDIA_FOLDERS[dbId] : undefined;
  const base = mediaBase();
  if (!folder || !base) return null;
  return {
    frames: [`${base}/${folder}/0.jpg`, `${base}/${folder}/1.jpg`]
  };
}
