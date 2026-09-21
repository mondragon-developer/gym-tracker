import { describe, it, expect } from 'vitest';
import { exerciseTranslations, translateExercise, translateMuscleGroup } from './exercises.js';
import { EXERCISE_DATABASE } from '../constants/index.js';
import { INDIVIDUAL_MUSCLE_GROUPS } from '../constants/AppConstants.js';

describe('exercise translations', () => {
    it('covers every library exercise, so Spanish users and the plan importer never fall back to English', () => {
        const missing = EXERCISE_DATABASE.filter(entry => !exerciseTranslations[entry.name]).map(entry => entry.name);
        expect(missing).toEqual([]);
    });

    it('covers every muscle group label', () => {
        INDIVIDUAL_MUSCLE_GROUPS.forEach(group => expect(exerciseTranslations[group]).toBeTruthy());
    });

    it('translates names and combined group labels', () => {
        expect(translateExercise('Barbell Bench Press', 'es')).toBe('Press de Banca con Barra');
        expect(translateExercise('Barbell Bench Press', 'en')).toBe('Barbell Bench Press');
        expect(translateMuscleGroup('Chest & Triceps', 'es')).toBe('Pecho y Tríceps');
    });
});
