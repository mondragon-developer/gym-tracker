import { describe, it, expect } from 'vitest';
import WeekPlanService from './WeekPlanService.js';
import workoutService from './workoutService.js';
import { DAYS_OF_WEEK } from '../constants/AppConstants.js';

describe('WeekPlanService', () => {
  describe('migrate', () => {
    it('creates a fresh history from null', () => {
      const h = WeekPlanService.migrate(null);
      expect(h.version).toBe(2);
      expect(Object.keys(h.weeks)).toHaveLength(1);
      expect(h.weeks[h.currentWeekStart]).toBeTruthy();
      // Fresh week is the default plan — has all 7 days.
      DAYS_OF_WEEK.forEach(day => expect(h.weeks[h.currentWeekStart][day]).toBeTruthy());
    });

    it('wraps a v1 bare plan into a single-week v2 history', () => {
      const barePlan = workoutService.getInitialPlan();
      const h = WeekPlanService.migrate(barePlan);
      expect(h.version).toBe(2);
      expect(Object.keys(h.weeks)).toHaveLength(1);
      // The wrapped week preserves the original plan's Monday exercises.
      expect(h.weeks[h.currentWeekStart].Monday.exercises).toEqual(barePlan.Monday.exercises);
    });

    it('is idempotent on an existing v2 history', () => {
      const once = WeekPlanService.migrate(null);
      const twice = WeekPlanService.migrate(once);
      expect(twice.currentWeekStart).toBe(once.currentWeekStart);
      expect(Object.keys(twice.weeks)).toEqual(Object.keys(once.weeks));
    });

    it('repairs a history whose currentWeekStart points at a missing week', () => {
      const h = WeekPlanService.migrate(null);
      const broken = { ...h, currentWeekStart: '1999-01-04' };
      const fixed = WeekPlanService.migrate(broken);
      expect(fixed.weeks[fixed.currentWeekStart]).toBeTruthy();
    });
  });

  describe('startNewWeek', () => {
    it('carries weights forward but resets completion, archiving the old week', () => {
      // Force the "current" week to a fixed PAST Monday so startNewWeek (which
      // keys the new week by today) always produces a distinct, archivable key.
      const pastWeek = '2020-01-06'; // a Monday
      const h = WeekPlanService.migrate(null);
      h.weeks[pastWeek] = h.weeks[h.currentWeekStart];
      delete h.weeks[h.currentWeekStart];
      h.currentWeekStart = pastWeek;

      // Simulate a completed week: set a weight and mark the first exercise done.
      const plan = h.weeks[pastWeek];
      plan.Monday.exercises[0].weight = '135';
      plan.Monday.exercises[0].status = 'completed';
      plan.Monday.exercises[0].effectiveSets = '4';

      const next = WeekPlanService.startNewWeek(h);
      expect(next.currentWeekStart).not.toBe(pastWeek);

      const ex = next.weeks[next.currentWeekStart].Monday.exercises[0];
      // Weight carried over…
      expect(ex.weight).toBe('135');
      // …but progress reset.
      expect(ex.status).toBe('incomplete');
      expect(ex.effectiveSets).toBe('');

      // Old week is still archived with its original completion intact.
      expect(next.weeks[pastWeek].Monday.exercises[0].status).toBe('completed');
    });

    it('restarts the same calendar week in place, keeping weights', () => {
      // When invoked within the same week, there is no separate week to archive —
      // it resets completion but preserves the weights you were using.
      const h = WeekPlanService.migrate(null);
      const week = h.currentWeekStart;
      h.weeks[week].Monday.exercises[0].weight = '225';
      h.weeks[week].Monday.exercises[0].status = 'completed';

      const next = WeekPlanService.startNewWeek(h);
      expect(next.currentWeekStart).toBe(week);
      expect(next.weeks[week].Monday.exercises[0].weight).toBe('225');
      expect(next.weeks[week].Monday.exercises[0].status).toBe('incomplete');
    });

    it('does not mutate the input history', () => {
      const h = WeekPlanService.migrate(null);
      const before = JSON.stringify(h);
      WeekPlanService.startNewWeek(h);
      expect(JSON.stringify(h)).toBe(before);
    });
  });

  describe('listWeekStarts', () => {
    it('returns week keys newest-first', () => {
      const h = WeekPlanService.migrate(null);
      h.weeks['2020-01-06'] = workoutService.getInitialPlan();
      h.weeks['2020-01-13'] = workoutService.getInitialPlan();
      const list = WeekPlanService.listWeekStarts(h);
      expect(list[list.length - 1]).toBe('2020-01-06');
      expect(list.indexOf('2020-01-13')).toBeLessThan(list.indexOf('2020-01-06'));
    });
  });
});
