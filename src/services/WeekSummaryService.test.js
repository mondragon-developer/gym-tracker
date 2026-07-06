import { describe, it, expect } from 'vitest';
import WeekSummaryService from './WeekSummaryService.js';
import workoutService from './workoutService.js';

const emptyWeek = () => ({
  Monday: { name: 'Rest', exercises: [] },
  Tuesday: { name: 'Rest', exercises: [] },
  Wednesday: { name: 'Rest', exercises: [] },
  Thursday: { name: 'Rest', exercises: [] },
  Friday: { name: 'Rest', exercises: [] },
  Saturday: { name: 'Rest', exercises: [] },
  Sunday: { name: 'Rest', exercises: [] }
});

describe('WeekSummaryService', () => {
  describe('buildSummary', () => {
    it('counts exercises and total sets on the default plan', () => {
      const plan = workoutService.getInitialPlan();
      const summary = WeekSummaryService.buildSummary(plan);

      const expectedExercises = Object.values(plan)
        .reduce((sum, day) => sum + day.exercises.length, 0);
      expect(summary.rows).toHaveLength(expectedExercises);
      expect(summary.totals.exercises).toBe(expectedExercises);

      const expectedSets = Object.values(plan)
        .flatMap(day => day.exercises)
        .reduce((sum, ex) => sum + parseInt(ex.sets, 10), 0);
      expect(summary.totals.totalSets).toBe(expectedSets);
    });

    it('groups sets per muscle using the exercise database', () => {
      const plan = emptyWeek();
      plan.Monday = {
        name: 'Chest & Triceps',
        exercises: [
          { id: 'a', dbId: 1, name: 'Barbell Bench Press', sets: '4', reps: '8', weight: '', effectiveSets: '2', status: 'completed' },
          { id: 'b', dbId: 2, name: 'Incline Dumbbell Press', sets: '3', reps: '10', weight: '', effectiveSets: '', status: 'incomplete' },
          { id: 'c', dbId: 30, name: 'Rope Pushdowns', sets: '3', reps: '12', weight: '', effectiveSets: '', status: 'incomplete' }
        ]
      };

      const summary = WeekSummaryService.buildSummary(plan);
      const chest = summary.byMuscle.find(g => g.muscle === 'Chest');
      const triceps = summary.byMuscle.find(g => g.muscle === 'Triceps');
      expect(chest).toMatchObject({ exercises: 2, sets: 7, doneSets: 2 });
      expect(triceps).toMatchObject({ exercises: 1, sets: 3 });
      // Sorted by planned sets, most-trained muscle first.
      expect(summary.byMuscle[0].muscle).toBe('Chest');
    });

    it('falls back to the day muscle group for custom exercises', () => {
      const plan = emptyWeek();
      plan.Friday = {
        name: 'Back & Biceps',
        exercises: [
          { id: 'x', dbId: null, name: 'My Custom Rows', sets: '5', reps: '10', weight: '', effectiveSets: '', status: 'incomplete' }
        ]
      };

      const summary = WeekSummaryService.buildSummary(plan);
      expect(summary.rows[0].muscleGroup).toBe('Back');
      expect(summary.byMuscle).toEqual([
        { muscle: 'Back', exercises: 1, sets: 5, doneSets: 0 }
      ]);
    });

    it('counts completed exercises and done sets', () => {
      const plan = emptyWeek();
      plan.Tuesday = {
        name: 'Legs',
        exercises: [
          { id: 'a', dbId: 60, name: 'Barbell Squats', sets: '4', reps: '8', weight: '135', effectiveSets: '4', status: 'completed' },
          { id: 'b', dbId: 61, name: 'Leg Press', sets: '3', reps: '12', weight: '', effectiveSets: '', status: 'skipped' }
        ]
      };

      const summary = WeekSummaryService.buildSummary(plan);
      expect(summary.totals.completed).toBe(1);
      expect(summary.totals.doneSets).toBe(4);
    });

    it('handles an empty week without errors', () => {
      const summary = WeekSummaryService.buildSummary(emptyWeek());
      expect(summary.rows).toHaveLength(0);
      expect(summary.totals.totalSets).toBe(0);
      expect(summary.byMuscle).toEqual([]);
    });

    it('tolerates a day missing its exercises array', () => {
      const plan = emptyWeek();
      plan.Wednesday = { name: 'Malformed day' };

      const summary = WeekSummaryService.buildSummary(plan);
      expect(summary.rows).toHaveLength(0);
      expect(summary.totals.exercises).toBe(0);
    });
  });

  describe('toCsv', () => {
    it('produces a header row and one line per exercise', () => {
      const plan = workoutService.getInitialPlan();
      const summary = WeekSummaryService.buildSummary(plan);
      const csv = WeekSummaryService.toCsv(summary, 'Jul 6 - Jul 12', 'en');

      expect(csv.startsWith('\uFEFF')).toBe(true);
      expect(csv).toContain('Day,Exercise,Muscle group,Sets,Reps,Weight,Sets done,Status');
      expect(csv).toContain('Monday,Barbell Bench Press,Chest,4,8-10,,0,incomplete');
      expect(csv).toContain('Total sets,');
    });

    it('escapes fields containing commas', () => {
      expect(WeekSummaryService.csvEscape('a,b')).toBe('"a,b"');
      expect(WeekSummaryService.csvEscape('say "hi"')).toBe('"say ""hi"""');
      expect(WeekSummaryService.csvEscape('plain')).toBe('plain');
    });

    it('neutralizes leading formula characters against spreadsheet injection', () => {
      expect(WeekSummaryService.csvEscape('=1+1')).toBe("'=1+1");
      expect(WeekSummaryService.csvEscape('+SUM(A1)')).toBe("'+SUM(A1)");
      expect(WeekSummaryService.csvEscape('-2+3')).toBe("'-2+3");
      expect(WeekSummaryService.csvEscape('@cmd')).toBe("'@cmd");
      expect(WeekSummaryService.csvEscape('=HYPERLINK("http://evil","x")'))
        .toBe('"\'=HYPERLINK(""http://evil"",""x"")"');
      // Normal values stay untouched.
      expect(WeekSummaryService.csvEscape('Barbell Squats')).toBe('Barbell Squats');
      expect(WeekSummaryService.csvEscape(4)).toBe('4');
    });

    it('translates headers and names in Spanish', () => {
      const plan = emptyWeek();
      plan.Monday = {
        name: 'Chest',
        exercises: [
          { id: 'a', dbId: 1, name: 'Barbell Bench Press', sets: '4', reps: '8', weight: '', effectiveSets: '', status: 'incomplete' }
        ]
      };
      const summary = WeekSummaryService.buildSummary(plan);
      const csv = WeekSummaryService.toCsv(summary, '6 jul - 12 jul', 'es');
      expect(csv).toContain('Lunes');
      expect(csv).toContain('Pecho');
    });
  });
});
