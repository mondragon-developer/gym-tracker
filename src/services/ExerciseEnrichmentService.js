/**
 * Exercise Enrichment Service — equipment, target muscle, and step-by-step
 * EN/ES instructions for library exercises.
 *
 * The heavy data (../data/exerciseEnrichment.js, ~160KB) is loaded LAZILY via
 * dynamic import so it stays out of the initial bundle — it's only needed when a
 * demo modal opens. Two tiny generated companions are imported synchronously:
 * ../data/exerciseEnrichmentIndex.js (covered ids, for the demo button) and
 * ../data/exerciseEquipment.js (id -> equipment, for the library filter).
 *
 * Keyed by EXERCISE_DATABASE.id (dbId); custom exercises have no dbId.
 */

import { ENRICHED_IDS } from '../data/exerciseEnrichmentIndex.js';
import { EXERCISE_EQUIPMENT } from '../data/exerciseEquipment.js';

const ENRICHED = new Set(ENRICHED_IDS);

// Memoize the dynamic import so the chunk is fetched/parsed at most once.
let dataPromise = null;
function loadData() {
  if (!dataPromise) {
    dataPromise = import('../data/exerciseEnrichment.js').then(m => m.EXERCISE_ENRICHMENT);
  }
  return dataPromise;
}

/**
 * Whether we have enrichment (instructions/equipment) for an exercise.
 * Synchronous — safe to call during render.
 * @param {number|string|undefined|null} dbId
 * @returns {boolean}
 */
export function hasExerciseEnrichment(dbId) {
  return dbId != null && ENRICHED.has(Number(dbId));
}

/**
 * Equipment tag for an exercise ('barbell', 'dumbbell', ...), or null when the
 * exercise has no enrichment. Synchronous, backed by the generated
 * exerciseEquipment.js map, so it is safe to call during render.
 * @param {number|string|undefined|null} dbId
 * @returns {string | null}
 */
export function getExerciseEquipment(dbId) {
  if (dbId == null) return null;
  return EXERCISE_EQUIPMENT[dbId] ?? null;
}

/**
 * Sorted, de-duplicated list of every equipment value present in the library,
 * for building filter dropdowns. Synchronous.
 * @returns {string[]}
 */
export function listEquipment() {
  return [...new Set(Object.values(EXERCISE_EQUIPMENT))].sort();
}

/**
 * Full enrichment record for an exercise, or null when we have none.
 * Async — resolves after the enrichment chunk loads.
 * @param {number|string|undefined|null} dbId
 * @returns {Promise<{ sourceId: string, sourceName: string, equipment: string,
 *   target: string, secondaryMuscles: string[],
 *   instructions: { en: string[], es: string[] } } | null>}
 */
export async function getExerciseEnrichment(dbId) {
  if (!hasExerciseEnrichment(dbId)) return null;
  const data = await loadData();
  return data[dbId] || null;
}

/**
 * Ordered how-to steps for an exercise in the requested language, falling back
 * to English, then to null when we have no enrichment. Async.
 * @param {number|string|undefined|null} dbId
 * @param {'en'|'es'} [language]
 * @returns {Promise<string[] | null>}
 */
export async function getExerciseInstructions(dbId, language = 'en') {
  const rec = await getExerciseEnrichment(dbId);
  if (!rec) return null;
  const steps = rec.instructions?.[language];
  if (steps && steps.length) return steps;
  return rec.instructions?.en?.length ? rec.instructions.en : null;
}
