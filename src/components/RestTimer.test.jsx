import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import RestTimer from './RestTimer.jsx';

// Fake timers are enabled after render (findBy/waitFor poll with intervals).
const renderTimer = () => {
    render(<RestTimer />);
    vi.useFakeTimers();
    return screen.getByTestId('rest-time');
};

const advance = (ms) => {
    act(() => {
        vi.advanceTimersByTime(ms);
    });
};

describe('RestTimer', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('starts idle showing the default 60s preset', () => {
        const display = renderTimer();
        expect(display).toHaveTextContent('1:00');
        expect(screen.getByText(/Rest timer/)).toBeInTheDocument();
    });

    it('switches presets while idle', () => {
        const display = renderTimer();
        fireEvent.click(screen.getByRole('button', { name: '1:30' }));
        expect(display).toHaveTextContent('1:30');
    });

    it('counts down while running and freezes on Pause', () => {
        const display = renderTimer();
        fireEvent.click(screen.getByRole('button', { name: 'Start' }));
        advance(3000);
        expect(display).toHaveTextContent('0:57');

        fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
        advance(5000);
        expect(display).toHaveTextContent('0:57');
    });

    it('resumes from the paused remaining time', () => {
        const display = renderTimer();
        fireEvent.click(screen.getByRole('button', { name: 'Start' }));
        advance(3000);
        fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
        fireEvent.click(screen.getByRole('button', { name: 'Start' }));
        advance(2000);
        expect(display).toHaveTextContent('0:55');
    });

    it('ends at 0:00 with the "Time\'s up!" cue and stops running', () => {
        const display = renderTimer();
        fireEvent.click(screen.getByRole('button', { name: '0:30' }));
        fireEvent.click(screen.getByRole('button', { name: 'Start' }));
        advance(30_000);

        expect(display).toHaveTextContent('0:00');
        expect(screen.getByText("Time's up!")).toBeInTheDocument();
        // Back to a Start button proves the countdown stopped.
        expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument();
    });

    it('Reset returns to the idle preset display', () => {
        const display = renderTimer();
        fireEvent.click(screen.getByRole('button', { name: 'Start' }));
        advance(3000);
        fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
        expect(display).toHaveTextContent('1:00');
        expect(screen.queryByText("Time's up!")).not.toBeInTheDocument();
    });

    it('renders in Spanish', () => {
        render(<RestTimer language="es" />);
        expect(screen.getByText(/Temporizador/)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Iniciar' })).toBeInTheDocument();
    });
});
