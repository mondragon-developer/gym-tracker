import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { EXERCISE_DATABASE } from '../constants/index.js';
import { FUNCTIONAL_IDS } from '../data/functionalExercises.js';
import { translateExercise } from '../translations/exercises.js';
import { getExerciseEnrichment, getExerciseEquipment } from './ExerciseEnrichmentService.js';
import { getExerciseMedia } from './ExerciseMediaService.js';
import { ExerciseTypeFactory } from './ExerciseTypeStrategies.js';

describe('functional fitness library integration', () => {
  it('preserves unique exercise IDs and names', () => {
    expect(new Set(EXERCISE_DATABASE.map(row => row.id)).size).toBe(EXERCISE_DATABASE.length);
    expect(new Set(EXERCISE_DATABASE.map(row => row.name.toLowerCase())).size).toBe(EXERCISE_DATABASE.length);
  });

  it('provides Spanish names, bilingual steps, equipment and rep-based logging for every addition', async () => {
    for (const id of FUNCTIONAL_IDS) {
      const exercise = EXERCISE_DATABASE.find(row => row.id === id);
      expect(exercise).toBeTruthy();
      expect(translateExercise(exercise.name, 'es')).not.toBe(exercise.name);
      const record = await getExerciseEnrichment(id);
      expect(record.instructions.en.length).toBeGreaterThan(0);
      expect(record.instructions.es.length).toBeGreaterThan(0);
      expect(getExerciseEquipment(id)).toBe(record.equipment);
      expect(ExerciseTypeFactory.getStrategyByMuscleGroup(exercise.muscleGroup).usesReps()).toBe(true);
    }
    expect(getExerciseEquipment(274)).toBe('rings');
    expect(getExerciseEquipment(277)).toBe('rope');
  });

  it('ships every GIF and poster with a matching pinned provenance record', () => {
    const provenance = JSON.parse(fs.readFileSync('public/exercise-media/functional/provenance.json', 'utf8'));
    expect(provenance.revision).toMatch(/^[a-f0-9]{40}$/);
    expect(provenance.license).toBe('Unlicense');
    for (const id of FUNCTIONAL_IDS) {
      const media = getExerciseMedia(String(id));
      const gif = fs.readFileSync(`public${media.gif}`);
      expect(gif.subarray(0, 6).toString()).toBe('GIF89a');
      expect(fs.existsSync(`public${media.poster}`)).toBe(true);
      expect(createHash('sha256').update(gif).digest('hex')).toBe(provenance.exercises.find(row => row.id === id).gifSha256);
    }
  });
});
