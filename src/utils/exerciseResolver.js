/**
 * Resolves free-text exercise, muscle-group and weekday names, in English
 * or Spanish, to the app's library entries. Used by the plan importer: the
 * AI coach writes names in the chat language and the user pastes them.
 *
 * Lookup order: exact English name, exact Spanish name, alias (a key of the
 * translation map that is not a library name but shares its Spanish value
 * with one), then a bounded fuzzy match. A close call between two library
 * names is reported as `none` with candidates so the user picks.
 */

import { EXERCISE_DATABASE } from '../constants/index.js';
import { DAYS_OF_WEEK, INDIVIDUAL_MUSCLE_GROUPS } from '../constants/AppConstants.js';
import { exerciseTranslations } from '../translations/exercises.js';
import { foldKey } from './textFold.js';

export const FUZZY_ACCEPT = 0.85;
export const FUZZY_MARGIN = 0.03;
export const FUZZY_CANDIDATE = 0.6;
export const MAX_GROUPS_PER_DAY = 3;

const CUSTOM_PREFIX = /^(custom|personalizado|personalizada)\s*:\s*/i;

const WEEKDAYS_ES = {
    lunes: 'Monday',
    martes: 'Tuesday',
    miercoles: 'Wednesday',
    jueves: 'Thursday',
    viernes: 'Friday',
    sabado: 'Saturday',
    domingo: 'Sunday'
};

let indexes = null;

const buildIndexes = () => {
    const groupSet = new Set([...INDIVIDUAL_MUSCLE_GROUPS, 'All']);
    const byName = new Map(EXERCISE_DATABASE.map(entry => [entry.name, entry]));
    const en = new Map();
    const es = new Map();
    const alias = new Map();
    const fuzzy = [];

    for (const entry of EXERCISE_DATABASE) {
        const enKey = foldKey(entry.name);
        en.set(enKey, entry);
        fuzzy.push({ key: enKey, entry });
        const spanish = exerciseTranslations[entry.name];
        if (spanish) {
            const esKey = foldKey(spanish);
            if (!es.has(esKey)) es.set(esKey, entry);
            fuzzy.push({ key: esKey, entry });
        }
    }

    for (const [key, spanish] of Object.entries(exerciseTranslations)) {
        if (byName.has(key) || groupSet.has(key)) continue;
        const entry = es.get(foldKey(spanish));
        if (entry) alias.set(foldKey(key), entry);
    }

    const groups = new Map();
    for (const group of INDIVIDUAL_MUSCLE_GROUPS) {
        groups.set(foldKey(group), group);
        const spanish = exerciseTranslations[group];
        if (spanish) groups.set(foldKey(spanish), group);
    }

    const weekdays = new Map();
    for (const day of DAYS_OF_WEEK) weekdays.set(foldKey(day), day);
    for (const [spanish, day] of Object.entries(WEEKDAYS_ES)) weekdays.set(spanish, day);

    indexes = { en, es, alias, fuzzy, groups, weekdays };
    return indexes;
};

const getIndexes = () => indexes ?? buildIndexes();

const levenshtein = (a, b) => {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i += 1) {
        const current = [i];
        for (let j = 1; j <= b.length; j += 1) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost);
        }
        previous = current;
    }
    return previous[b.length];
};

const ratio = (a, b) => {
    const longest = Math.max(a.length, b.length);
    return longest === 0 ? 1 : 1 - levenshtein(a, b) / longest;
};

const sortTokens = (key) => key.split(' ').sort().join(' ');

// Edit-distance ratio catches one-letter typos; the token-sorted pass
// catches swapped word order ("Dumbbell Incline Press").
const similarity = (a, b) => Math.max(ratio(a, b), ratio(sortTokens(a), sortTokens(b)));

const result = (entry, confidence, name, candidates = []) => ({
    dbId: entry ? entry.id : null,
    name: entry ? entry.name : name,
    muscleGroup: entry ? entry.muscleGroup : null,
    confidence,
    candidates
});

/**
 * @param {string} rawName text as pasted, possibly with a custom: prefix
 * @param {{ forceCustom?: boolean }} options
 */
export const resolveExerciseName = (rawName, { forceCustom = false } = {}) => {
    const text = String(rawName ?? '').trim();
    const hasPrefix = CUSTOM_PREFIX.test(text);
    const name = text.replace(CUSTOM_PREFIX, '').trim();
    if (!name) return result(null, 'none', '');
    if (forceCustom || hasPrefix) return result(null, 'none', name);

    const { en, es, alias, fuzzy } = getIndexes();
    const key = foldKey(name);
    if (en.has(key)) return result(en.get(key), 'exact', name);
    if (es.has(key)) return result(es.get(key), 'spanish', name);
    if (alias.has(key)) return result(alias.get(key), 'alias', name);

    const best = new Map();
    for (const { key: candidateKey, entry } of fuzzy) {
        const score = similarity(key, candidateKey);
        if (score < FUZZY_CANDIDATE) continue;
        if (!best.has(entry.id) || best.get(entry.id).score < score) {
            best.set(entry.id, { dbId: entry.id, name: entry.name, score, entry });
        }
    }
    const ranked = [...best.values()].sort((a, b) => b.score - a.score);
    const candidates = ranked.slice(0, 3).map(({ dbId, name: candidateName, score }) => ({ dbId, name: candidateName, score }));
    if (ranked.length === 0) return result(null, 'none', name);

    const top = ranked[0];
    const runnerUp = ranked[1];
    const clearWinner = top.score >= FUZZY_ACCEPT && (!runnerUp || top.score - runnerUp.score >= FUZZY_MARGIN);
    if (clearWinner) return result(top.entry, 'fuzzy', name, candidates);
    return result(null, 'none', name, candidates);
};

const GROUP_SEPARATORS = /\s*(?:&|\+|,|\/|\band\b|\by\b|\be\b)\s*/i;

/**
 * "Chest & Triceps", "Pecho y Tríceps", "Back, Biceps" to English labels.
 */
export const resolveMuscleGroups = (label) => {
    const { groups } = getIndexes();
    const parts = String(label ?? '').split(GROUP_SEPARATORS).map(part => part.trim()).filter(Boolean);
    const found = [];
    const unknown = [];
    for (const part of parts) {
        const group = groups.get(foldKey(part));
        if (!group) unknown.push(part);
        else if (!found.includes(group)) found.push(group);
    }
    if (found.includes('Rest')) return { groups: ['Rest'], unknown, truncated: false };
    const truncated = found.length > MAX_GROUPS_PER_DAY;
    return { groups: found.slice(0, MAX_GROUPS_PER_DAY), unknown, truncated };
};

export const resolveWeekday = (word) => {
    const { weekdays } = getIndexes();
    return weekdays.get(foldKey(word)) ?? null;
};

// Test hook: indexes are built once from module data, this lets a test
// rebuild them after mocking the library.
export const resetResolverIndexes = () => {
    indexes = null;
};
