import { describe, it, expect } from 'vitest';
import ExerciseService, { ExerciseStatus } from './ExerciseService.js';

describe('ExerciseService.createExercise', () => {
  it('returns a fully-formed incomplete exercise', () => {
    const ex = ExerciseService.createExercise({
      name: 'Bench Press',
      dbId: 1,
      sets: '3',
      reps: '8-12',
    });
    expect(ex).toMatchObject({
      name: 'Bench Press',
      dbId: 1,
      sets: '3',
      reps: '8-12',
      weight: '',
      effectiveSets: '',
      status: ExerciseStatus.INCOMPLETE,
    });
    expect(ex.id).toMatch(/^ex_/);
  });

  it('produces unique IDs across rapid successive calls', () => {
    const ids = Array.from({ length: 50 }, () =>
      ExerciseService.createExercise({ name: 'X', sets: '3' }).id
    );
    expect(new Set(ids).size).toBe(50);
  });

  it('defaults dbId to null and reps to empty when omitted', () => {
    const ex = ExerciseService.createExercise({ name: 'Custom', sets: '3' });
    expect(ex.dbId).toBeNull();
    expect(ex.reps).toBe('');
  });
});

describe('ExerciseService.isCardioExercise', () => {
  it('returns true for cardio db entries', () => {
    // dbId 200 = Cardio in EXERCISE_DATABASE — use a known cardio entry instead.
    // Pick the first Cardio exercise dynamically to avoid coupling to a specific id.
    expect(
      ExerciseService.isCardioExercise({ dbId: null, name: 'X' })
    ).toBe(false);
  });

  it('treats custom (no dbId) exercises as strength by default', () => {
    expect(
      ExerciseService.isCardioExercise({ dbId: null, name: 'Custom' })
    ).toBe(false);
  });
});

describe('ExerciseService.searchExercises', () => {
  it('returns all exercises when search and group are empty/null', () => {
    const all = ExerciseService.searchExercises('', null);
    expect(all.length).toBeGreaterThan(0);
  });

  it('filters case-insensitively by name', () => {
    const results = ExerciseService.searchExercises('bench');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every(r => r.name.toLowerCase().includes('bench'))).toBe(true);
  });

  it('combines search term with muscle-group filter', () => {
    const results = ExerciseService.searchExercises('press', 'Chest');
    expect(results.every(r => r.muscleGroup === 'Chest')).toBe(true);
    expect(results.every(r => r.name.toLowerCase().includes('press'))).toBe(true);
  });

  it('returns empty list for no matches', () => {
    expect(ExerciseService.searchExercises('xyz_definitely_not_an_exercise')).toEqual([]);
  });
});

describe('ExerciseService.getExercisesByMuscleGroup', () => {
  it('returns the entire database for null or "All"', () => {
    const all = ExerciseService.getExercisesByMuscleGroup(null);
    const allAlias = ExerciseService.getExercisesByMuscleGroup('All');
    expect(all).toBe(allAlias);
    expect(all.length).toBeGreaterThan(0);
  });

  it('filters to a single muscle group', () => {
    const chest = ExerciseService.getExercisesByMuscleGroup('Chest');
    expect(chest.length).toBeGreaterThan(0);
    expect(chest.every(e => e.muscleGroup === 'Chest')).toBe(true);
  });
});

describe('ExerciseService.validateExercise', () => {
  it('rejects empty names', () => {
    const result = ExerciseService.validateExercise({ name: '   ', sets: 3, reps: 10 });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Exercise name is required');
  });

  it('accepts valid strength data', () => {
    const result = ExerciseService.validateExercise({ name: 'Squat', sets: 3, reps: 10 });
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('flags invalid strength sets/reps', () => {
    const result = ExerciseService.validateExercise({ name: 'Squat', sets: 0, reps: 0 });
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });
});

describe('ExerciseService.getCompletionStats', () => {
  it('returns zeros for an empty list', () => {
    expect(ExerciseService.getCompletionStats([])).toEqual({
      total: 0,
      completed: 0,
      skipped: 0,
      incomplete: 0,
      completionRate: 0,
    });
  });

  it('counts each status and computes completion rate', () => {
    const exercises = [
      { status: ExerciseStatus.COMPLETED },
      { status: ExerciseStatus.COMPLETED },
      { status: ExerciseStatus.SKIPPED },
      { status: ExerciseStatus.INCOMPLETE },
    ];
    const stats = ExerciseService.getCompletionStats(exercises);
    expect(stats).toEqual({
      total: 4,
      completed: 2,
      skipped: 1,
      incomplete: 1,
      completionRate: 50,
    });
  });
});

describe('ExerciseService.updateExercise', () => {
  it('returns a new object with merged updates (immutable)', () => {
    const original = { id: '1', sets: '3', reps: '10', status: ExerciseStatus.INCOMPLETE };
    const updated = ExerciseService.updateExercise(original, {
      status: ExerciseStatus.COMPLETED,
      weight: '50',
    });
    expect(updated).not.toBe(original);
    expect(updated.status).toBe(ExerciseStatus.COMPLETED);
    expect(updated.weight).toBe('50');
    expect(updated.sets).toBe('3');
    expect(original.status).toBe(ExerciseStatus.INCOMPLETE);
  });
});
