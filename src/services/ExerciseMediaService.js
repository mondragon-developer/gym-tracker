/**
 * Exercise Media Service — demonstration images for exercises.
 *
 * PILOT: maps our EXERCISE_DATABASE ids (the `dbId` carried on plan exercises)
 * to start/end demonstration frames from the free, public-domain dataset
 * yuhonas/free-exercise-db, served via the jsDelivr CDN.
 *
 * The source is intentionally abstracted behind BASE_URL + a folder map, so
 * scaling to all exercises (or swapping to self-hosted animated clips on
 * Supabase Storage) is a one-line change here — nothing else in the app cares
 * where the frames come from.
 */

const BASE_URL = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises';

// dbId (EXERCISE_DATABASE.id) -> source folder in the free dataset.
// Each folder holds 0.jpg (start of the movement) and 1.jpg (end).
const MEDIA_FOLDERS = {
  1: 'Barbell_Bench_Press_-_Medium_Grip',
  2: 'Incline_Dumbbell_Press',
  9: 'Pullups',
  19: 'Side_Lateral_Raise',
  38: 'Barbell_Curl',
  60: 'Barbell_Full_Squat',
  61: 'Leg_Press',
  66: 'Romanian_Deadlift',
  82: 'Pushups',
  88: 'Wide-Grip_Lat_Pulldown',
  132: 'Barbell_Deadlift',
  177: 'Plank'
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
 * The demonstration frames for an exercise, or null when we have none
 * (custom exercises have no dbId; others may simply not be mapped yet).
 * @param {number|string|undefined|null} dbId
 * @returns {{ frames: string[] } | null}
 */
export function getExerciseMedia(dbId) {
  const folder = dbId != null ? MEDIA_FOLDERS[dbId] : undefined;
  if (!folder) return null;
  return { frames: [`${BASE_URL}/${folder}/0.jpg`, `${BASE_URL}/${folder}/1.jpg`] };
}
