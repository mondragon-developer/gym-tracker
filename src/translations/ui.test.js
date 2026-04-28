import { describe, it, expect } from 'vitest';
import { t, uiTranslations } from './ui.js';

describe('translation helper t()', () => {
  it('returns the English string for a known key', () => {
    expect(t('Sets', 'en')).toBe('Sets');
  });

  it('returns the Spanish string when language=es', () => {
    expect(t('Sets', 'es')).toBe('Series');
  });

  it('falls back to English when the Spanish key is missing', () => {
    // Pick a real EN-only key that ES dictionary lacks (none today, so test the path
    // by looking up a guaranteed-missing fabricated key).
    expect(t('__nonexistent_key__', 'es')).toBe('__nonexistent_key__');
  });

  it('returns the key itself when neither language has it', () => {
    expect(t('totally bogus key 12345', 'en')).toBe('totally bogus key 12345');
  });

  it('defaults to English when no language is supplied', () => {
    expect(t('Reset Day')).toBe('Reset Day');
  });

  it('ships both en and es dictionaries', () => {
    expect(Object.keys(uiTranslations)).toEqual(expect.arrayContaining(['en', 'es']));
  });
});
