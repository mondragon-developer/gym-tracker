/**
 * Turns a GYMPLAN block written by the AI coach (and pasted by the user)
 * into a week the app can apply. Two pure steps: parsePlanText reads the
 * lines and resolves names, buildWeekFromImport merges the result into
 * the viewed week according to the user's choices in the preview.
 *
 * Format (one fenced block, English or Spanish):
 *   GYMPLAN v1
 *   Monday: Chest & Triceps
 *   - Barbell Bench Press 4x6-8
 *   - Stationary Bike 20 min
 *   note: Warm up first
 *   Tuesday: Rest
 */

import { DAYS_OF_WEEK } from '../constants/AppConstants.js';
import { EXERCISE_DATABASE } from '../constants/index.js';
import ExerciseService from '../services/ExerciseService.js';
import { fromDisplayWeight } from './weightUnits.js';
import { resolveExerciseName, resolveMuscleGroups, resolveWeekday } from './exerciseResolver.js';

export const PLAN_FORMAT_VERSION = 1;
export const IMPORT_PRESETS = Object.freeze({ REPLACE: 'replace', MERGE: 'merge' });
export const DAY_MODES = Object.freeze({ REPLACE: 'replace', ADD: 'add', SKIP: 'skip' });

const DURATION_GROUPS = new Set(['Cardio', 'Combat']);
const DEFAULT_SETS = '3';
const DEFAULT_REPS = '10';
const DEFAULT_MINUTES = '20';
const NOTE_PREFIX = /^(note|nota|notes|notas)\s*:\s*/i;
const CUSTOM_LINE = /^(custom|personalizad[oa])\s*:/i;
const HEADER = /^gymplan\s*v?(\d+)$/i;
const SETS_REPS = /^(.*?)[\s:]+(\d{1,2})\s*(?:sets?|series)?\s*x?\s*(\d{1,3}(?:\s*-\s*\d{1,3})?\s*s?|max)\s*(?:reps?|repeticiones)?(?:\s*@\s*([\d.,]+)\s*(kg|kgs|lb|lbs)?)?\s*$/i;
const MINUTES = /^(.*?)[\s:]+(\d{1,3})\s*(?:min|mins|minutes|minutos)\s*$/i;

// Chat clients turn "-" into dashes and "x" into a multiplication sign,
// and copied markdown carries bullets, bold and code fences.
export const normalizeLine = (line) => String(line ?? '')
    .replace(/\u00a0/g, ' ')
    .replace(/[\u2013\u2014\u2212\u2011]/g, '-')
    .replace(/[\u00d7\u2715]/g, 'x')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/^\s*(?:```.*|>+)\s*/, '')
    .replace(/^\s*(?:[-*\u2022]|\d+[.)])\s+/, '')
    .replace(/\*\*|__/g, '')
    .trim();

const stripTrailingParenthetical = (name) => {
    const stripped = name.replace(/\s*\([^)]*\)\s*$/, '').trim();
    return { name: stripped, dropped: stripped !== name.trim() };
};

const parseExerciseLine = (rawLine) => {
    const { name: line, dropped } = stripTrailingParenthetical(rawLine);
    const minutes = line.match(MINUTES);
    if (minutes) {
        return { rawName: minutes[1].trim(), sets: null, reps: null, minutes: minutes[2], weight: null, weightUnit: null, dropped };
    }
    const setsReps = line.match(SETS_REPS);
    if (setsReps) {
        return {
            rawName: setsReps[1].trim(),
            sets: setsReps[2],
            reps: setsReps[3].replace(/\s+/g, ''),
            minutes: null,
            weight: setsReps[4] ? setsReps[4].replace(',', '.') : null,
            weightUnit: setsReps[5] ? setsReps[5].toLowerCase().replace(/s$/, '') : null,
            dropped
        };
    }
    return null;
};

/**
 * True when pasted text carries a plan: the header, or at least one weekday
 * line that parses. Used to open the importer from a paste anywhere on the
 * page without running the full preview first.
 */
export const looksLikePlan = (text) => {
    const value = String(text ?? '');
    if (!value.trim() || value.length > 20000) return false;
    if (/gymplan\s*v?\d/i.test(value)) return true;
    return Object.keys(parsePlanText(value).days).length > 0;
};

/**
 * The GYMPLAN block out of a whole coach reply: from the header to the
 * closing code fence, or to the end when the block is not fenced. Returns
 * null when the reply has no header, so ordinary answers that mention a
 * weekday are not offered as plans.
 * @param {string} text
 * @returns {string|null}
 */
export const extractPlanBlock = (text) => {
    const lines = String(text ?? '').split(/\r?\n/);
    const start = lines.findIndex(line => HEADER.test(normalizeLine(line)));
    if (start === -1) return null;
    const fence = lines.findIndex((line, i) => i > start && /^\s*```/.test(line));
    const block = lines.slice(start, fence === -1 ? lines.length : fence);
    return block.map(line => line.replace(/^\s*```\w*\s*/, '')).join('\n').trim();
};

/**
 * @param {string} text the pasted block, with any prose around it
 * @returns {{ version: number|null, days: object, errors: Array, warnings: Array }}
 */
export const parsePlanText = (text) => {
    const days = {};
    const errors = [];
    const warnings = [];
    let version = null;
    let currentDay = null;

    const lines = String(text ?? '').split(/\r?\n/);
    lines.forEach((raw, index) => {
        const lineNo = index + 1;
        const line = normalizeLine(raw);
        if (!line || /^```/.test(raw.trim())) return;

        const header = line.match(HEADER);
        if (header) {
            version = Number(header[1]);
            if (version > PLAN_FORMAT_VERSION) errors.push({ line: lineNo, message: 'Unsupported plan version' });
            return;
        }

        const note = line.match(NOTE_PREFIX);
        if (note && currentDay) {
            const body = line.replace(NOTE_PREFIX, '').trim();
            days[currentDay].note = days[currentDay].note ? `${days[currentDay].note}\n${body}` : body;
            return;
        }

        const colon = line.indexOf(':');
        if (colon > 0) {
            const weekday = resolveWeekday(line.slice(0, colon));
            if (weekday) {
                if (days[weekday]) {
                    errors.push({ line: lineNo, message: 'Day listed twice', name: weekday });
                    return;
                }
                const label = line.slice(colon + 1).trim();
                const { groups, unknown, truncated } = resolveMuscleGroups(label);
                unknown.forEach(name => warnings.push({ line: lineNo, message: 'Unknown muscle group', name }));
                if (truncated) warnings.push({ line: lineNo, message: 'Only three muscle groups per day', name: weekday });
                days[weekday] = { groups, rest: groups[0] === 'Rest', note: null, exercises: [], line: lineNo };
                currentDay = weekday;
                return;
            }
        }

        const spec = parseExerciseLine(line);
        if (!spec) {
            warnings.push({ line: lineNo, message: 'Skipped line', name: line.slice(0, 40) });
            return;
        }
        if (!currentDay) {
            errors.push({ line: lineNo, message: 'Exercise before any day line', name: spec.rawName });
            return;
        }
        if (spec.dropped) warnings.push({ line: lineNo, message: 'Dropped a note in parentheses', name: spec.rawName });
        let name = spec.rawName;
        let match = resolveExerciseName(name);
        if (match.dbId === null && !CUSTOM_LINE.test(name)) {
            const stripped = stripTrailingParenthetical(name);
            if (stripped.dropped) {
                const retry = resolveExerciseName(stripped.name);
                if (retry.dbId !== null) {
                    name = stripped.name;
                    match = retry;
                    warnings.push({ line: lineNo, message: 'Dropped a note in parentheses', name });
                }
            }
        }
        const day = days[currentDay];
        day.exercises.push({
            key: `${currentDay}-${day.exercises.length}`,
            line: lineNo,
            rawName: spec.rawName,
            typedName: name.replace(/^(custom|personalizad[oa])\s*:\s*/i, '').trim(),
            name: match.name,
            sets: spec.sets,
            reps: spec.reps,
            minutes: spec.minutes,
            weight: spec.weight,
            weightUnit: spec.weightUnit,
            match
        });
    });

    if (version === null && Object.keys(days).length > 0) {
        warnings.push({ line: 1, message: 'Missing GYMPLAN header' });
    }
    Object.entries(days).forEach(([weekday, day]) => {
        if (!day.rest && day.exercises.length === 0) {
            warnings.push({ line: day.line, message: 'Day has no exercises', name: weekday });
        }
    });
    if (errors.length === 0 && Object.keys(days).length === 0) {
        errors.push({ line: 1, message: 'No plan found in the text' });
    }
    return { version, days, errors, warnings };
};

const majorityGroup = (exercises) => {
    const counts = new Map();
    exercises.forEach(item => {
        const group = item.match.muscleGroup;
        if (group) counts.set(group, (counts.get(group) ?? 0) + 1);
    });
    let best = null;
    counts.forEach((count, group) => {
        if (!best || count > best.count) best = { group, count };
    });
    return best ? best.group : null;
};

const buildExercise = (item, choice, unit, warnings) => {
    let dbId = item.match.dbId;
    let name = item.match.name;
    let muscleGroup = item.match.muscleGroup;
    if (choice === 'custom') {
        dbId = null;
        name = item.typedName;
        muscleGroup = null;
    } else if (typeof choice === 'number') {
        const candidate = EXERCISE_DATABASE.find(entry => entry.id === choice);
        if (candidate) {
            dbId = candidate.id;
            name = candidate.name;
            muscleGroup = candidate.muscleGroup;
        }
    }
    const duration = dbId !== null && DURATION_GROUPS.has(muscleGroup);

    let sets;
    let reps;
    if (duration) {
        if (item.minutes) {
            sets = item.minutes;
        } else if (item.sets) {
            sets = item.sets;
            warnings.push({ line: item.line, message: 'Sets read as minutes', name });
        } else {
            sets = DEFAULT_MINUTES;
            warnings.push({ line: item.line, message: 'Missing sets and reps, defaults used', name });
        }
        reps = '';
    } else if (item.minutes) {
        sets = '1';
        reps = `${item.minutes} min`;
        warnings.push({ line: item.line, message: 'Tracked as sets x reps', name });
    } else if (item.sets) {
        sets = item.sets;
        reps = item.reps === 'max' ? 'max' : item.reps;
    } else {
        sets = DEFAULT_SETS;
        reps = DEFAULT_REPS;
        warnings.push({ line: item.line, message: 'Missing sets and reps, defaults used', name });
    }

    const exercise = ExerciseService.createExercise({ name, dbId, sets, reps });
    if (item.weight && !duration) {
        exercise.weight = String(fromDisplayWeight(item.weight, item.weightUnit ?? unit));
    }
    return exercise;
};

const defaultDayLabel = (day) => {
    if (day.groups.length > 0) return day.groups.join(' & ');
    const majority = majorityGroup(day.exercises);
    if (majority) return majority;
    return day.exercises.length > 0 ? 'Chest' : 'Rest';
};

/**
 * @param {object} parsed result of parsePlanText
 * @param {object} existingWeek the viewed week, keyed by weekday
 * @param {{ preset?: string, perDay?: object, choices?: object, unit?: string }} options
 * @returns {{ plan: object, warnings: Array }}
 */
export const buildWeekFromImport = (parsed, existingWeek = {}, options = {}) => {
    const listed = Object.keys(parsed.days);
    const preset = options.preset ?? (listed.length >= 4 ? IMPORT_PRESETS.REPLACE : IMPORT_PRESETS.MERGE);
    const perDay = options.perDay ?? {};
    const choices = options.choices ?? {};
    const unit = options.unit ?? 'lbs';
    const warnings = [];
    const plan = {};

    DAYS_OF_WEEK.forEach(weekday => {
        const existing = existingWeek[weekday] ?? { name: 'Rest', exercises: [] };
        const imported = parsed.days[weekday];
        const mode = imported ? (perDay[weekday] ?? DAY_MODES.REPLACE) : null;

        if (!imported || mode === DAY_MODES.SKIP) {
            if (preset === IMPORT_PRESETS.REPLACE && !imported) {
                plan[weekday] = { ...existing, name: 'Rest', exercises: [] };
            } else {
                plan[weekday] = existing;
            }
            return;
        }

        const exercises = imported.rest ? [] : imported.exercises.map(item => buildExercise(item, choices[item.key], unit, warnings));

        if (mode === DAY_MODES.ADD) {
            const name = existing.name === 'Rest' || !existing.name ? defaultDayLabel(imported) : existing.name;
            const note = imported.note
                ? (existing.note ? `${existing.note}\n${imported.note}` : imported.note)
                : existing.note;
            plan[weekday] = {
                ...existing,
                name,
                exercises: [...(existing.exercises ?? []), ...exercises],
                ...(note !== undefined ? { note } : {}),
                hidden: existing.hidden && exercises.length === 0 ? existing.hidden : false
            };
            return;
        }

        const day = { name: defaultDayLabel(imported), exercises };
        const note = imported.note ?? existing.note;
        if (note) day.note = note;
        if (exercises.length === 0 && existing.hidden) day.hidden = true;
        plan[weekday] = day;
    });

    return { plan, warnings };
};
