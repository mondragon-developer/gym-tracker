import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import RestTimer from './RestTimer.jsx';

beforeEach(() => {
    localStorage.clear();
});

afterEach(() => vi.useRealTimers());

const finishRest = () => {
    fireEvent.click(screen.getByText('0:30'));
    fireEvent.click(screen.getByText(/^(Start|Iniciar)$/));
    act(() => { vi.advanceTimersByTime(30000); });
};

describe('RestTimer end-of-rest alert', () => {
    it('shows a full-screen alert that stays until tapped', () => {
        vi.useFakeTimers();
        render(<RestTimer />);
        finishRest();
        const alert = screen.getByTestId('rest-alert');
        expect(alert).toHaveTextContent("Let's go!");
        expect(alert).toHaveTextContent('Tap to dismiss');
        act(() => { vi.advanceTimersByTime(60000); });
        expect(screen.getByTestId('rest-alert')).toBeInTheDocument();
        fireEvent.click(alert);
        expect(screen.queryByTestId('rest-alert')).toBeNull();
        expect(screen.getByText("Time's up!")).toBeInTheDocument();
    });

    it('dismisses with the keyboard and when a new rest starts', () => {
        vi.useFakeTimers();
        render(<RestTimer />);
        finishRest();
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(screen.queryByTestId('rest-alert')).toBeNull();

        finishRest();
        expect(screen.getByTestId('rest-alert')).toBeInTheDocument();
        fireEvent.click(screen.getByText('Start'));
        expect(screen.queryByTestId('rest-alert')).toBeNull();
        expect(screen.getByText('Pause')).toBeInTheDocument();
    });

    it('vibrates when the rest ends, where the device supports it', () => {
        vi.useFakeTimers();
        const vibrate = vi.fn(() => true);
        Object.defineProperty(navigator, 'vibrate', { value: vibrate, configurable: true });
        try {
            render(<RestTimer />);
            finishRest();
            expect(vibrate).toHaveBeenCalledTimes(1);
            expect(vibrate.mock.calls[0][0]).toEqual([400, 150, 400, 150, 400]);
        } finally {
            delete navigator.vibrate;
        }
    });

    it('uses and remembers a custom message', () => {
        vi.useFakeTimers();
        render(<RestTimer language="es" />);
        fireEvent.click(screen.getByText('Mensaje'));
        fireEvent.change(screen.getByPlaceholderText('¡Vamos!'), { target: { value: 'Otra serie' } });
        finishRest();
        expect(screen.getByTestId('rest-alert')).toHaveTextContent('Otra serie');
        expect(localStorage.getItem('gymAppRestMessage')).toBe('Otra serie');
    });
});
