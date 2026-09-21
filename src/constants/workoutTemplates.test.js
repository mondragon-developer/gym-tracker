import { describe, it, expect } from 'vitest';
import { WORKOUT_TEMPLATES, getWorkoutTemplate } from './workoutTemplates.js';
import { EXERCISE_DATABASE } from './index.js';
import { DAYS_OF_WEEK, INDIVIDUAL_MUSCLE_GROUPS } from './AppConstants.js';

const validGroups = new Set(INDIVIDUAL_MUSCLE_GROUPS);

describe('workout templates', () => {
  it('exposes the three default plans', () => {
    expect(WORKOUT_TEMPLATES.map(tpl => tpl.id)).toEqual(['ppl', 'upper-lower', 'full-body-3', 'home-bodyweight', 'dumbbell-only']);
    expect(getWorkoutTemplate('upper-lower').daysPerWeek).toBe(4);
    expect(getWorkoutTemplate('nope')).toBeNull();
  });

  WORKOUT_TEMPLATES.forEach(tpl => {
    describe(tpl.id, () => {
      const plan = tpl.build();

      it('covers all seven days with valid muscle-group labels', () => {
        DAYS_OF_WEEK.forEach(day => {
          expect(plan[day]).toBeTruthy();
          plan[day].name.split(' & ').forEach(part => expect(validGroups.has(part)).toBe(true));
        });
      });

      it('trains the advertised number of days, plus any active-recovery day', () => {
        const activeDays = DAYS_OF_WEEK.filter(day => plan[day].exercises.length > 0);
        expect(activeDays).toHaveLength(tpl.daysPerWeek + (tpl.recoveryDays ?? 0));
      });

      it('only uses exercises from the library, with fresh progress and unique ids', () => {
        const ids = new Set();
        DAYS_OF_WEEK.forEach(day => {
          plan[day].exercises.forEach(item => {
            const entry = EXERCISE_DATABASE.find(e => e.id === item.dbId);
            expect(entry).toBeTruthy();
            expect(item.name).toBe(entry.name);
            expect(item.status).toBe('incomplete');
            expect(item.effectiveSets).toBe('');
            expect(item.weight).toBe('');
            expect(ids.has(`${day}-${item.id}`)).toBe(false);
            ids.add(`${day}-${item.id}`);
          });
        });
      });

      it('returns a fresh object on every build', () => {
        expect(tpl.build()).not.toBe(plan);
      });
    });
  });

  it('keeps the busy-schedule plan short', () => {
    const plan = getWorkoutTemplate('full-body-3').build();
    DAYS_OF_WEEK.forEach(day => expect(plan[day].exercises.length).toBeLessThanOrEqual(5));
  });

  it('home and dumbbell templates only use exercises that match their equipment promise', async () => {
    const eq = await import('../data/exerciseEquipment.js');
    const equipment = eq.default ?? eq.EXERCISE_EQUIPMENT ?? Object.values(eq)[0];
    const allowed = {
      'home-bodyweight': new Set(['body weight', undefined]),
      'dumbbell-only': new Set(['dumbbell', 'body weight', undefined])
    };
    Object.entries(allowed).forEach(([id, ok]) => {
      const plan = getWorkoutTemplate(id).build();
      DAYS_OF_WEEK.forEach(day => plan[day].exercises.forEach(item => {
        expect(ok.has(equipment[item.dbId]), `${id}: ${item.name} uses ${equipment[item.dbId]}`).toBe(true);
      }));
    });
  });
});
