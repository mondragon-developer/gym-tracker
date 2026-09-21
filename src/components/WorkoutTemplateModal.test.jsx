import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import WorkoutTemplateModal from './WorkoutTemplateModal.jsx';

describe('WorkoutTemplateModal', () => {
    it('lists the three plans and reports the chosen id only after a confirming click', () => {
        const onSelect = vi.fn();
        render(<WorkoutTemplateModal isOpen onClose={() => {}} onSelect={onSelect} />);
        expect(screen.getByText('Classic Push / Pull / Legs')).toBeInTheDocument();
        expect(screen.getByText('Upper / Lower with active recovery')).toBeInTheDocument();
        expect(screen.getByText('Full body 3 days (busy schedule)')).toBeInTheDocument();

        fireEvent.click(screen.getAllByText('Use this plan')[2]);
        expect(onSelect).not.toHaveBeenCalled();
        fireEvent.click(screen.getByText('Replace this week?'));
        expect(onSelect).toHaveBeenCalledWith('full-body-3');
    });

    it('cancel returns the card to its idle state without selecting', () => {
        const onSelect = vi.fn();
        render(<WorkoutTemplateModal isOpen onClose={() => {}} onSelect={onSelect} />);
        fireEvent.click(screen.getAllByText('Use this plan')[0]);
        fireEvent.click(screen.getByText('Cancel'));
        expect(screen.queryByText('Replace this week?')).toBeNull();
        expect(screen.getAllByText('Use this plan')).toHaveLength(5);
        expect(onSelect).not.toHaveBeenCalled();
    });

    it('translates names and actions to Spanish', () => {
        render(<WorkoutTemplateModal isOpen onClose={() => {}} onSelect={() => {}} language="es" />);
        expect(screen.getByText('Cuerpo completo 3 días (agenda ocupada)')).toBeInTheDocument();
        expect(screen.getAllByText('Usar este plan')).toHaveLength(5);
        expect(screen.getByText('En casa, sin equipo')).toBeInTheDocument();
    });
});
