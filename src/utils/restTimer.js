/**
 * Helpers for the rest timer.
 */

/**
 * Formats a countdown in seconds as M:SS (e.g. 90 -> "1:30").
 * Non-finite or negative input degrades to "0:00" instead of rendering junk.
 * @param {number} totalSeconds
 * @returns {string}
 */
export const formatSeconds = (totalSeconds) => {
    const safe = Number.isFinite(totalSeconds) ? Math.max(0, Math.floor(totalSeconds)) : 0;
    const minutes = Math.floor(safe / 60);
    const seconds = safe % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
};
