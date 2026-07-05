/**
 * Exercise Media Service — demonstration images for exercises.
 *
 * Frames are self-hosted in the project's Supabase Storage bucket
 * (`exercise-media`) once uploaded via scripts/upload-exercise-media.mjs. The
 * original free source (yuhonas/free-exercise-db on jsDelivr) is kept only as a
 * per-image runtime FALLBACK, so switching to self-hosting is zero-risk: if a
 * frame isn't in Storage yet, the CDN still serves it.
 *
 * The dbId -> folder map lives in ../data/exerciseMediaFolders.js (shared with
 * the upload script). Each folder holds 0.jpg (start) and 1.jpg (end).
 */

import { MEDIA_FOLDERS } from '../data/exerciseMediaFolders.js';

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL;

// Primary: self-hosted Supabase Storage (public bucket). Falls back to the CDN
// when Supabase isn't configured (e.g. offline dev without env vars).
const PRIMARY_BASE = supabaseUrl
  ? `${supabaseUrl}/storage/v1/object/public/exercise-media`
  : 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises';

const FALLBACK_BASE = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises';

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
 * exercises have no dbId; others may simply not be mapped yet). `fallback`
 * holds the CDN URLs to try if a self-hosted frame fails to load.
 * @param {number|string|undefined|null} dbId
 * @returns {{ frames: string[], fallback: string[] } | null}
 */
export function getExerciseMedia(dbId) {
  const folder = dbId != null ? MEDIA_FOLDERS[dbId] : undefined;
  if (!folder) return null;
  return {
    frames: [`${PRIMARY_BASE}/${folder}/0.jpg`, `${PRIMARY_BASE}/${folder}/1.jpg`],
    fallback: [`${FALLBACK_BASE}/${folder}/0.jpg`, `${FALLBACK_BASE}/${folder}/1.jpg`]
  };
}
