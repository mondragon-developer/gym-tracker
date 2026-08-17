import { describe, it, expect } from 'vitest';
import { formatSeconds } from './restTimer.js';

describe('formatSeconds', () => {
    it('formats whole minutes and padded seconds', () => {
        expect(formatSeconds(0)).toBe('0:00');
        expect(formatSeconds(45)).toBe('0:45');
        expect(formatSeconds(60)).toBe('1:00');
        expect(formatSeconds(90)).toBe('1:30');
        expect(formatSeconds(600)).toBe('10:00');
    });

    it('floors fractional seconds', () => {
        expect(formatSeconds(89.9)).toBe('1:29');
    });

    it('degrades gracefully on negative or non-finite input', () => {
        expect(formatSeconds(-5)).toBe('0:00');
        expect(formatSeconds(NaN)).toBe('0:00');
        expect(formatSeconds(undefined)).toBe('0:00');
    });
});
