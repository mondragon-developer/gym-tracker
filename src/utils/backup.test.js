import { describe, it, expect } from 'vitest';
import { buildBackup, parseBackup, backupFileName, BACKUP_VERSION } from './backup.js';
import WeekPlanService from '../services/WeekPlanService.js';

const TODAY = new Date(2026, 8, 25);

const sampleHistory = () => {
    const history = WeekPlanService.migrate(null, TODAY);
    const week = history.weeks[history.currentWeekStart];
    week.Monday = { ...week.Monday, name: 'Push', exercises: [{ id: 'c1', name: 'Sled Push', dbId: null, sets: '4', reps: '20' }] };
    return history;
};

describe('backup files', () => {
    it('round-trips a history, custom exercises included', () => {
        const history = sampleHistory();
        const text = JSON.stringify(buildBackup(history, TODAY));
        const result = parseBackup(text, TODAY);
        expect(result.ok).toBe(true);
        expect(result.history.weeks[history.currentWeekStart].Monday.exercises[0].name).toBe('Sled Push');
        expect(result.summary.weeks).toBe(1);
        expect(result.summary.firstWeek).toBe(history.currentWeekStart);
        expect(result.exportedAt).toBe(TODAY.toISOString());
    });

    it('names the file with the date', () => {
        expect(backupFileName(TODAY)).toBe('gym-tracker-backup-2026-09-25.json');
    });

    it('rolls an old backup forward to the current week', () => {
        const old = sampleHistory();
        const text = JSON.stringify(buildBackup(old, TODAY));
        const later = new Date(2026, 10, 20);
        const result = parseBackup(text, later);
        expect(result.history.currentWeekStart > old.currentWeekStart).toBe(true);
        expect(result.history.weeks[old.currentWeekStart]).toBeDefined();
    });

    it('rejects files that are not backups', () => {
        expect(parseBackup('', TODAY).ok).toBe(false);
        expect(parseBackup('not json', TODAY).error).toBe('This file is not a Gym Tracker backup.');
        expect(parseBackup(JSON.stringify({ hello: 'world' }), TODAY).ok).toBe(false);
        expect(parseBackup(JSON.stringify({ app: 'gym-tracker', kind: 'backup', version: 1, history: { weeks: { '2026-09-21': { note: 'x' } } } }), TODAY).error)
            .toBe('This backup has no workout weeks in it.');
    });

    it('rejects a backup from a newer format', () => {
        const text = JSON.stringify({ ...buildBackup(sampleHistory(), TODAY), version: BACKUP_VERSION + 1 });
        expect(parseBackup(text, TODAY).error).toMatch(/newer version/);
    });

    it('drops malformed week entries and keeps the good ones', () => {
        const backup = buildBackup(sampleHistory(), TODAY);
        backup.history.weeks['not-a-date'] = backup.history.weeks[backup.history.currentWeekStart];
        backup.history.weeks['2026-01-05'] = 'garbage';
        const result = parseBackup(JSON.stringify(backup), TODAY);
        expect(result.ok).toBe(true);
        expect(result.summary.weeks).toBe(1);
        expect(Object.keys(result.history.weeks)).not.toContain('not-a-date');
    });
});
