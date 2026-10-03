import React, { useState } from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import { UnitsProvider } from '../contexts/UnitsContext.jsx';
import { UnitsContext } from '../contexts/unitsContextDef.js';
import { DndContext } from '@dnd-kit/core';
import ExerciseItem from './ExerciseItem.jsx';
import ExerciseMuscles from './ExerciseMuscles.jsx';
import AddExerciseModal from './AddExerciseModal.jsx';
import ConditioningPanel from './ConditioningPanel.jsx';
import FocusWorkoutModal from './FocusWorkoutModal.jsx';
import RestTimer from './RestTimer.jsx';
import ProgressBar from './ProgressBar.jsx';

const bench = { id: 'bench', dbId: 1, name: 'Barbell Bench Press', sets: '3', reps: '8', weight: '100', effectiveSets: '', status: 'incomplete' };
afterEach(() => { vi.useRealTimers(); localStorage.clear(); });

describe('workout experience', () => {
    it('shows Chest, Triceps, Shoulders under bench with readable descending emphasis', () => {
        const { rerender } = render(<ExerciseMuscles exercise={bench} />);
        expect(screen.getByText('Chest')).toHaveStyle({ fontSize: '14px', fontWeight: '700' });
        expect(screen.getByText('Triceps')).toHaveStyle({ fontSize: '12px' });
        expect(screen.getByText('Shoulders')).toHaveStyle({ fontSize: '11px' });
        rerender(<ExerciseMuscles exercise={bench} language="es" />);
        expect(screen.getByText('Pecho')).toBeInTheDocument();
    });
    it('reuses stored-pound values without changing completed sets when displayed in kilograms', () => {
        const onUpdate = vi.fn();
        const previous = { ...bench, weight: '110.2311', reps: '12', effectiveSets: '3', date: new Date(2026, 8, 28) };
        render(<UnitsContext.Provider value={{ unit: 'kg' }}><DndContext><ExerciseItem exercise={bench} previous={previous} onUpdate={onUpdate} onDelete={() => {}} /></DndContext></UnitsContext.Provider>);
        fireEvent.click(screen.getByRole('button', { name: 'Use last values' }));
        expect(onUpdate).toHaveBeenCalledWith('bench', expect.objectContaining({ weight: '110.2311', reps: '12', effectiveSets: '', status: 'incomplete' }));
    });
    it('lets users favorite a library row without accidentally adding it to the workout', () => {
        const onAdd = vi.fn(); const toggle = vi.fn();
        render(<AddExerciseModal isOpen onClose={() => {}} onAddExercise={onAdd} muscleGroup="All" favoriteExerciseIds={[1]} onToggleFavorite={toggle} />);
        fireEvent.click(screen.getByRole('button', { name: /Favorites \(1\)/ }));
        expect(screen.getByText('Barbell Bench Press')).toBeInTheDocument();
        expect(screen.queryByText('Ring Dips')).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Remove from favorites: Barbell Bench Press' }));
        expect(toggle).toHaveBeenCalledWith(1);
        expect(onAdd).not.toHaveBeenCalled();
    });
    it('focus mode logs through the same day update and navigates without completing the next exercise', () => {
        function Harness() {
            const [data, setData] = useState({ name: 'Chest', exercises: [bench, { ...bench, id: 'row', dbId: 9, name: 'Pull-ups' }] });
            return <UnitsProvider><FocusWorkoutModal day="Monday" data={data} weekStart="2026-09-28" onChange={setData} onClose={() => {}} /></UnitsProvider>;
        }
        render(<UnitsProvider><Harness /></UnitsProvider>);
        expect(screen.queryByRole('button', { name: 'Delete exercise' })).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /Log set 1\s*\/\s*3/ }));
        expect(screen.getByRole('button', { name: /Log set 2\s*\/\s*3/ })).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Next' }));
        expect(screen.getByRole('heading', { name: 'Pull-ups' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Log set 1\s*\/\s*3/ })).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
        expect(screen.getByRole('button', { name: /Log set 2\s*\/\s*3/ })).toBeInTheDocument();
    });
    it('keeps one running rest clock when moving it into and out of focus mode', () => {
        vi.useFakeTimers();
        const target = document.createElement('div'); document.body.appendChild(target);
        const { rerender, unmount } = render(<RestTimer />);
        fireEvent.click(screen.getByRole('button', { name: 'Start' }));
        act(() => { vi.advanceTimersByTime(10000); });
        rerender(<RestTimer portalTarget={target} />);
        expect(within(target).getByTestId('rest-time')).toHaveTextContent('0:50');
        expect(screen.getAllByTestId('rest-time')).toHaveLength(1);
        act(() => { vi.advanceTimersByTime(5000); });
        rerender(<RestTimer />);
        expect(screen.getByTestId('rest-time')).toHaveTextContent('0:45');
        unmount(); target.remove();
    });
    it('records an AMRAP result, retains movement prescriptions, and keeps strength sets untouched', () => {
        vi.useFakeTimers();
        let result;
        function Harness() {
            const [value, setValue] = useState({ mode: 'amrap', minutes: 1 });
            result = value;
            return <ConditioningPanel value={value} exercises={[bench]} onChange={setValue} />;
        }
        render(<UnitsProvider><Harness /></UnitsProvider>);
        fireEvent.click(screen.getByRole('button', { name: 'Start workout' }));
        fireEvent.click(screen.getByRole('button', { name: '+ Log round' }));
        fireEvent.change(screen.getByRole('spinbutton', { name: 'Extra reps' }), { target: { value: '5' } });
        act(() => { vi.advanceTimersByTime(60000); });
        expect(screen.getByRole('timer')).toHaveTextContent('0:00');
        fireEvent.click(screen.getByRole('button', { name: 'Finish and save' }));
        expect(screen.getByRole('status')).toHaveTextContent('Completed · 1:00 · 1 rounds + 5 reps');
        expect(result.session.movements[0]).toMatchObject({ dbId: 1, reps: '8', weight: '100' });
        expect(bench.effectiveSets).toBe('');
    });
    it('allows future setup without starting a timer and makes past results read-only', () => {
        const { rerender } = render(<UnitsProvider><ConditioningPanel value={{ mode: 'emom' }} exercises={[bench]} onChange={() => {}} canRun={false} /></UnitsProvider>);
        expect(screen.queryByRole('button', { name: 'Start workout' })).not.toBeInTheDocument();
        expect(screen.getByRole('combobox')).not.toBeDisabled();
        rerender(<UnitsProvider><ConditioningPanel value={{ mode: 'amrap', session: { status: 'finished', elapsedMs: 60000, rounds: 2 } }} exercises={[bench]} readOnly /></UnitsProvider>);
        expect(screen.getByRole('combobox')).toBeDisabled();
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
    it('counts a finished conditioning session once rather than fabricating completed strength sets', () => {
        render(<ProgressBar workoutPlan={{ Monday: { exercises: [bench, { ...bench, id: 'second' }], conditioning: { mode: 'amrap', session: { status: 'finished' } } } }} />);
        expect(screen.getByText('1 of 1 exercises and timed workouts completed')).toBeInTheDocument();
    });
});
