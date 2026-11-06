import { describe, it, expect, vi, afterEach } from 'vitest';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { EXERCISE_DATABASE } from '../constants/index.js';
import { PHOTO_EXERCISES } from '../data/photoExercises.js';
import { getExerciseMedia } from './ExerciseMediaService.js';
import { getExerciseEnrichment, getExerciseEquipment } from './ExerciseEnrichmentService.js';
import { resolveExerciseName } from '../utils/exerciseResolver.js';
import { EXERCISE_MUSCLES } from '../data/exerciseMuscles.js';

afterEach(() => vi.unstubAllEnvs());

describe('reviewed photo expansion', () => {
  it('resolves every English and Spanish name to the intended stable catalog ID', async () => {
    expect(PHOTO_EXERCISES).toHaveLength(12);
    expect(EXERCISE_DATABASE).toHaveLength(230);
    for (const exercise of PHOTO_EXERCISES) {
      for (const name of [exercise.name, exercise.nameEs]) {
        expect(resolveExerciseName(name).dbId).toBe(exercise.id);
      }
      const record = await getExerciseEnrichment(exercise.id);
      expect(getExerciseEquipment(exercise.id)).toBe(exercise.equipment);
      expect(record.instructions.en).toHaveLength(4);
      expect(record.instructions.es).toHaveLength(4);
      expect(record.photoDescriptions.en).toHaveLength(2);
      expect(record.photoDescriptions.es).toHaveLength(2);
      expect(EXERCISE_MUSCLES[exercise.id].length).toBeGreaterThan(0);
    }
  });

  it('ships only preferred source pairs, byte-for-byte, and serves them without Supabase', () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    const research = JSON.parse(fs.readFileSync('docs/research/exercise-expansion/manifest.json', 'utf8'));
    const provenance = JSON.parse(fs.readFileSync('public/exercise-media/photos/provenance.json', 'utf8'));
    expect(provenance.revision).toBe(research.source.revision);
    expect(provenance.exercises).toHaveLength(12);
    for (const exercise of PHOTO_EXERCISES) {
      const record = provenance.exercises.find(row => row.id === exercise.id);
      expect(research.photoCandidates.find(row => row.sourceId === record.sourceId).status).toMatch(/^preferred/);
      const media = getExerciseMedia(String(exercise.id));
      expect(media.still).toBe(true);
      expect(media.gif).toBeUndefined();
      for (const [index, path] of media.frames.entries()) {
        const bytes = fs.readFileSync(`public${path}`);
        expect(bytes.subarray(0, 3).toString('hex')).toBe('ffd8ff');
        expect(createHash('sha256').update(bytes).digest('hex')).toBe(record.images[index].sha256);
      }
    }
  });
});
