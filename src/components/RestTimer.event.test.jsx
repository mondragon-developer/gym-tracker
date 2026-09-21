import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import RestTimer from './RestTimer.jsx';

beforeEach(() => {
    localStorage.clear();
});

afterEach(() => vi.useRealTimers());

const logSet = () => act(() => { window.dispatchEvent(new CustomEvent('gym:rest-start')); });

const finishRest = () => {
    fireEvent.click(screen.getByText('0:30'));
    logSet();
    act(() => { vi.advanceTimersByTime(30000); });
};

describe('RestTimer auto start', () => {
    it('starts counting down from the current preset when a set is logged', () => {
        vi.useFakeTimers();
        render(<RestTimer />);
        fireEvent.click(screen.getByText('1:30'));
        logSet();
        expect(screen.getByText('Pause')).toBeInTheDocument();
        act(() => { vi.advanceTimersByTime(2000); });
        expect(screen.getByTestId('rest-time')).toHaveTextContent('1:28');
    });

    it('restarts from the full preset if a set is logged mid-rest', () => {
        vi.useFakeTimers();
        render(<RestTimer />);
        logSet();
        act(() => { vi.advanceTimersByTime(10000); });
        expect(screen.getByTestId('rest-time')).toHaveTextContent('0:50');
        logSet();
        expect(screen.getByTestId('rest-time')).toHaveTextContent('1:00');
    });
});

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

    it('dismisses with the keyboard and when the next set is logged', () => {
        vi.useFakeTimers();
        render(<RestTimer />);
        finishRest();
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(screen.queryByTestId('rest-alert')).toBeNull();

        finishRest();
        expect(screen.getByTestId('rest-alert')).toBeInTheDocument();
        logSet();
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

    it('moves focus into the alert and back to the timer when it closes', () => {
        vi.useFakeTimers();
        render(<RestTimer />);
        const preset = screen.getByText('0:30');
        preset.focus();
        finishRest();
        expect(document.activeElement).toBe(screen.getByText('Tap to dismiss'));
        fireEvent.click(screen.getByText('Tap to dismiss'));
        expect(screen.queryByTestId('rest-alert')).toBeNull();
        expect(document.activeElement).toBe(preset);
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
