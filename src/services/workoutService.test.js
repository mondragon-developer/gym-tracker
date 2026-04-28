import { describe, it, expect, beforeEach } from 'vitest';
import { StorageService, InMemoryStorageAdapter } from './StorageService.js';

// We need a fresh module instance per test so the singleton's storage
// is rebound to an in-memory adapter. Re-import via dynamic import + reset.
async function freshService() {
  // The exported singleton wraps a localStorage adapter by default.
  // For testing we instantiate the class directly with InMemoryStorageAdapter.
  const mod = await import('./workoutService.js');
  // Replace the singleton's storage with an isolated in-memory one.
  const fresh = Object.create(Object.getPrototypeOf(mod.default));
  fresh.storage = new StorageService(new InMemoryStorageAdapter());
  return fresh;
}

describe('WorkoutService.getInitialPlan', () => {
  it('returns all 7 weekday entries', async () => {
    const svc = await freshService();
    const plan = svc.getInitialPlan();
    expect(Object.keys(plan)).toEqual([
      'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
    ]);
  });

  it('Sunday is a Rest day with no exercises', async () => {
    const svc = await freshService();
    const plan = svc.getInitialPlan();
    expect(plan.Sunday.name).toBe('Rest');
    expect(plan.Sunday.exercises).toEqual([]);
  });

  it('returns a fresh deep clone each call (mutation isolation)', async () => {
    const svc = await freshService();
    const a = svc.getInitialPlan();
    const b = svc.getInitialPlan();
    expect(a).not.toBe(b);
    expect(a.Monday).not.toBe(b.Monday);
    expect(a.Monday.exercises).not.toBe(b.Monday.exercises);

    a.Monday.exercises.push({ id: 'mutation' });
    expect(b.Monday.exercises).toEqual(svc.getInitialPlan().Monday.exercises);
  });
});

describe('WorkoutService.getPlan / savePlan round-trip', () => {
  let svc;

  beforeEach(async () => {
    svc = await freshService();
  });

  it('returns the initial plan when storage is empty', () => {
    const plan = svc.getPlan();
    expect(plan.Monday.name).toBeDefined();
  });

  it('persists and reloads a saved plan', () => {
    const initial = svc.getPlan();
    initial.Monday.exercises[0].status = 'completed';
    svc.savePlan(initial);

    const reloaded = svc.getPlan();
    expect(reloaded.Monday.exercises[0].status).toBe('completed');
  });
});

describe('WorkoutService.migrateWorkoutPlan', () => {
  it('fills in days that were missing from a saved plan', async () => {
    const svc = await freshService();
    const partialPlan = {
      Monday: { name: 'Custom Monday', exercises: [] },
      // Other days deliberately missing
    };
    svc.savePlan(partialPlan);

    const migrated = svc.getPlan();
    expect(migrated.Monday.name).toBe('Custom Monday');
    expect(migrated.Tuesday).toBeDefined();
    expect(migrated.Sunday).toBeDefined();
  });

  it('preserves user data on days that already exist', async () => {
    const svc = await freshService();
    const userPlan = svc.getInitialPlan();
    userPlan.Monday.exercises[0].weight = '100';
    svc.savePlan(userPlan);

    const reloaded = svc.getPlan();
    expect(reloaded.Monday.exercises[0].weight).toBe('100');
  });
});

describe('WorkoutService.addExerciseToDay', () => {
  it('appends a new exercise immutably', async () => {
    const svc = await freshService();
    const plan = svc.getInitialPlan();
    const before = plan.Tuesday.exercises.length;
    const next = svc.addExerciseToDay(plan, 'Tuesday', { name: 'Custom', sets: '3', reps: '10' });

    expect(next).not.toBe(plan);
    expect(next.Tuesday).not.toBe(plan.Tuesday);
    expect(next.Tuesday.exercises.length).toBe(before + 1);
    expect(next.Tuesday.exercises.at(-1).name).toBe('Custom');
    // Original untouched
    expect(plan.Tuesday.exercises.length).toBe(before);
  });
});

describe('WorkoutService.updateExercise', () => {
  it('updates only the targeted exercise on the given day', async () => {
    const svc = await freshService();
    const plan = svc.getInitialPlan();
    const targetId = plan.Monday.exercises[0].id;

    const next = svc.updateExercise(plan, 'Monday', targetId, { status: 'completed', weight: '50' });

    const updated = next.Monday.exercises.find(e => e.id === targetId);
    expect(updated.status).toBe('completed');
    expect(updated.weight).toBe('50');
    // Untouched siblings preserved
    expect(next.Monday.exercises[1]).toEqual(plan.Monday.exercises[1]);
  });

  it('is a no-op when the id does not exist on that day', async () => {
    const svc = await freshService();
    const plan = svc.getInitialPlan();
    const next = svc.updateExercise(plan, 'Monday', 'nonexistent_id', { status: 'completed' });
    expect(next.Monday.exercises).toEqual(plan.Monday.exercises);
  });
});

describe('WorkoutService.removeExercise', () => {
  it('removes the exercise immutably', async () => {
    const svc = await freshService();
    const plan = svc.getInitialPlan();
    const targetId = plan.Monday.exercises[0].id;
    const before = plan.Monday.exercises.length;

    const next = svc.removeExercise(plan, 'Monday', targetId);
    expect(next.Monday.exercises.length).toBe(before - 1);
    expect(next.Monday.exercises.find(e => e.id === targetId)).toBeUndefined();
    // Original untouched
    expect(plan.Monday.exercises.length).toBe(before);
  });
});

describe('WorkoutService.resetDay', () => {
  it('restores the day to its default state', async () => {
    const svc = await freshService();
    const plan = svc.getInitialPlan();
    plan.Tuesday.exercises = [];
    plan.Tuesday.name = 'Cleared';

    const next = svc.resetDay(plan, 'Tuesday');
    expect(next.Tuesday.exercises.length).toBeGreaterThan(0);
    expect(next.Tuesday.name).not.toBe('Cleared');
  });
});

describe('WorkoutService.updateDayMuscleGroups', () => {
  it('joins multiple groups with " & "', async () => {
    const svc = await freshService();
    const plan = svc.getInitialPlan();
    const next = svc.updateDayMuscleGroups(plan, 'Wednesday', ['Chest', 'Back']);
    expect(next.Wednesday.name).toBe('Chest & Back');
  });

  it('falls back to "Rest" when given an empty list', async () => {
    const svc = await freshService();
    const plan = svc.getInitialPlan();
    const next = svc.updateDayMuscleGroups(plan, 'Wednesday', []);
    expect(next.Wednesday.name).toBe('Rest');
  });
});

describe('WorkoutService.getWorkoutStats', () => {
  it('aggregates completion across the entire week', async () => {
    const svc = await freshService();
    const plan = svc.getInitialPlan();
    plan.Monday.exercises[0].status = 'completed';
    plan.Monday.exercises[1].status = 'skipped';

    const stats = svc.getWorkoutStats(plan);
    expect(stats.completed).toBeGreaterThanOrEqual(1);
    expect(stats.skipped).toBeGreaterThanOrEqual(1);
    expect(stats.total).toBeGreaterThan(0);
  });
});
