import { describe, it, expect } from 'vitest';
import { daysInactive, isInactive, activityLabel, INACTIVE_WARN_DAYS } from './activity.js';

const NOW = Date.parse('2026-09-25T12:00:00Z');
const daysAgo = (n) => new Date(NOW - n * 24 * 60 * 60 * 1000).toISOString();

describe('account activity', () => {
    it('counts whole days since the last open', () => {
        expect(daysInactive(daysAgo(0), NOW)).toBe(0);
        expect(daysInactive(daysAgo(12.5), NOW)).toBe(12);
        expect(daysInactive(null, NOW)).toBeNull();
        expect(daysInactive('not a date', NOW)).toBeNull();
    });

    it('flags accounts from the warning point on, and ones that never opened', () => {
        expect(isInactive(daysAgo(INACTIVE_WARN_DAYS - 1), NOW)).toBe(false);
        expect(isInactive(daysAgo(INACTIVE_WARN_DAYS), NOW)).toBe(true);
        expect(isInactive(null, NOW)).toBe(true);
    });

    it('labels activity in both languages', () => {
        expect(activityLabel(daysAgo(0), 'en', NOW)).toBe('Active today');
        expect(activityLabel(daysAgo(3), 'en', NOW)).toBe('Active 3 days ago');
        expect(activityLabel(daysAgo(3), 'es', NOW)).toBe('Activo hace 3 días');
        expect(activityLabel(null, 'es', NOW)).toBe('Nunca abierta');
    });
});
