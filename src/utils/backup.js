/**
 * Backup files: the user's whole workout history (every stored week,
 * custom exercises included, since they live inside the plan) as JSON the
 * user keeps, and the checks that decide whether a file can be restored.
 */

import WeekPlanService from '../services/WeekPlanService.js';
import { DAYS_OF_WEEK } from '../constants/AppConstants.js';

export const BACKUP_APP = 'gym-tracker';
export const BACKUP_KIND = 'backup';
export const BACKUP_VERSION = 1;
// A decade of weekly plans is well under this; anything bigger is not ours.
export const MAX_BACKUP_BYTES = 5 * 1024 * 1024;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const buildBackup = (history, now = new Date()) => ({
    app: BACKUP_APP,
    kind: BACKUP_KIND,
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    history
});

const pad = (n) => String(n).padStart(2, '0');

export const backupFileName = (now = new Date()) =>
    `gym-tracker-backup-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.json`;

const isPlainObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

// A stored week is an object keyed by weekday whose days carry an
// exercises array. Checked before migrate, which would otherwise turn any
// JSON into a default plan and make a wrong file look restorable.
const looksLikeWeek = (week) => isPlainObject(week)
    && DAYS_OF_WEEK.some(day => isPlainObject(week[day]) && Array.isArray(week[day].exercises));

const isExercise = (item) => isPlainObject(item) && typeof item.name === 'string' && item.name.trim() !== '';

const keepValidExercises = (week) => Object.fromEntries(Object.entries(week).map(([day, value]) => (
    isPlainObject(value) && Array.isArray(value.exercises)
        ? [day, { ...value, exercises: value.exercises.filter(isExercise) }]
        : [day, value]
)));

const countExercises = (week) => DAYS_OF_WEEK.reduce(
    (sum, day) => sum + (Array.isArray(week?.[day]?.exercises) ? week[day].exercises.length : 0),
    0
);

/**
 * @param {string} text the file contents
 * @param {Date} [today]
 * @returns {{ ok: true, history: object, exportedAt: string|null, summary: object }
 *          | { ok: false, error: string }}
 */
export const parseBackup = (text, today = new Date()) => {
    if (typeof text !== 'string' || !text.trim()) return { ok: false, error: 'The file is empty.' };
    if (text.length > MAX_BACKUP_BYTES) return { ok: false, error: 'This file is too large to be a Gym Tracker backup.' };

    let data;
    try {
        data = JSON.parse(text);
    } catch {
        return { ok: false, error: 'This file is not a Gym Tracker backup.' };
    }
    if (!isPlainObject(data) || data.app !== BACKUP_APP || data.kind !== BACKUP_KIND) {
        return { ok: false, error: 'This file is not a Gym Tracker backup.' };
    }
    if (typeof data.version !== 'number' || data.version > BACKUP_VERSION) {
        return { ok: false, error: 'This backup was made by a newer version of the app. Update the app and try again.' };
    }

    const raw = data.history;
    if (!isPlainObject(raw) || !isPlainObject(raw.weeks)) {
        return { ok: false, error: 'This backup has no workout weeks in it.' };
    }
    const weekKeys = Object.keys(raw.weeks).filter(key => ISO_DATE.test(key) && looksLikeWeek(raw.weeks[key]));
    if (weekKeys.length === 0) return { ok: false, error: 'This backup has no workout weeks in it.' };

    // A hand-edited file could hold entries that are not exercises; saved to
    // the cloud they would break rendering on every device, so they go.
    const cleaned = {
        ...raw,
        weeks: Object.fromEntries(weekKeys.map(key => [key, keepValidExercises(raw.weeks[key])]))
    };
    const history = WeekPlanService.migrate(cleaned, today);
    const stored = [...weekKeys].sort();
    const summary = {
        weeks: weekKeys.length,
        firstWeek: stored[0],
        lastWeek: stored[stored.length - 1],
        exercises: weekKeys.reduce((sum, key) => sum + countExercises(cleaned.weeks[key]), 0)
    };
    const exportedAt = typeof data.exportedAt === 'string' && !Number.isNaN(Date.parse(data.exportedAt))
        ? data.exportedAt
        : null;
    return { ok: true, history, exportedAt, summary };
};

/**
 * Saves the backup through the browser. Phones hand the file to their
 * Files / Downloads app. Returns false when the browser refused.
 */
export const downloadBackup = (history, now = new Date()) => {
    try {
        const blob = new Blob([JSON.stringify(buildBackup(history, now), null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = backupFileName(now);
        document.body.appendChild(link);
        link.click();
        link.remove();
        // Revoking at once cancels the download in some browsers.
        setTimeout(() => URL.revokeObjectURL(url), 30000);
        return true;
    } catch {
        return false;
    }
};
