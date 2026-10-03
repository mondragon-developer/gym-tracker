import { describe, it, expect } from 'vitest';
import { conditioningAction as act, conditioningClock as clock, conditioningConfig, conditioningScore } from './conditioning.js';
import WeekPlanService from '../services/WeekPlanService.js';
import { buildBackup, parseBackup } from './backup.js';

describe('conditioning clocks and scores', () => {
    it('uses wall-clock elapsed time across sleep, reload, pause and resume', () => {
        const start = act({ mode: 'amrap', minutes: 10 }, 'start', 1000);
        expect(clock(JSON.parse(JSON.stringify(start)), 62000).remainingMs).toBe(539000);
        const paused = act(start, 'pause', 62000);
        expect(clock(paused, 500000).elapsedMs).toBe(61000);
        const resumed = act(paused, 'resume', 500000);
        expect(clock(resumed, 510000).elapsedMs).toBe(71000);
        expect(clock(resumed, 2000000)).toMatchObject({ expired: true, running: false, elapsedMs: 600000 });
    });
    it('cycles EMOM minutes and prevents double-counting the same interval', () => {
        let value = act({ mode: 'emom', minutes: 3 }, 'start', 0);
        value = act(value, 'round', 1000);
        value = act(value, 'round', 2000);
        expect(value.session.rounds).toBe(1);
        expect(clock(value, 61000).interval).toBe(2);
        value = act(value, 'round', 61000);
        expect(value.session.rounds).toBe(2);
        expect(clock(value, 999999).interval).toBe(3);
        value = act(value, 'round', 181000);
        expect(value.session.rounds).toBe(3);
        value = act(value, 'finish', 181000);
        expect(conditioningScore(value)).toBe('Completed · 3:00 · 3 intervals');
    });
    it('distinguishes a for-time finish from an early stop and a time cap', () => {
        let value = act({ mode: 'forTime', minutes: 5, targetRounds: 2 }, 'start', 0);
        value = act(value, 'round', 20000);
        expect(act(value, 'finish', 30000).session.outcome).toBe('stopped');
        expect(act(value, 'finish', 400000).session.outcome).toBe('time-cap');
        value = act(value, 'round', 60000);
        const finish = act(value, 'finish', 62000);
        expect(conditioningScore(finish)).toBe('Completed · 1:00 · 2 rounds');
        expect(act(finish, 'resume', 99999)).toBe(finish);
    });
    it('cannot record for-time completion after the cap', () => {
        let value = act({ mode: 'forTime', minutes: 1, targetRounds: 2 }, 'start', 0);
        value = act(value, 'round', 10000);
        value = act(value, 'round', 65000);
        expect(value.session.rounds).toBe(1);
        expect(act(value, 'finish', 70000).session.outcome).toBe('time-cap');
    });
    it('records AMRAP extra reps and clamps malformed configuration', () => {
        let value = act({ mode: 'amrap', minutes: 1 }, 'start', 0);
        value = { ...value, session: { ...value.session, rounds: 2, extraReps: 7 } };
        expect(conditioningScore(act(value, 'finish', 60000), 'es')).toBe('Completado · 1:00 · 2 rondas + 7 reps');
        expect(conditioningConfig({ mode: 'unknown', minutes: Infinity, targetRounds: -2 })).toEqual({ mode: 'standard', minutes: 12, targetRounds: 1 });
    });
});

describe('workout history extensions', () => {
    it('retains favorites and results in backups while clearing sessions on carry-forward', () => {
        const today = new Date(2026, 9, 5);
        const history = WeekPlanService.migrate(null, new Date(2026, 8, 28));
        history.favoriteExerciseIds = [1, 247, 1, 99999];
        history.weeks['2026-09-28'].Monday.conditioning = act(act({ mode: 'amrap', minutes: 1 }, 'start', 0), 'finish', 60000);
        const restored = parseBackup(JSON.stringify(buildBackup(history)), today).history;
        expect(restored.favoriteExerciseIds).toEqual([1, 247]);
        expect(restored.weeks['2026-09-28'].Monday.conditioning.session.status).toBe('finished');
        expect(restored.weeks['2026-10-05'].Monday.conditioning).toMatchObject({ mode: 'amrap', minutes: 1, session: null });
        expect(WeekPlanService.startNewWeek(restored, '2026-10-05').favoriteExerciseIds).toEqual([1, 247]);
        expect(WeekPlanService.copyWeek(restored, '2026-09-28', '2026-10-12').weeks['2026-10-12'].Monday.conditioning.session).toBeNull();
    });
});
