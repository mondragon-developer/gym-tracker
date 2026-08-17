import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AddExerciseModal from './AddExerciseModal.jsx';

const renderModal = (language = 'en') =>
    render(
        <AddExerciseModal
            isOpen
            onClose={() => {}}
            onAddExercise={() => {}}
            muscleGroup="All"
            language={language}
        />
    );

const equipmentSelect = (name) => screen.getByRole('combobox', { name });

describe('AddExerciseModal equipment filter', () => {
    it('shows the whole library with "All equipment" selected', () => {
        renderModal();
        expect(screen.getByText('Barbell Bench Press')).toBeInTheDocument();
        expect(screen.getByText('Push-Ups')).toBeInTheDocument();
    });

    it('filters the library down to the chosen equipment', () => {
        renderModal();
        fireEvent.change(equipmentSelect('Filter by Equipment'), { target: { value: 'barbell' } });

        expect(screen.getByText('Barbell Bench Press')).toBeInTheDocument();
        // Body-weight (id 82) and un-enriched exercises do not match 'barbell'.
        expect(screen.queryByText('Push-Ups')).not.toBeInTheDocument();
    });

    it('combines with the search term', () => {
        renderModal();
        fireEvent.change(equipmentSelect('Filter by Equipment'), { target: { value: 'dumbbell' } });
        fireEvent.change(screen.getByPlaceholderText(/Search exercises/), { target: { value: 'incline' } });

        // The search highlight wraps matches in <mark>, so both the name span
        // and its parent end up with the same textContent: assert existence
        // with getAllByText instead of a unique getByText.
        const byFullText = (name) => (content, el) => el?.textContent === name;
        expect(screen.getAllByText(byFullText('Incline Dumbbell Press')).length).toBeGreaterThan(0);
        expect(screen.queryByText(byFullText('Barbell Bench Press'))).not.toBeInTheDocument();
    });

    it('translates the equipment options when language=es', () => {
        renderModal('es');
        expect(equipmentSelect('Filtrar por Equipo')).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'Todo el equipo' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'Barra' })).toBeInTheDocument();       // barbell
        expect(screen.getByRole('option', { name: 'Mancuerna' })).toBeInTheDocument();   // dumbbell
    });
});
