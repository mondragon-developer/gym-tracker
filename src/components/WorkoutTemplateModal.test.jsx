import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import WorkoutTemplateModal from './WorkoutTemplateModal.jsx';

describe('WorkoutTemplateModal', () => {
    it('lists the three plans and reports the chosen id', () => {
        const onSelect = vi.fn();
        render(<WorkoutTemplateModal isOpen onClose={() => {}} onSelect={onSelect} />);
        expect(screen.getByText('Classic Push / Pull / Legs')).toBeInTheDocument();
        expect(screen.getByText('Upper / Lower with active recovery')).toBeInTheDocument();
        expect(screen.getByText('Full body 3 days (busy schedule)')).toBeInTheDocument();

        fireEvent.click(screen.getAllByText('Use this plan')[2]);
        expect(onSelect).toHaveBeenCalledWith('full-body-3');
    });

    it('translates names and actions to Spanish', () => {
        render(<WorkoutTemplateModal isOpen onClose={() => {}} onSelect={() => {}} language="es" />);
        expect(screen.getByText('Cuerpo completo 3 días (agenda ocupada)')).toBeInTheDocument();
        expect(screen.getAllByText('Usar este plan')).toHaveLength(3);
    });
});
