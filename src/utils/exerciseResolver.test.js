import { describe, it, expect } from 'vitest';
import { resolveExerciseName, resolveMuscleGroups, resolveWeekday } from './exerciseResolver.js';
import { EXERCISE_DATABASE } from '../constants/index.js';

const idOf = (name) => EXERCISE_DATABASE.find(e => e.name === name).id;

describe('resolveExerciseName', () => {
    it('matches the exact English library name, ignoring case and punctuation', () => {
        const hit = resolveExerciseName('barbell bench press');
        expect(hit).toMatchObject({ dbId: idOf('Barbell Bench Press'), name: 'Barbell Bench Press', confidence: 'exact', muscleGroup: 'Chest' });
        expect(resolveExerciseName('Pull ups').confidence).toBe('exact');
    });

    it('matches Spanish names from the translation map', () => {
        expect(resolveExerciseName('Press de Banca con Barra')).toMatchObject({ dbId: idOf('Barbell Bench Press'), confidence: 'spanish' });
        expect(resolveExerciseName('jalon al pecho')).toMatchObject({ dbId: idOf('Lat Pulldowns'), confidence: 'spanish' });
    });

    it('matches alias keys that share a Spanish name with a library entry', () => {
        const hit = resolveExerciseName('Calf Raises');
        expect(hit.confidence).toBe('alias');
        expect(hit.name).toBe('Standing Calf Raises');
    });

    it('accepts a one-letter typo as a fuzzy match', () => {
        const hit = resolveExerciseName('Barbel Bench Pres');
        expect(hit).toMatchObject({ dbId: idOf('Barbell Bench Press'), confidence: 'fuzzy' });
        expect(hit.candidates[0].name).toBe('Barbell Bench Press');
    });

    it('accepts swapped word order', () => {
        expect(resolveExerciseName('Dumbbell Incline Press')).toMatchObject({ dbId: idOf('Incline Dumbbell Press'), confidence: 'fuzzy' });
    });

    it('hands close calls to the user instead of guessing', () => {
        const hit = resolveExerciseName("Farmer's Wa");
        expect(hit.confidence).toBe('none');
        expect(hit.dbId).toBeNull();
        const names = hit.candidates.map(c => c.name);
        expect(names).toContain("Farmer's Walk");
        expect(names).toContain("Farmer's Carry");
    });

    it('returns none with no candidates for nonsense', () => {
        const hit = resolveExerciseName('zzqx flurb');
        expect(hit).toMatchObject({ dbId: null, confidence: 'none', name: 'zzqx flurb' });
        expect(hit.candidates).toEqual([]);
    });

    it('never matches when the custom prefix is present, in either language', () => {
        expect(resolveExerciseName('custom: Barbell Bench Press')).toMatchObject({ dbId: null, confidence: 'none', name: 'Barbell Bench Press' });
        expect(resolveExerciseName('Personalizado: Press de Banca con Barra').dbId).toBeNull();
        expect(resolveExerciseName('Barbell Bench Press', { forceCustom: true }).dbId).toBeNull();
    });

    it('treats an empty name as none', () => {
        expect(resolveExerciseName('   ')).toMatchObject({ dbId: null, name: '', confidence: 'none' });
    });
});

describe('resolveMuscleGroups', () => {
    it('reads English and Spanish labels with any separator', () => {
        expect(resolveMuscleGroups('Chest & Triceps').groups).toEqual(['Chest', 'Triceps']);
        expect(resolveMuscleGroups('Pecho y Tríceps').groups).toEqual(['Chest', 'Triceps']);
        expect(resolveMuscleGroups('Back, Biceps + Forearms').groups).toEqual(['Back', 'Biceps', 'Forearms']);
        expect(resolveMuscleGroups('Espalda e Hombros').groups).toEqual(['Back', 'Shoulders']);
    });

    it('caps at three groups and reports unknown ones', () => {
        const hit = resolveMuscleGroups('Chest & Back & Legs & Abs');
        expect(hit.groups).toEqual(['Chest', 'Back', 'Legs']);
        expect(hit.truncated).toBe(true);
        expect(resolveMuscleGroups('Chest & Neck')).toMatchObject({ groups: ['Chest'], unknown: ['Neck'] });
    });

    it('collapses to Rest when Rest is present', () => {
        expect(resolveMuscleGroups('Descanso').groups).toEqual(['Rest']);
        expect(resolveMuscleGroups('Rest & Chest').groups).toEqual(['Rest']);
    });
});

describe('resolveWeekday', () => {
    it('reads English and Spanish day names', () => {
        expect(resolveWeekday('monday')).toBe('Monday');
        expect(resolveWeekday('Miércoles')).toBe('Wednesday');
        expect(resolveWeekday('sabado')).toBe('Saturday');
        expect(resolveWeekday('Funday')).toBeNull();
    });
});
