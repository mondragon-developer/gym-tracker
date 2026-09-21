import { describe, it, expect } from 'vitest';
import { fold, foldKey } from './textFold.js';

describe('fold', () => {
    it('lowercases and strips accents without changing length', () => {
        expect(fold('Bíceps')).toBe('biceps');
        expect(fold('Sentadillas con Barra')).toBe('sentadillas con barra');
        expect(fold('Jalón al Pecho')).toHaveLength('Jalón al Pecho'.length);
    });

    it('treats null and undefined as empty', () => {
        expect(fold(null)).toBe('');
        expect(fold(undefined)).toBe('');
    });
});

describe('foldKey', () => {
    it('collapses punctuation to single spaces', () => {
        expect(foldKey("Farmer's Walk (Heavy)")).toBe('farmer s walk heavy');
        expect(foldKey('  Pull-ups ')).toBe('pull ups');
    });
});
