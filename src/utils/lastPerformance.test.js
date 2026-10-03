import { describe, it, expect } from 'vitest';
import { lastPerformance } from './lastPerformance.js';
const exercise = { dbId: 1, name: 'Bench', weight: '100', reps: '8', effectiveSets: '3' };
const day = (...exercises) => ({ exercises });
describe('last logged performance', () => {
    it('finds the same movement across days and ignores plans, skipped work and future entries', () => {
        const history = { weeks: {
            '2026-09-21': { Friday: day(exercise) },
            '2026-09-28': {
                Monday: day({ ...exercise, weight: '105' }),
                Tuesday: day({ ...exercise, weight: '110', status: 'skipped' }),
                Wednesday: day({ ...exercise, weight: '120', effectiveSets: '', status: 'incomplete' }),
                Friday: day({ ...exercise, weight: '999' })
            }
        } };
        expect(lastPerformance(history, '2026-09-28', 'Thursday', exercise, new Date(2026, 9, 1))).toMatchObject({ weight: '105', sourceDay: 'Monday' });
        expect(lastPerformance(history, '2026-09-28', 'Monday', exercise, new Date(2026, 9, 1))).toMatchObject({ weight: '100', sourceDay: 'Friday' });
    });
    it('matches custom movements by normalized name and never fabricates a previous workout', () => {
        const history = { weeks: { '2026-09-28': { Monday: day({ name: ' My Lift ', reps: '10', status: 'completed' }) } } };
        expect(lastPerformance(history, '2026-09-28', 'Tuesday', { name: 'my lift' }, new Date(2026, 9, 1))?.reps).toBe('10');
        expect(lastPerformance(history, '2026-09-28', 'Tuesday', exercise)).toBeNull();
    });
});
