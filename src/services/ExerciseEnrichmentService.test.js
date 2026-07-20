import { describe, it, expect } from 'vitest';
import {
  getExerciseEnrichment,
  getExerciseInstructions,
  hasExerciseEnrichment,
} from './ExerciseEnrichmentService.js';

describe('ExerciseEnrichmentService', () => {
  it('returns a full enrichment record for a covered exercise', () => {
    const rec = getExerciseEnrichment(1); // Barbell Bench Press
    expect(rec).not.toBeNull();
    expect(rec.equipment).toBeTruthy();
    expect(rec.target).toBeTruthy();
    expect(Array.isArray(rec.secondaryMuscles)).toBe(true);
    expect(rec.instructions.en.length).toBeGreaterThan(0);
    expect(rec.instructions.es.length).toBeGreaterThan(0);
  });

  it('reports availability via hasExerciseEnrichment', () => {
    expect(hasExerciseEnrichment(1)).toBe(true);
  });

  it('returns instructions in the requested language, falling back to English', () => {
    const en = getExerciseInstructions(1, 'en');
    const es = getExerciseInstructions(1, 'es');
    expect(en.length).toBeGreaterThan(0);
    expect(es.length).toBeGreaterThan(0);
    // Spanish should actually differ from English (real translation, not a copy).
    expect(es.join(' ')).not.toEqual(en.join(' '));
    // Unknown language code falls back to English rather than returning null.
    expect(getExerciseInstructions(1, 'zz')).toEqual(en);
  });

  it('returns null / false for uncovered or custom exercises', () => {
    expect(getExerciseEnrichment(999999)).toBeNull();
    expect(getExerciseEnrichment(undefined)).toBeNull();
    expect(getExerciseEnrichment(null)).toBeNull();
    expect(getExerciseInstructions(999999, 'en')).toBeNull();
    expect(hasExerciseEnrichment(undefined)).toBe(false);
    expect(hasExerciseEnrichment(999999)).toBe(false);
  });
});
