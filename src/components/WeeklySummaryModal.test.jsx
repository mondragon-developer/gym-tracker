import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import WeeklySummaryModal from './WeeklySummaryModal.jsx';
import { UnitsProvider } from '../contexts/UnitsContext.jsx';
import { EXERCISE_DATABASE } from '../constants/index.js';

const bench = EXERCISE_DATABASE.find(e => e.name === 'Barbell Bench Press').id;
const rest = () => ({ name: 'Rest', exercises: [] });
const week = (weight, done) => ({
    Monday: { name: 'Chest', exercises: [{ id: `b-${weight}`, dbId: bench, name: 'Barbell Bench Press', sets: '4', reps: '8', weight, effectiveSets: done, status: 'incomplete' }] },
    Tuesday: rest(), Wednesday: rest(), Thursday: rest(), Friday: rest(), Saturday: rest(), Sunday: rest()
});

const renderModal = (history) => render(
    <UnitsProvider>
        <WeeklySummaryModal
            isOpen
            onClose={() => {}}
            workoutPlan={history.weeks[history.currentWeekStart]}
            weekStart={history.currentWeekStart}
            history={history}
            currentWeekStart={history.currentWeekStart}
            language="en"
        />
    </UnitsProvider>
);

describe('WeeklySummaryModal progress tab', () => {
    it('shows the chart, weekly table and per-exercise rows once two weeks have data', () => {
        const history = { version: 2, currentWeekStart: '2026-09-21', weeks: { '2026-09-14': week('100', '4'), '2026-09-21': week('105', '4') } };
        renderModal(history);
        fireEvent.click(screen.getByRole('button', { name: 'Progress' }));
        expect(screen.getByRole('img', { name: 'Weekly volume (lbs)' })).toBeInTheDocument();
        expect(screen.getAllByText('3,360')).not.toHaveLength(0);
        expect(screen.getByRole('button', { name: 'Download progress CSV' })).toBeInTheDocument();
        expect(screen.getByRole('img', { name: 'Barbell Bench Press: Volume' })).toBeInTheDocument();
        expect(screen.getByText('+160')).toBeInTheDocument();
    });

    it('explains what is missing with fewer than two logged weeks', () => {
        const history = { version: 2, currentWeekStart: '2026-09-21', weeks: { '2026-09-21': week('105', '4') } };
        renderModal(history);
        fireEvent.click(screen.getByRole('button', { name: 'Progress' }));
        expect(screen.getByText(/Progress appears once two weeks/)).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Download progress CSV' })).toBeNull();
    });

    it('keeps the week view as the default tab', () => {
        const history = { version: 2, currentWeekStart: '2026-09-21', weeks: { '2026-09-21': week('105', '4') } };
        renderModal(history);
        expect(screen.getByText('Week detail')).toBeInTheDocument();
        expect(screen.queryByText(/Progress appears/)).toBeNull();
    });
});
