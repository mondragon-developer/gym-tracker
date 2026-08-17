import { describe, it, expect, vi, afterEach } from 'vitest';
import { getExerciseMedia, hasExerciseMedia } from './ExerciseMediaService.js';

describe('ExerciseMediaService', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns two Supabase-hosted frame URLs for a mapped exercise', () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://media.example');
    const media = getExerciseMedia(1); // Barbell Bench Press
    expect(media).not.toBeNull();
    expect(media.frames).toHaveLength(2);
    expect(media.frames[0]).toMatch(
      /^https:\/\/media\.example\/storage\/v1\/object\/public\/exercise-media\/Barbell_Bench_Press.*\/0\.jpg$/
    );
    expect(media.frames[1]).toMatch(/\/1\.jpg$/);
  });

  it('never points at a third-party CDN', () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://media.example');
    const media = getExerciseMedia(1);
    expect(JSON.stringify(media)).not.toContain('jsdelivr');
  });

  it('returns null when Supabase is not configured (offline dev)', () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    expect(getExerciseMedia(1)).toBeNull();
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
