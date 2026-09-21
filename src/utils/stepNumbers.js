/**
 * Steps every number inside a plan field string, so "3" becomes "4" and a
 * rep range like "8-10" becomes "9-11". Values stay strings because that is
 * how the plan stores sets, reps and weight. Each number is clamped to
 * [min, max]; an empty or non-numeric field starts from `fallback`.
 */

const parseLeading = (value) => {
    const n = parseFloat(String(value ?? '').replace(',', '.'));
    return Number.isFinite(n) ? n : null;
};

const format = (n) => (Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100));

export const stepNumbers = (value, delta, { min = 0, max = Infinity, fallback = 0 } = {}) => {
    const text = String(value ?? '').trim();
    if (text === '' || parseLeading(text) === null) {
        return format(Math.min(max, Math.max(min, fallback + delta)));
    }
    return text.replace(/\d+(?:[.,]\d+)?/g, (match) => {
        const n = parseFloat(match.replace(',', '.'));
        return format(Math.min(max, Math.max(min, n + delta)));
    });
};
