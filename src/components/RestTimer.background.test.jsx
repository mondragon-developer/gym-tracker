import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import RestTimer from './RestTimer.jsx';

const ENDS_AT_KEY = 'gymAppRestEndsAt';

const setVisibility = (state) => {
    Object.defineProperty(document, 'visibilityState', { value: state, configurable: true });
    act(() => { document.dispatchEvent(new Event('visibilitychange')); });
};

beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
});

afterEach(() => {
    delete document.visibilityState;
    delete window.Notification;
    delete navigator.serviceWorker;
    vi.useRealTimers();
});

describe('RestTimer in the background', () => {
    // A phone suspends timers on a hidden page: the clock moves on, the
    // interval does not fire.
    it('catches up from the clock when the page becomes visible again', () => {
        render(<RestTimer />);
        fireEvent.click(screen.getByRole('button', { name: 'Start' }));
        setVisibility('hidden');
        vi.setSystemTime(Date.now() + 40_000);
        setVisibility('visible');
        expect(screen.getByTestId('rest-time')).toHaveTextContent('0:20');
    });

    it('shows the alert as soon as the user returns after the rest ended', () => {
        render(<RestTimer />);
        fireEvent.click(screen.getByRole('button', { name: '0:30' }));
        fireEvent.click(screen.getByRole('button', { name: 'Start' }));
        setVisibility('hidden');
        vi.setSystemTime(Date.now() + 90_000);
        setVisibility('visible');
        expect(screen.getByTestId('rest-alert')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument();
    });

    it('sends a system notification when the rest ends while hidden', async () => {
        const showNotification = vi.fn(() => Promise.resolve());
        window.Notification = { permission: 'granted', requestPermission: vi.fn() };
        Object.defineProperty(navigator, 'serviceWorker', {
            value: { ready: Promise.resolve({ showNotification, getNotifications: () => Promise.resolve([]) }) },
            configurable: true
        });
        render(<RestTimer />);
        fireEvent.click(screen.getByRole('button', { name: '0:30' }));
        fireEvent.click(screen.getByRole('button', { name: 'Start' }));
        Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
        await act(async () => { vi.advanceTimersByTime(30_000); });
        expect(showNotification).toHaveBeenCalledTimes(1);
        expect(showNotification.mock.calls[0][0]).toBe("Let's go!");
        expect(showNotification.mock.calls[0][1]).toMatchObject({ tag: 'rest-timer', body: "Time's up!" });
    });

    it('does not notify when the rest ends with the app on screen', async () => {
        const showNotification = vi.fn(() => Promise.resolve());
        window.Notification = { permission: 'granted', requestPermission: vi.fn() };
        Object.defineProperty(navigator, 'serviceWorker', {
            value: { ready: Promise.resolve({ showNotification, getNotifications: () => Promise.resolve([]) }) },
            configurable: true
        });
        render(<RestTimer />);
        fireEvent.click(screen.getByRole('button', { name: '0:30' }));
        fireEvent.click(screen.getByRole('button', { name: 'Start' }));
        await act(async () => { vi.advanceTimersByTime(30_000); });
        expect(screen.getByTestId('rest-alert')).toBeInTheDocument();
        expect(showNotification).not.toHaveBeenCalled();
    });

    it('asks for notification permission on Start only while undecided', () => {
        const requestPermission = vi.fn(() => Promise.resolve('granted'));
        window.Notification = { permission: 'default', requestPermission };
        render(<RestTimer />);
        fireEvent.click(screen.getByRole('button', { name: 'Start' }));
        expect(requestPermission).toHaveBeenCalledTimes(1);

        window.Notification.permission = 'denied';
        fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
        fireEvent.click(screen.getByRole('button', { name: 'Start' }));
        expect(requestPermission).toHaveBeenCalledTimes(1);
    });

    it('does not ask on iPhone, where a page notification cannot fire in the background', () => {
        const requestPermission = vi.fn(() => Promise.resolve('granted'));
        window.Notification = { permission: 'default', requestPermission };
        Object.defineProperty(navigator, 'userAgent', {
            value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)',
            configurable: true
        });
        try {
            render(<RestTimer />);
            fireEvent.click(screen.getByRole('button', { name: 'Start' }));
            expect(requestPermission).not.toHaveBeenCalled();
        } finally {
            delete navigator.userAgent;
        }
    });
});

describe('RestTimer after the page was discarded', () => {
    it('resumes a running rest from its saved end time', () => {
        localStorage.setItem(ENDS_AT_KEY, String(Date.now() + 45_000));
        render(<RestTimer />);
        expect(screen.getByTestId('rest-time')).toHaveTextContent('0:45');
        expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
    });

    it('opens the alert for a rest that ended a moment ago', () => {
        localStorage.setItem(ENDS_AT_KEY, String(Date.now() - 20_000));
        render(<RestTimer />);
        expect(screen.getByTestId('rest-alert')).toBeInTheDocument();
        expect(localStorage.getItem(ENDS_AT_KEY)).toBeNull();
    });

    it('ignores a rest that ended long ago', () => {
        localStorage.setItem(ENDS_AT_KEY, String(Date.now() - 60 * 60 * 1000));
        render(<RestTimer />);
        expect(screen.queryByTestId('rest-alert')).toBeNull();
        expect(screen.getByTestId('rest-time')).toHaveTextContent('1:00');
        expect(localStorage.getItem(ENDS_AT_KEY)).toBeNull();
    });

    it('clears the saved end time on Pause and Reset', () => {
        render(<RestTimer />);
        fireEvent.click(screen.getByRole('button', { name: 'Start' }));
        expect(localStorage.getItem(ENDS_AT_KEY)).not.toBeNull();
        fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
        expect(localStorage.getItem(ENDS_AT_KEY)).toBeNull();
        fireEvent.click(screen.getByRole('button', { name: 'Start' }));
        fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
        expect(localStorage.getItem(ENDS_AT_KEY)).toBeNull();
    });
});
