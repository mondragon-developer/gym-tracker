import { DAYS_OF_WEEK } from '../constants/AppConstants.js';

/**
 * Gets the string name of the current day of the week.
 * @returns {string} The name of the day (e.g., "Monday").
 */
export const getToday = () => {
    const dayIndex = new Date().getDay();
    // new Date().getDay() returns 0 for Sunday, 1 for Monday, etc.
    // We adjust it so Monday is the first day of our week (index 0).
    return DAYS_OF_WEEK[(dayIndex + 6) % 7];
};

const pad2 = (n) => String(n).padStart(2, '0');

/**
 * Formats a Date as a local ISO date string (YYYY-MM-DD), timezone-safe.
 * We build it from local getFullYear/Month/Date so a week key never shifts a
 * day because of UTC conversion.
 */
const toISODate = (date) => `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

/**
 * Parses a YYYY-MM-DD string into a local Date (midnight local time).
 * @param {string} iso
 * @returns {Date}
 */
export const parseISODate = (iso) => {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
};

/**
 * Returns the ISO date (YYYY-MM-DD) of the Monday that starts the week
 * containing the given date. Weeks run Monday → Sunday to match DAYS_OF_WEEK.
 * @param {Date} [date=new Date()]
 * @returns {string}
 */
export const getWeekStart = (date = new Date()) => {
    const daysSinceMonday = (date.getDay() + 6) % 7; // Mon=0 … Sun=6
    const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate() - daysSinceMonday);
    return toISODate(monday);
};

/**
 * The actual calendar date of a given weekday within a week.
 * @param {string} weekStartISO - Monday of the week (YYYY-MM-DD)
 * @param {string} dayName - e.g. "Wednesday"
 * @returns {Date}
 */
export const getDateForDay = (weekStartISO, dayName) => {
    const offset = DAYS_OF_WEEK.indexOf(dayName);
    const monday = parseISODate(weekStartISO);
    return new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + offset);
};

const localeFor = (language) => (language === 'es' ? 'es-ES' : 'en-US');

/**
 * Formats a week as a human date range, e.g. "Jul 6 – Jul 12, 2026".
 * @param {string} weekStartISO
 * @param {string} [language='en']
 * @returns {string}
 */
export const formatWeekRange = (weekStartISO, language = 'en') => {
    const locale = localeFor(language);
    const start = parseISODate(weekStartISO);
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
    const startStr = start.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
    const endStr = end.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' });
    return `${startStr} – ${endStr}`;
};

/**
 * Short date label for a single day, e.g. "Jul 6".
 * @param {string} weekStartISO
 * @param {string} dayName
 * @param {string} [language='en']
 * @returns {string}
 */
export const formatDayDate = (weekStartISO, dayName, language = 'en') =>
    getDateForDay(weekStartISO, dayName).toLocaleDateString(localeFor(language), { month: 'short', day: 'numeric' });