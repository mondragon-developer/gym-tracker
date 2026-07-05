import { describe, it, expect } from 'vitest';
import { getExerciseMedia, hasExerciseMedia } from './ExerciseMediaService.js';

describe('ExerciseMediaService', () => {
  it('returns two frame URLs for a mapped exercise', () => {
    const media = getExerciseMedia(1); // Barbell Bench Press
    expect(media).not.toBeNull();
    expect(media.frames).toHaveLength(2);
    expect(media.frames[0]).toMatch(/\/0\.jpg$/);
    expect(media.frames[1]).toMatch(/\/1\.jpg$/);
    expect(media.frames[0]).toContain('Barbell_Bench_Press');
  });

  it('reports availability via hasExerciseMedia', () => {
    expect(hasExerciseMedia(1)).toBe(true);
    expect(hasExerciseMedia(177)).toBe(true); // Plank
    expect(hasExerciseMedia(92)).toBe(true);  // Face Pulls (expanded map)
    expect(hasExerciseMedia(60)).toBe(true);  // Barbell Squats
  });

  it('leaves genuinely unmatched exercises unmapped (graceful fallback)', () => {
    expect(hasExerciseMedia(199)).toBe(false); // Burpees — no correct demo
    expect(hasExerciseMedia(201)).toBe(false); // Swimming
  });

  it('returns null / false for unmapped or custom exercises', () => {
    expect(getExerciseMedia(999999)).toBeNull();
    expect(getExerciseMedia(undefined)).toBeNull();
    expect(getExerciseMedia(null)).toBeNull();
    expect(hasExerciseMedia(undefined)).toBe(false);
    expect(hasExerciseMedia(999999)).toBe(false);
  });
});
