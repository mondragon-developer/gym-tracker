import { DAYS_OF_WEEK } from '../constants/index.js';

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