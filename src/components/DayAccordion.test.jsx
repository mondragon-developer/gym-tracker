import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DayAccordion from './DayAccordion.jsx';
import { UnitsProvider } from '../contexts/UnitsContext.jsx';

const renderDay = (data, props = {}) => {
    const onUpdateDay = vi.fn();
    render(
        <UnitsProvider>
            <DayAccordion
                day="Monday"
                data={data}
                isOpen
                onToggle={() => {}}
                onUpdateDay={onUpdateDay}
                onResetDay={() => {}}
                onOpenAddExercise={() => {}}
                {...props}
            />
        </UnitsProvider>
    );
    return { onUpdateDay };
};

const exercise = { id: 'e1', name: 'Bench Press', sets: '3', reps: '10', weight: '', effectiveSets: '', status: 'incomplete' };

describe('DayAccordion notes', () => {
    it('collapses empty notes to a button and opens the textarea on tap', () => {
        renderDay({ name: 'Chest', exercises: [exercise] });
        expect(screen.queryByLabelText('Notes')).toBeNull();
        fireEvent.click(screen.getByRole('button', { name: '+ Add note' }));
        expect(screen.getByLabelText('Notes')).toBeInTheDocument();
    });

    it('shows the textarea straight away when the day already has a note', () => {
        renderDay({ name: 'Chest', exercises: [exercise], note: 'Go heavy' });
        expect(screen.getByLabelText('Notes')).toHaveValue('Go heavy');
        expect(screen.queryByRole('button', { name: '+ Add note' })).toBeNull();
    });

    it('never offers to add a note on a read-only week', () => {
        renderDay({ name: 'Chest', exercises: [exercise] }, { readOnly: true });
        expect(screen.queryByRole('button', { name: '+ Add note' })).toBeNull();
        expect(screen.queryByLabelText('Notes')).toBeNull();
    });
});

describe('DayAccordion header', () => {
    it('shows the day, its muscle groups and the done count', () => {
        renderDay({ name: 'Chest & Triceps', exercises: [exercise, { ...exercise, id: 'e2', status: 'completed' }] });
        expect(screen.getByText('Monday')).toBeInTheDocument();
        expect(screen.getByText('Chest & Triceps')).toBeInTheDocument();
        expect(screen.getByText('1/2')).toBeInTheDocument();
    });
});
