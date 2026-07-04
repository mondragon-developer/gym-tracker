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
 * Older data (a bare WorkoutPlan keyed by day names) is a version-1 blob and is
 * migrated in place on load. All functions are PURE — no storage side effects —
 * so callers control persistence.
 */

import workoutService from './workoutService.js';
import { getWeekStart } from '../utils/dateHelper.js';
import { DAYS_OF_WEEK } from '../constants/AppConstants.js';

const CURRENT_VERSION = 2;

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

const freshHistory = () => {
    const weekStart = getWeekStart();
    return {
        version: CURRENT_VERSION,
        currentWeekStart: weekStart,
        weeks: { [weekStart]: workoutService.getInitialPlan() }
    };
};

const WeekPlanService = {
    CURRENT_VERSION,

    /**
     * Normalizes any stored blob (null, a v1 bare plan, or a v2 history) into a
     * valid v2 history object.
     * @param {Object|null} raw
     * @returns {Object} history
     */
    migrate(raw) {
        if (!raw) return freshHistory();

        if (isHistory(raw)) {
            const weeks = {};
            Object.keys(raw.weeks).forEach(ws => { weeks[ws] = ensureAllDays(raw.weeks[ws]); });
            // Guarantee the pointed-at current week exists.
            const currentWeekStart = weeks[raw.currentWeekStart]
                ? raw.currentWeekStart
                : (Object.keys(weeks).sort().pop() || getWeekStart());
            if (!weeks[currentWeekStart]) weeks[currentWeekStart] = workoutService.getInitialPlan();
            return { version: CURRENT_VERSION, currentWeekStart, weeks };
        }

        // Treat anything else as a v1 bare plan (day-keyed WorkoutPlan).
        const weekStart = getWeekStart();
        return {
            version: CURRENT_VERSION,
            currentWeekStart: weekStart,
            weeks: { [weekStart]: ensureAllDays(raw) }
        };
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
     * Starts a new week, carrying the current plan forward: same exercises and
     * weights, but completion reset so the user re-logs the week. The finished
     * week stays archived under its own key. Returns a NEW history object.
     * @param {Object} history
     * @returns {Object} history
     */
    startNewWeek(history) {
        const currentPlan = WeekPlanService.getCurrentPlan(history) || workoutService.getInitialPlan();
        const carried = {};
        DAYS_OF_WEEK.forEach(day => {
            const dayPlan = currentPlan[day];
            carried[day] = {
                ...dayPlan,
                exercises: (dayPlan?.exercises ?? []).map(ex => ({
                    ...ex,
                    status: 'incomplete',
                    effectiveSets: ''
                }))
            };
        });

        const newWeekStart = getWeekStart();
        return {
            version: CURRENT_VERSION,
            currentWeekStart: newWeekStart,
            weeks: { ...deepClone(history.weeks), [newWeekStart]: carried }
        };
    }
};

export default WeekPlanService;