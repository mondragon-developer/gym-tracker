import { describe, it, expect } from 'vitest';
import {
  StrengthExerciseStrategy,
  CardioExerciseStrategy,
  FlexibilityExerciseStrategy,
  ExerciseTypeFactory,
} from './ExerciseTypeStrategies.js';

describe('StrengthExerciseStrategy', () => {
  const strategy = new StrengthExerciseStrategy();

  it('uses both weight and reps', () => {
    expect(strategy.usesWeight()).toBe(true);
    expect(strategy.usesReps()).toBe(true);
  });

  it('rejects invalid sets/reps', () => {
    expect(strategy.validate({ sets: 0, reps: 5 }).isValid).toBe(false);
    expect(strategy.validate({ sets: 3, reps: 0 }).isValid).toBe(false);
  });

  it('formats display with weight when present', () => {
    expect(strategy.formatDisplay({ sets: '3', reps: '8-12', weight: '50' })).toBe(
      '3 sets × 8-12 reps @ 50lbs'
    );
    expect(strategy.formatDisplay({ sets: '3', reps: '8-12', weight: '' })).toBe(
      '3 sets × 8-12 reps'
    );
  });
});

describe('CardioExerciseStrategy', () => {
  const strategy = new CardioExerciseStrategy();

  it('uses neither weight nor reps', () => {
    expect(strategy.usesWeight()).toBe(false);
    expect(strategy.usesReps()).toBe(false);
  });

  it('clamps duration between 1 and 120 minutes', () => {
    expect(strategy.validate({ sets: 0 }).isValid).toBe(false);
    expect(strategy.validate({ sets: 121 }).isValid).toBe(false);
    expect(strategy.validate({ sets: 30 }).isValid).toBe(true);
  });

  it('formats display with completed minutes when present', () => {
    expect(strategy.formatDisplay({ sets: '30', effectiveSets: '25' })).toBe(
      '30 minutes (25 min completed)'
    );
    expect(strategy.formatDisplay({ sets: '30', effectiveSets: '' })).toBe('30 minutes');
  });
});

describe('FlexibilityExerciseStrategy', () => {
  const strategy = new FlexibilityExerciseStrategy();

  it('uses reps but not weight', () => {
    expect(strategy.usesWeight()).toBe(false);
    expect(strategy.usesReps()).toBe(true);
  });

  it('rejects out-of-range hold times and reps', () => {
    expect(strategy.validate({ sets: 5, reps: 3 }).isValid).toBe(false);
    expect(strategy.validate({ sets: 30, reps: 11 }).isValid).toBe(false);
    expect(strategy.validate({ sets: 30, reps: 3 }).isValid).toBe(true);
  });
});

describe('ExerciseTypeFactory', () => {
  it('returns the correct strategy by type name (case-insensitive)', () => {
    expect(ExerciseTypeFactory.getStrategy('strength')).toBeInstanceOf(StrengthExerciseStrategy);
    expect(ExerciseTypeFactory.getStrategy('CARDIO')).toBeInstanceOf(CardioExerciseStrategy);
    expect(ExerciseTypeFactory.getStrategy('Flexibility')).toBeInstanceOf(FlexibilityExerciseStrategy);
  });

  it('throws for unknown types', () => {
    expect(() => ExerciseTypeFactory.getStrategy('plyometric')).toThrow();
  });

  it('routes Cardio muscle group → cardio strategy', () => {
    expect(ExerciseTypeFactory.getStrategyByMuscleGroup('Cardio')).toBeInstanceOf(CardioExerciseStrategy);
  });

  it('routes Flexibility muscle group → flexibility strategy', () => {
    expect(ExerciseTypeFactory.getStrategyByMuscleGroup('Flexibility')).toBeInstanceOf(FlexibilityExerciseStrategy);
  });

  it('defaults unknown muscle groups to strength', () => {
    expect(ExerciseTypeFactory.getStrategyByMuscleGroup('Chest')).toBeInstanceOf(StrengthExerciseStrategy);
    expect(ExerciseTypeFactory.getStrategyByMuscleGroup('Anything')).toBeInstanceOf(StrengthExerciseStrategy);
  });

  it('exposes the registered type names', () => {
    const types = ExerciseTypeFactory.getAvailableTypes();
    expect(types).toEqual(expect.arrayContaining(['strength', 'cardio', 'flexibility']));
  });
});
