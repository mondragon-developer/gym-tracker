import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import UndoToast from './UndoToast.jsx';

afterEach(() => vi.useRealTimers());

describe('UndoToast', () => {
    it('renders nothing without a message', () => {
        const { container } = render(<UndoToast message={null} onUndo={() => {}} onDismiss={() => {}} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('calls onUndo from the button and translates the label', () => {
        const onUndo = vi.fn();
        render(<UndoToast message="Ejercicio eliminado." onUndo={onUndo} onDismiss={() => {}} language="es" />);
        fireEvent.click(screen.getByText('Deshacer'));
        expect(onUndo).toHaveBeenCalledTimes(1);
    });

    it('dismisses itself after six seconds', () => {
        vi.useFakeTimers();
        const onDismiss = vi.fn();
        render(<UndoToast message="Deleted." onUndo={() => {}} onDismiss={onDismiss} />);
        act(() => { vi.advanceTimersByTime(5999); });
        expect(onDismiss).not.toHaveBeenCalled();
        act(() => { vi.advanceTimersByTime(1); });
        expect(onDismiss).toHaveBeenCalledTimes(1);
    });
});
