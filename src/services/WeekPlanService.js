/**
 * Week Plan Service - versioned weekly history for a user's workout data.
 *
 * The app persists ONE object per user (cloud row or local-storage entry). This
 * service owns the shape of that object and the rules for evolving it, so the
 * storage layer and hooks stay dumb (they just read/write whatever blob we give).
 *
 * Stored shape (version 2):
 *   {
 *     version: 2,
 *     currentWeekStart: "YYYY-MM-DD",           // Monday of the active week
 *     weeks: { "YYYY-MM-DD": <WorkoutPlan>, … }  // one entry per started week
 *   }
 *
 * Weeks are calendar weeks, Monday to Sunday. The current week is always the
 * calendar week of today: migrate() rolls a stale history forward, carrying
 * the latest plan into this week and archiving the old one. Users never have
 * to start a week by hand.
 *
 * Older data (a bare WorkoutPlan keyed by day names) is a version-1 blob and is
 * migrated in place on load. All functions are PURE — no storage side effects —
 * so callers control persistence.
 */

import workoutService from './workoutService.js';
import { getWeekStart, parseISODate, addWeeks } from '../utils/dateHelper.js';
import { DAYS_OF_WEEK } from '../constants/AppConstants.js';

const CURRENT_VERSION = 2;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
// How far ahead a user or trainer can plan. Future weeks are stored only
// once edited; until then they are previews carried from the latest plan.
const MAX_WEEKS_AHEAD = 12;

const deepClone = (obj) =>
    typeof structuredClone === 'function' ? structuredClone(obj) : JSON.parse(JSON.stringify(obj));

/**
 * Ensures a plan has every day present, filling gaps from the default plan.
 * Pure (unlike workoutService.migrateWorkoutPlan, which writes to storage).
 */
const ensureAllDays = (plan) => {
    const initial = workoutService.getInitialPlan();
    const merged = {};
    DAYS_OF_WEEK.forEach(day => {
        merged[day] = plan && plan[day] ? plan[day] : initial[day];
    });
    return merged;
};

/**
 * True when a raw blob is already the version-2 history shape.
 */
const isHistory = (raw) => Boolean(raw && raw.version === CURRENT_VERSION && raw.weeks);

/**
 * Week keys must be Mondays. Anything else (bad clock, hand-edited data) is
 * snapped to the Monday of its week; unparseable keys are left alone.
 */
const snapToMonday = (weekStart) =>
    ISO_DATE.test(weekStart) ? getWeekStart(parseISODate(weekStart)) : weekStart;

/**
 * Same exercises and weights as the source plan, completion cleared.
 */
const carryForward = (plan) => {
    const carried = {};
    DAYS_OF_WEEK.forEach(day => {
        const dayPlan = plan?.[day];
        carried[day] = {
            ...dayPlan,
            exercises: (dayPlan?.exercises ?? []).map(ex => ({
                ...ex,
                status: 'incomplete',
                effectiveSets: ''
            }))
        };
    });
    return carried;
};

/**
 * Newest stored week strictly before `weekStart`, or null.
 */
const latestWeekBefore = (history, weekStart) =>
    Object.keys(history.weeks).filter(ws => ws < weekStart).sort().pop() ?? null;

const freshHistory = (today = new Date()) => {
    const weekStart = getWeekStart(today);
    return {
        version: CURRENT_VERSION,
        currentWeekStart: weekStart,
        weeks: { [weekStart]: workoutService.getInitialPlan() }
    };
};

const WeekPlanService = {
    CURRENT_VERSION,
    MAX_WEEKS_AHEAD,

    /**
     * Normalizes any stored blob (null, a v1 bare plan, or a v2 history) into a
     * valid v2 history whose current week is the calendar week of today.
     * @param {Object|null} raw
     * @param {Date} [today=new Date()]
     * @returns {Object} history
     */
    migrate(raw, today = new Date()) {
        if (!raw) return freshHistory(today);

        if (isHistory(raw)) {
            const weeks = {};
            // Keys that are already Mondays win over duplicates that snap onto them.
            const rawKeys = Object.keys(raw.weeks);
            const ordered = [
                ...rawKeys.filter(ws => snapToMonday(ws) === ws),
                ...rawKeys.filter(ws => snapToMonday(ws) !== ws)
            ];
            ordered.forEach(ws => {
                const key = snapToMonday(ws);
                if (!weeks[key]) weeks[key] = ensureAllDays(raw.weeks[ws]);
            });

            // Guarantee the pointed-at current week exists.
            const wanted = snapToMonday(String(raw.currentWeekStart ?? ''));
            const currentWeekStart = weeks[wanted]
                ? wanted
                : (Object.keys(weeks).sort().pop() || getWeekStart(today));
            if (!weeks[currentWeekStart]) weeks[currentWeekStart] = workoutService.getInitialPlan();

            return WeekPlanService.rollForward({ version: CURRENT_VERSION, currentWeekStart, weeks }, today);
        }

        // Treat anything else as a v1 bare plan (day-keyed WorkoutPlan).
        const weekStart = getWeekStart(today);
        return {
            version: CURRENT_VERSION,
            currentWeekStart: weekStart,
            weeks: { [weekStart]: ensureAllDays(raw) }
        };
    },

    /**
     * Moves a history whose current week is in the past up to the calendar
     * week of `today`, carrying the plan forward and archiving the old week.
     * Returns the SAME object when nothing needs to change, so callers can use
     * identity to detect a roll.
     * @param {Object} history
     * @param {Date} [today=new Date()]
     * @returns {Object} history
     */
    rollForward(history, today = new Date()) {
        if (!history) return history;
        const thisWeek = getWeekStart(today);
        if (history.currentWeekStart >= thisWeek) return history;
        // A week planned in advance becomes the current week as it was
        // planned; otherwise carry from the newest week before today.
        if (history.weeks[thisWeek]) {
            return { ...history, currentWeekStart: thisWeek };
        }
        const source = latestWeekBefore(history, thisWeek);
        const plan = (source && history.weeks[source])
            || WeekPlanService.getCurrentPlan(history)
            || workoutService.getInitialPlan();
        return {
            version: CURRENT_VERSION,
            currentWeekStart: thisWeek,
            weeks: { ...deepClone(history.weeks), [thisWeek]: carryForward(plan) }
        };
    },

    /**
     * The plan to show for a week: the stored one, or for a future week that
     * has not been edited yet, a preview carried from the newest week before
     * it. Past weeks that were never stored return null.
     * @param {Object} history
     * @param {string} weekStart
     * @returns {Object|null} WorkoutPlan
     */
    resolveWeek(history, weekStart) {
        if (!history || !weekStart) return null;
        if (history.weeks[weekStart]) return history.weeks[weekStart];
        if (weekStart <= history.currentWeekStart) return null;
        const source = latestWeekBefore(history, weekStart);
        return carryForward(source ? history.weeks[source] : workoutService.getInitialPlan());
    },

    /**
     * Stores a plan under a week key (this is how a previewed future week
     * becomes real). Returns a NEW history object.
     */
    setWeek(history, weekStart, plan) {
        return { ...history, weeks: { ...history.weeks, [weekStart]: plan } };
    },

    /**
     * Every week the navigator can show, oldest first: all stored weeks plus
     * the current week and the next MAX_WEEKS_AHEAD Mondays.
     * @param {Object} history
     * @returns {string[]}
     */
    listNavigableWeeks(history) {
        const keys = new Set(Object.keys(history.weeks));
        for (let k = 0; k <= MAX_WEEKS_AHEAD; k++) {
            keys.add(addWeeks(history.currentWeekStart, k));
        }
        return [...keys].sort();
    },

    /**
     * Week-start keys newest-first.
     * @param {Object} history
     * @returns {string[]}
     */
    listWeekStarts(history) {
        return Object.keys(history.weeks).sort().reverse();
    },

    /**
     * The plan for a specific week (or null if that week doesn't exist).
     */
    getWeek(history, weekStart) {
        return history.weeks[weekStart] ?? null;
    },

    /**
     * The active week's plan.
     */
    getCurrentPlan(history) {
        return history.weeks[history.currentWeekStart] ?? null;
    },

    /**
     * Starts (or restarts) a week keyed by `weekStart`, carrying the current
     * plan forward: same exercises and weights, completion reset so the user
     * re-logs the week. The previous week stays archived under its own key.
     * Called with today's week while already in it, this simply clears the
     * week's progress. Returns a NEW history object.
     * @param {Object} history
     * @param {string} [weekStart=getWeekStart()] - Monday key of the new week
     * @returns {Object} history
     */
    startNewWeek(history, weekStart = getWeekStart()) {
        const currentPlan = WeekPlanService.getCurrentPlan(history) || workoutService.getInitialPlan();
        return {
            version: CURRENT_VERSION,
            currentWeekStart: weekStart,
            weeks: { ...deepClone(history.weeks), [weekStart]: carryForward(currentPlan) }
        };
    }
};

export default WeekPlanService;
