/**
 * Weight unit conversion for display and entry.
 *
 * Plans store weight in pounds as a string (the app's historical unit).
 * When the user picks kg, fields show the converted value and anything they
 * type is converted back to pounds before it is stored, so the same plan
 * reads correctly on any device and in the weekly summary. Non-numeric text
 * such as "BW" or "band" passes through untouched.
 */

export const LBS_PER_KG = 2.2046226218;

const NUMERIC = /^\s*\d+(?:[.,]\d+)?\s*$/;

const toNumber = (value) => parseFloat(String(value).replace(',', '.'));

const round1 = (n) => String(Math.round(n * 10) / 10);

export const isNumericWeight = (value) => NUMERIC.test(String(value ?? ''));

export const toDisplayWeight = (storedLbs, unit) => {
    if (unit !== 'kg' || !isNumericWeight(storedLbs)) return storedLbs ?? '';
    return round1(toNumber(storedLbs) / LBS_PER_KG);
};

export const fromDisplayWeight = (displayValue, unit) => {
    if (unit !== 'kg' || !isNumericWeight(displayValue)) return displayValue ?? '';
    return round1(toNumber(displayValue) * LBS_PER_KG);
};

// One plate-friendly increment in the display unit.
export const weightStep = (unit) => (unit === 'kg' ? 2.5 : 5);

// Adds one increment (in the display unit) to a stored pound value and
// returns the new stored pound value.
export const bumpStoredWeight = (storedLbs, unit) => {
    const base = isNumericWeight(storedLbs) ? toNumber(storedLbs) : 0;
    const stepLbs = unit === 'kg' ? weightStep('kg') * LBS_PER_KG : weightStep('lbs');
    return round1(base + stepLbs);
};

export const formatWeight = (storedLbs, unit) => {
    const shown = toDisplayWeight(storedLbs, unit);
    return shown === '' ? '' : `${shown} ${unit}`;
};
