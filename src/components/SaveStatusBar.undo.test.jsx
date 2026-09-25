import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SaveStatusBar from './SaveStatusBar.jsx';
import { SaveState } from '../hooks/useWorkoutPlan.js';

describe('SaveStatusBar Undo', () => {
    it('shows Undo only when there is something to undo', () => {
        const { rerender } = render(<SaveStatusBar saveState={SaveState.SAVED} />);
        expect(screen.queryByRole('button', { name: 'Undo last change' })).toBeNull();

        const onUndo = vi.fn();
        rerender(<SaveStatusBar saveState={SaveState.SAVED} onUndo={onUndo} />);
        fireEvent.click(screen.getByRole('button', { name: 'Undo last change' }));
        expect(onUndo).toHaveBeenCalledTimes(1);
    });

    it('labels the button in Spanish', () => {
        render(<SaveStatusBar saveState={SaveState.IDLE} onUndo={vi.fn()} language="es" />);
        expect(screen.getByRole('button', { name: 'Deshacer el último cambio' })).toHaveTextContent('Deshacer');
    });
});
