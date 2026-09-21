import { describe, it, expect } from 'vitest';
import ProgressService from './ProgressService.js';
import { EXERCISE_DATABASE } from '../constants/index.js';

const idOf = (name) => EXERCISE_DATABASE.find(e => e.name === name).id;
const bench = idOf('Barbell Bench Press');
const bike = idOf('Stationary Bike');

const ex = (over) => ({ id: over.id ?? Math.random().toString(36).slice(2), dbId: null, name: 'x', sets: '3', reps: '10', weight: '', effectiveSets: '', status: 'incomplete', ...over });
const rest = () => ({ name: 'Rest', exercises: [] });
const week = (mondayExercises) => ({
    Monday: { name: 'Chest', exercises: mondayExercises }, Tuesday: rest(), Wednesday: rest(), Thursday: rest(), Friday: rest(), Saturday: rest(), Sunday: rest()
});

const history = {
    version: 2,
    currentWeekStart: '2026-09-21',
    weeks: {
        '2026-09-07': week([
            ex({ dbId: bench, name: 'Barbell Bench Press', sets: '4', reps: '8-10', weight: '100', effectiveSets: '4' }),
            ex({ name: 'Custom Row', sets: '3', reps: '12', weight: '', effectiveSets: '3' }),
            ex({ dbId: bike, name: 'Stationary Bike', sets: '20', reps: '', effectiveSets: '20' })
        ]),
        '2026-09-14': week([
            ex({ dbId: bench, name: 'Barbell Bench Press', sets: '4', reps: '8-10', weight: '105', effectiveSets: '3' }),
            ex({ dbId: bench, name: 'Barbell Bench Press', sets: '2', reps: '5', weight: '110', effectiveSets: '2' }),
            ex({ name: 'custom row', sets: '3', reps: '12', weight: '20', effectiveSets: '0' })
        ]),
        '2026-09-21': week([
            ex({ dbId: bench, name: 'Barbell Bench Press', sets: '4', reps: '8-10', weight: '105', effectiveSets: '' })
        ]),
        '2026-09-28': week([
            ex({ dbId: bench, name: 'Barbell Bench Press', sets: '4', reps: '8-10', weight: '200', effectiveSets: '4' })
        ])
    }
};

describe('ProgressService.buildProgress', () => {
    const progress = ProgressService.buildProgress(history);

    it('lists stored weeks up to the current one, oldest first, and ignores planned-ahead weeks', () => {
        expect(progress.weeks.map(w => w.weekStart)).toEqual(['2026-09-07', '2026-09-14', '2026-09-21']);
    });

    it('sums done sets x lower reps x weight, keeps cardio in minutes', () => {
        const [w1, w2, w3] = progress.weeks;
        expect(w1).toMatchObject({ volume: 4 * 8 * 100, doneSets: 7, cardioMinutes: 20, exercises: 3 });
        expect(w2).toMatchObject({ volume: 3 * 8 * 105 + 2 * 5 * 110, doneSets: 5, cardioMinutes: 0 });
        expect(w3).toMatchObject({ volume: 0, doneSets: 0 });
    });

    it('groups an exercise across weeks by library id, or by name for custom ones', () => {
        const names = progress.exercises.map(e => e.name);
        expect(names).toContain('Barbell Bench Press');
        expect(names.filter(n => /custom row/i.test(n))).toHaveLength(1);
        const benchRow = progress.exercises.find(e => e.dbId === bench);
        expect(benchRow.points.map(p => p.topWeight)).toEqual([100, 110, 0]);
        expect(benchRow).toMatchObject({ weeksLogged: 2, bestWeight: 110, lastWeight: 110, lastVolume: 3 * 8 * 105 + 2 * 5 * 110 });
        expect(benchRow.delta).toBe(benchRow.lastVolume - 4 * 8 * 100);
    });

    it('reports one logged week as no delta', () => {
        const custom = progress.exercises.find(e => /custom row/i.test(e.name));
        expect(custom).toMatchObject({ weeksLogged: 1, delta: null, bestWeight: 0 });
    });

    it('orders exercises by weeks logged, then latest volume', () => {
        expect(progress.exercises[0].dbId).toBe(bench);
    });

    it('counts weeks with data for the chart gate', () => {
        expect(ProgressService.weeksWithData(progress)).toBe(2);
        expect(ProgressService.weeksWithData(ProgressService.buildProgress(null))).toBe(0);
    });

    it('converts volume to kilograms for display', () => {
        expect(ProgressService.displayVolume(2204.6, 'kg')).toBe(1000);
        expect(ProgressService.displayVolume(1234.4, 'lbs')).toBe(1234);
    });

    it('exports per-exercise rows and weekly totals as CSV in the chosen unit', () => {
        const csv = ProgressService.toCsv(progress, 'en', 'lbs');
        const lines = csv.replace('﻿', '').split('\n');
        expect(lines[0]).toBe('Exercise,Week,Sets done,Top weight (lbs),Volume (lbs)');
        expect(lines).toContain('Barbell Bench Press,2026-09-07,4,100,3200');
        expect(lines).toContain('2026-09-07,7,3200,20');
        const spanish = ProgressService.toCsv(progress, 'es', 'kg');
        expect(spanish).toContain('Press de Banca con Barra,2026-09-07,4,45.4,1451');
    });
});
