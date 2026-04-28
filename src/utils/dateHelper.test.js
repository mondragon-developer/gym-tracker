import { describe, it, expect, vi, afterEach } from 'vitest';
import { getToday } from './dateHelper.js';

describe('getToday', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns Monday on Mondays (Date.getDay()===1)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-27T12:00:00')); // Monday
    expect(getToday()).toBe('Monday');
  });

  it('returns Sunday on Sundays (Date.getDay()===0) — tests the (idx+6)%7 wrap', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-26T12:00:00')); // Sunday
    expect(getToday()).toBe('Sunday');
  });

  it('returns Wednesday for a midweek date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-29T12:00:00')); // Wednesday
    expect(getToday()).toBe('Wednesday');
  });

  it('returns Saturday on Saturdays', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-02T12:00:00')); // Saturday
    expect(getToday()).toBe('Saturday');
  });
});
