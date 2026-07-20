/**
 * Exercise Enrichment Service — equipment, target muscle, and step-by-step
 * EN/ES instructions for library exercises.
 *
 * Backed by ../data/exerciseEnrichment.js (MIT-licensed text from the open
 * exercises-dataset; no media). Keyed by EXERCISE_DATABASE.id (dbId). Custom
 * exercises have no dbId and therefore no enrichment.
 */

import { EXERCISE_ENRICHMENT } from '../data/exerciseEnrichment.js';

/**
 * Whether we have enrichment (instructions/equipment) for an exercise.
 * @param {number|string|undefined|null} dbId
 * @returns {boolean}
 */
export function hasExerciseEnrichment(dbId) {
  return dbId != null && Boolean(EXERCISE_ENRICHMENT[dbId]);
}

/**
 * Full enrichment record for an exercise, or null when we have none.
 * @param {number|string|undefined|null} dbId
 * @returns {{ sourceId: string, sourceName: string, equipment: string,
 *   target: string, secondaryMuscles: string[],
 *   instructions: { en: string[], es: string[] } } | null}
 */
export function getExerciseEnrichment(dbId) {
  return dbId != null ? (EXERCISE_ENRICHMENT[dbId] || null) : null;
}

/**
 * Ordered how-to steps for an exercise in the requested language, falling back
 * to English, then to null when we have no enrichment at all.
 * @param {number|string|undefined|null} dbId
 * @param {'en'|'es'} [language]
 * @returns {string[] | null}
 */
export function getExerciseInstructions(dbId, language = 'en') {
  const rec = getExerciseEnrichment(dbId);
  if (!rec) return null;
  const steps = rec.instructions?.[language];
  if (steps && steps.length) return steps;
  return rec.instructions?.en?.length ? rec.instructions.en : null;
}
