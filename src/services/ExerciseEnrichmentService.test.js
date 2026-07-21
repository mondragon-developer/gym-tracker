import { describe, it, expect } from 'vitest';
import {
  getExerciseEnrichment,
  getExerciseInstructions,
  hasExerciseEnrichment,
} from './ExerciseEnrichmentService.js';

describe('ExerciseEnrichmentService', () => {
  it('reports availability synchronously via hasExerciseEnrichment', () => {
    expect(hasExerciseEnrichment(1)).toBe(true);     // Barbell Bench Press
    expect(hasExerciseEnrichment('1')).toBe(true);   // tolerates string ids
    expect(hasExerciseEnrichment(90)).toBe(true);    // recovered via override
  });

  it('returns a full enrichment record for a covered exercise', async () => {
    const rec = await getExerciseEnrichment(1);
    expect(rec).not.toBeNull();
    expect(rec.equipment).toBeTruthy();
    expect(rec.target).toBeTruthy();
    expect(Array.isArray(rec.secondaryMuscles)).toBe(true);
    expect(rec.instructions.en.length).toBeGreaterThan(0);
    expect(rec.instructions.es.length).toBeGreaterThan(0);
  });

  it('returns instructions in the requested language, falling back to English', async () => {
    const en = await getExerciseInstructions(1, 'en');
    const es = await getExerciseInstructions(1, 'es');
    expect(en.length).toBeGreaterThan(0);
    expect(es.length).toBeGreaterThan(0);
    // Spanish should actually differ from English (real translation, not a copy).
    expect(es.join(' ')).not.toEqual(en.join(' '));
    // Unknown language code falls back to English rather than returning null.
    expect(await getExerciseInstructions(1, 'zz')).toEqual(en);
  });

  it('returns null / false for uncovered or custom exercises', async () => {
    expect(await getExerciseEnrichment(999999)).toBeNull();
    expect(await getExerciseEnrichment(undefined)).toBeNull();
    expect(await getExerciseEnrichment(null)).toBeNull();
    expect(await getExerciseInstructions(999999, 'en')).toBeNull();
    expect(hasExerciseEnrichment(undefined)).toBe(false);
    expect(hasExerciseEnrichment(999999)).toBe(false);
  });
});
