import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ImportPlanModal from './ImportPlanModal.jsx';
import { UnitsProvider } from '../contexts/UnitsContext.jsx';
import { DAYS_OF_WEEK } from '../constants/AppConstants.js';

const PLAN = `GYMPLAN v1
Monday: Chest & Triceps
- Barbell Bench Press 4x6-8
- Barbel Bench Pres 3x8
- Farmer's Wa 3x40
- custom: Sled Push with rope 4x20
Tuesday: Rest
Wednesday: Legs
- Barbell Squats 4x6-8
Thursday: Rest`;

const renderModal = (props = {}) => {
    const onApply = vi.fn();
    const onClose = vi.fn();
    render(
        <UnitsProvider>
            <ImportPlanModal isOpen onClose={onClose} onApply={onApply} existingWeek={{}} {...props} />
        </UnitsProvider>
    );
    return { onApply, onClose };
};

const pasteAndPreview = (text) => {
    fireEvent.change(screen.getByLabelText('Paste the plan here'), { target: { value: text } });
    fireEvent.click(screen.getByRole('button', { name: 'Preview' }));
};

describe('ImportPlanModal', () => {
    it('previews each line with a match badge', () => {
        renderModal();
        pasteAndPreview(PLAN);
        expect(screen.getAllByText('Library')).toHaveLength(3);
        expect(screen.getByText('Choose')).toBeInTheDocument();
        expect(screen.getByText('Custom')).toBeInTheDocument();
        expect(screen.getByText('Sled Push with rope')).toBeInTheDocument();
        expect(screen.getAllByText('4x6-8')).toHaveLength(2);
    });

    it('lets the user pick a candidate for a close call', () => {
        renderModal();
        pasteAndPreview(PLAN);
        const select = screen.getByLabelText("Exercise match: Farmer's Wa");
        const walk = Array.from(select.options).find(option => option.textContent.includes("Farmer's Walk"));
        fireEvent.change(select, { target: { value: walk.value } });
        expect(screen.getAllByText('Library')).toHaveLength(4);
        expect(screen.queryByText('Choose')).toBeNull();
        expect(screen.getByText("Farmer's Walk")).toBeInTheDocument();
    });

    it('applies only after a confirming click and hands back a full week', () => {
        const { onApply } = renderModal();
        pasteAndPreview(PLAN);
        fireEvent.click(screen.getByRole('button', { name: 'Apply to this week' }));
        expect(onApply).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole('button', { name: 'Replace this week?' }));
        expect(onApply).toHaveBeenCalledTimes(1);
        const plan = onApply.mock.calls[0][0];
        expect(Object.keys(plan)).toEqual(DAYS_OF_WEEK);
        expect(plan.Monday.exercises.map(e => e.name)).toEqual(['Barbell Bench Press', 'Barbell Bench Press', "Farmer's Wa", 'Sled Push with rope']);
        expect(plan.Monday.exercises[2].dbId).toBeNull();
        expect(plan.Friday).toMatchObject({ name: 'Rest', exercises: [] });
    });

    it('honors per-day skip and the merge preset', () => {
        const before = { Monday: { name: 'Back', exercises: [] }, Friday: { name: 'Abs', exercises: [{ id: 'x', name: 'Plank', dbId: null, sets: '3', reps: '30s', weight: '', effectiveSets: '', status: 'incomplete' }] } };
        const { onApply } = renderModal({ existingWeek: before });
        pasteAndPreview(PLAN);
        fireEvent.click(screen.getByRole('button', { name: 'Merge into week' }));
        fireEvent.change(screen.getByLabelText('Day mode: Monday'), { target: { value: 'skip' } });
        fireEvent.click(screen.getByRole('button', { name: 'Apply to this week' }));
        fireEvent.click(screen.getByRole('button', { name: 'Apply to this week?' }));
        const plan = onApply.mock.calls[0][0];
        expect(plan.Monday).toBe(before.Monday);
        expect(plan.Friday).toBe(before.Friday);
        expect(plan.Wednesday.exercises).toHaveLength(1);
    });

    it('shows an error for text without a plan and never applies', () => {
        const { onApply } = renderModal();
        pasteAndPreview('Hi there, here is my week in prose.');
        expect(screen.getByRole('alert')).toHaveTextContent('No plan found in the text');
        expect(onApply).not.toHaveBeenCalled();
    });

    it('renders Spanish labels and reads a Spanish plan', () => {
        renderModal({ language: 'es' });
        fireEvent.change(screen.getByLabelText('Pega el plan aquí'), { target: { value: 'GYMPLAN v1\nLunes: Pecho\n- Press de Banca con Barra 4x8' } });
        fireEvent.click(screen.getByRole('button', { name: 'Vista previa' }));
        expect(screen.getByText('Biblioteca')).toBeInTheDocument();
        expect(screen.getByText('Press de Banca con Barra')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Combinar con la semana' })).toBeInTheDocument();
    });
});


describe('ImportPlanModal shortcuts', () => {
    it('previews text handed in from a paste elsewhere on the page', () => {
        renderModal({ initialText: PLAN });
        expect(screen.getAllByText('Library')).toHaveLength(3);
        expect(screen.queryByLabelText('Paste the plan here')).toBeNull();
    });

    it('reads the clipboard on one tap and previews it', async () => {
        const readText = vi.fn().mockResolvedValue(PLAN);
        Object.assign(navigator, { clipboard: { readText } });
        renderModal();
        fireEvent.click(screen.getByRole('button', { name: 'Paste from clipboard' }));
        expect(await screen.findByText('Choose')).toBeInTheDocument();
        expect(readText).toHaveBeenCalledTimes(1);
    });

    it('explains when the clipboard cannot be read', async () => {
        Object.assign(navigator, { clipboard: { readText: vi.fn().mockRejectedValue(new Error('denied')) } });
        renderModal();
        fireEvent.click(screen.getByRole('button', { name: 'Paste from clipboard' }));
        expect(await screen.findByRole('status')).toHaveTextContent('Could not read the clipboard here.');
    });
});

describe('ImportPlanModal target week', () => {
    const WEEKS = ['2026-09-21', '2026-09-28', '2026-10-05'];
    const thisWeek = { Monday: { name: 'Push', exercises: [{ id: 'a', name: 'Dips' }, { id: 'b', name: 'Flyes' }] } };
    const nextWeek = { Monday: { name: 'Rest', exercises: [] }, Friday: { name: 'Abs', exercises: [] } };
    const planForWeek = (week) => (week === '2026-09-21' ? thisWeek : nextWeek);

    it('lists this week, next week and later weeks, starting on the viewed week', () => {
        renderModal({ weeks: WEEKS, initialWeek: '2026-09-28', planForWeek });
        pasteAndPreview(PLAN);
        const select = screen.getByLabelText('Set up the plan for');
        expect(Array.from(select.options).map(o => o.textContent)).toEqual([
            expect.stringMatching(/^This week \(/),
            expect.stringMatching(/^Next week \(/),
            expect.stringMatching(/^Week of /)
        ]);
        expect(select.value).toBe('2026-09-28');
        expect(screen.getByRole('button', { name: /^Apply to week of Sep 28/ })).toBeInTheDocument();
    });

    it('shows what each plan day has now in the chosen week', () => {
        renderModal({ weeks: WEEKS, planForWeek });
        pasteAndPreview(PLAN);
        expect(screen.getByText('Now: Push, 2 exercises')).toBeInTheDocument();
        fireEvent.change(screen.getByLabelText('Set up the plan for'), { target: { value: '2026-09-28' } });
        expect(screen.getByText('Now: Rest')).toBeInTheDocument();
    });

    it('builds on the chosen week and hands it back with the plan', () => {
        const { onApply } = renderModal({ weeks: WEEKS, planForWeek });
        pasteAndPreview(PLAN);
        fireEvent.change(screen.getByLabelText('Set up the plan for'), { target: { value: '2026-09-28' } });
        fireEvent.click(screen.getByRole('button', { name: 'Merge into week' }));
        fireEvent.click(screen.getByRole('button', { name: /^Apply to week of/ }));
        fireEvent.click(screen.getByRole('button', { name: /^Apply to week of .*\?$/ }));
        const [plan, week] = onApply.mock.calls[0];
        expect(week).toBe('2026-09-28');
        expect(plan.Friday).toBe(nextWeek.Friday);
    });

    it('explains Replace and Merge', () => {
        renderModal({ weeks: WEEKS, planForWeek });
        pasteAndPreview(PLAN);
        fireEvent.click(screen.getByRole('button', { name: 'Replace whole week' }));
        expect(screen.getByText(/Days the plan does not list become Rest/)).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Merge into week' }));
        expect(screen.getByText(/every other day keeps what it has/)).toBeInTheDocument();
    });

    it('has no week picker for the trainer editor', () => {
        renderModal();
        pasteAndPreview(PLAN);
        expect(screen.queryByLabelText('Set up the plan for')).toBeNull();
    });
});
