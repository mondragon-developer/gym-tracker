import { describe, it, expect, beforeEach } from 'vitest';
import {
  StorageService,
  InMemoryStorageAdapter,
  StorageInterface,
} from './StorageService.js';

describe('StorageInterface', () => {
  it('throws on every base method to enforce contract', () => {
    const base = new StorageInterface();
    expect(() => base.get('k')).toThrow();
    expect(() => base.set('k', 1)).toThrow();
    expect(() => base.remove('k')).toThrow();
    expect(() => base.clear()).toThrow();
  });
});

describe('InMemoryStorageAdapter', () => {
  let adapter;

  beforeEach(() => {
    adapter = new InMemoryStorageAdapter();
  });

  it('returns null for missing keys', () => {
    expect(adapter.get('missing')).toBeNull();
  });

  it('round-trips arbitrary values without serialization', () => {
    const obj = { a: 1, b: [2, 3], c: { d: 'hello' } };
    adapter.set('k', obj);
    expect(adapter.get('k')).toBe(obj);
  });

  it('removes individual keys', () => {
    adapter.set('a', 1);
    adapter.set('b', 2);
    adapter.remove('a');
    expect(adapter.get('a')).toBeNull();
    expect(adapter.get('b')).toBe(2);
  });

  it('clears all keys', () => {
    adapter.set('a', 1);
    adapter.set('b', 2);
    adapter.clear();
    expect(adapter.get('a')).toBeNull();
    expect(adapter.get('b')).toBeNull();
  });
});

describe('StorageService', () => {
  let service;

  beforeEach(() => {
    service = new StorageService(new InMemoryStorageAdapter());
  });

  it('returns null when no plan has been saved', () => {
    expect(service.getWorkoutPlan()).toBeNull();
  });

  it('saves and retrieves a workout plan with the default key', () => {
    const plan = { Monday: { name: 'Chest', exercises: [] } };
    service.saveWorkoutPlan(plan);
    expect(service.getWorkoutPlan()).toEqual(plan);
  });

  it('honors custom storage keys for isolation', () => {
    service.saveWorkoutPlan({ a: 1 }, 'plan_a');
    service.saveWorkoutPlan({ b: 2 }, 'plan_b');
    expect(service.getWorkoutPlan('plan_a')).toEqual({ a: 1 });
    expect(service.getWorkoutPlan('plan_b')).toEqual({ b: 2 });
  });

  it('removes a workout plan', () => {
    service.saveWorkoutPlan({ x: 1 });
    service.removeWorkoutPlan();
    expect(service.getWorkoutPlan()).toBeNull();
  });

  it('persists user preferences alongside plans', () => {
    service.saveUserPreferences({ language: 'es' });
    expect(service.getUserPreferences()).toEqual({ language: 'es' });
  });
});
