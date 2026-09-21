import { describe, it, expect } from 'vitest';
import { toDisplayWeight, fromDisplayWeight, bumpStoredWeight, formatWeight, weightStep } from './weightUnits.js';

describe('weightUnits', () => {
    it('shows stored pounds unchanged in lbs and converted in kg', () => {
        expect(toDisplayWeight('135', 'lbs')).toBe('135');
        expect(toDisplayWeight('135', 'kg')).toBe('61.2');
        expect(toDisplayWeight('', 'kg')).toBe('');
    });

    it('stores typed kilograms as pounds and leaves text alone', () => {
        expect(fromDisplayWeight('60', 'kg')).toBe('132.3');
        expect(fromDisplayWeight('60', 'lbs')).toBe('60');
        expect(fromDisplayWeight('BW', 'kg')).toBe('BW');
        expect(fromDisplayWeight('22,5', 'kg')).toBe('49.6');
    });

    it('round trips a kg entry within a tenth of a pound', () => {
        const stored = fromDisplayWeight('60', 'kg');
        expect(toDisplayWeight(stored, 'kg')).toBe('60');
    });

    it('bumps by one plate increment in the display unit', () => {
        expect(bumpStoredWeight('135', 'lbs')).toBe('140');
        expect(bumpStoredWeight('132.3', 'kg')).toBe('137.8');
        expect(toDisplayWeight(bumpStoredWeight('132.3', 'kg'), 'kg')).toBe('62.5');
        expect(bumpStoredWeight('', 'lbs')).toBe('5');
    });

    it('formats with the unit label', () => {
        expect(formatWeight('135', 'kg')).toBe('61.2 kg');
        expect(formatWeight('', 'lbs')).toBe('');
        expect(weightStep('kg')).toBe(2.5);
    });
});
