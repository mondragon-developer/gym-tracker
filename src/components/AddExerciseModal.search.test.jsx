import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AddExerciseModal from './AddExerciseModal.jsx';

const renderPicker = (language = 'en') =>
    render(<AddExerciseModal isOpen onClose={() => {}} onAddExercise={() => {}} muscleGroup="All" language={language} />);

const search = (text) => fireEvent.change(screen.getByPlaceholderText(/Search exercises|Buscar ejercicios/), { target: { value: text } });

// Matched text is wrapped in <mark>, which splits the name across nodes, so
// assertions look at whole rows instead of exact text nodes.
const rowTexts = () => Array.from(document.querySelectorAll('[style*="cursor: pointer"]'))
    .map(el => el.textContent)
    .filter(text => /Target|Objetivo/.test(text));

describe('AddExerciseModal search across languages', () => {
    it('finds an exercise by its Spanish name while the UI is in Spanish', () => {
        renderPicker('es');
        search('sentadilla');
        const rows = rowTexts();
        expect(rows.some(text => text.includes('Sentadillas con Barra'))).toBe(true);
        expect(rows.some(text => text.includes('Press de Banca'))).toBe(false);
    });

    it('ignores accents and case, and highlights the accented match', () => {
        renderPicker('es');
        search('JALON AL PECHO');
        expect(rowTexts().some(text => text.includes('Jalón al Pecho'))).toBe(true);
        expect(screen.queryByText(/No exercises found|No se encontraron ejercicios/)).toBeNull();
        const marks = [...document.querySelectorAll('mark')].map(m => m.textContent);
        expect(marks).toContain('Jalón al Pecho');
    });

    it('still finds exercises by their English name in Spanish', () => {
        renderPicker('es');
        search('squat');
        expect(rowTexts().some(text => text.includes('Sentadillas con Barra'))).toBe(true);
    });

    it('finds exercises by their Spanish name while the UI is in English', () => {
        renderPicker('en');
        search('sentadilla');
        expect(rowTexts().some(text => text.includes('Barbell Squats'))).toBe(true);
        expect(rowTexts().some(text => text.includes('Bench Press'))).toBe(false);
    });
});
