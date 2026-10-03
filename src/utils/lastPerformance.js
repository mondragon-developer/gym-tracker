import { DAYS_OF_WEEK } from '../constants/AppConstants.js';
import { getDateForDay } from './dateHelper.js';
export const exerciseIdentity = exercise => exercise.dbId ? `db:${exercise.dbId}` : `name:${String(exercise.name || '').trim().toLowerCase()}`;

// Only logged work, strictly before the displayed day. Planned future values
// and copied-but-unperformed weeks must never masquerade as a previous result.
export function lastPerformance(history, weekStart, day, exercise, now = new Date()) {
    if (!history?.weeks || !weekStart) return null;
    const before = Math.min(getDateForDay(weekStart, day).getTime(), new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime());
    const key = exerciseIdentity(exercise);
    let latest = null;
    for (const week of Object.keys(history.weeks).filter(w => w <= weekStart).sort().reverse()) {
        for (const name of [...DAYS_OF_WEEK].reverse()) {
            const date = getDateForDay(week, name);
            if (date.getTime() >= before) continue;
            const conditioning = history.weeks[week]?.[name]?.conditioning;
            if (conditioning?.mode && conditioning.mode !== 'standard') continue;
            const found = (history.weeks[week]?.[name]?.exercises || []).find(item => exerciseIdentity(item) === key && item.status !== 'skipped' && (Number(item.effectiveSets) > 0 || item.status === 'completed'));
            if (found && (!latest || date.getTime() > latest.date.getTime())) latest = { ...found, date, sourceDay: name, sourceWeek: week };
        }
        if (latest) break;
    }
    return latest;
}
