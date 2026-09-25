import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';

const push = vi.hoisted(() => ({
    canUsePush: vi.fn(() => true),
    ensurePushSubscription: vi.fn(),
    scheduleRestPush: vi.fn(),
    cancelRestPush: vi.fn()
}));
vi.mock('../utils/restPush.js', () => push);

import RestTimer from './RestTimer.jsx';

const flush = () => act(async () => { await Promise.resolve(); await Promise.resolve(); });

beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    push.canUsePush.mockReturnValue(true);
    push.ensurePushSubscription.mockReset().mockResolvedValue({ endpoint: 'https://web.push.apple.com/x' });
    push.scheduleRestPush.mockReset().mockResolvedValue('push-1');
    push.cancelRestPush.mockReset();
});

afterEach(() => {
    delete document.visibilityState;
    delete window.Notification;
    delete navigator.serviceWorker;
    vi.useRealTimers();
});

const startThirty = async () => {
    fireEvent.click(screen.getByRole('button', { name: '0:30' }));
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    await flush();
};

describe('RestTimer server push', () => {
    it('schedules a push for the end of the rest with the alert text', async () => {
        render(<RestTimer />);
        const before = Date.now();
        await startThirty();
        expect(push.scheduleRestPush).toHaveBeenCalledTimes(1);
        const [sub, endsAt, title, body] = push.scheduleRestPush.mock.calls[0];
        expect(sub.endpoint).toContain('push.apple.com');
        expect(endsAt).toBe(before + 30_000);
        expect(title).toBe("Let's go!");
        expect(body).toBe("Time's up!");
    });

    it('cancels the push on Pause and on Reset', async () => {
        render(<RestTimer />);
        await startThirty();
        fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
        expect(push.cancelRestPush).toHaveBeenCalledWith('push-1');

        fireEvent.click(screen.getByRole('button', { name: 'Start' }));
        await flush();
        fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
        expect(push.cancelRestPush).toHaveBeenCalledTimes(2);
    });

    it('replaces the push when a set is logged mid-rest', async () => {
        render(<RestTimer />);
        await startThirty();
        await act(async () => { window.dispatchEvent(new CustomEvent('gym:rest-start')); });
        await flush();
        expect(push.cancelRestPush).toHaveBeenCalledWith('push-1');
        expect(push.scheduleRestPush).toHaveBeenCalledTimes(2);
    });

    it('keeps the push and skips the page notification when the rest ends in the background', async () => {
        const showNotification = vi.fn(() => Promise.resolve());
        window.Notification = { permission: 'granted', requestPermission: vi.fn() };
        Object.defineProperty(navigator, 'serviceWorker', {
            value: { ready: Promise.resolve({ showNotification, getNotifications: () => Promise.resolve([]) }) },
            configurable: true
        });
        render(<RestTimer />);
        await startThirty();
        Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
        await act(async () => { vi.advanceTimersByTime(30_000); });
        expect(push.cancelRestPush).not.toHaveBeenCalled();
        expect(showNotification).not.toHaveBeenCalled();
    });

    it('drops the push when the rest ends with the app on screen', async () => {
        render(<RestTimer />);
        await startThirty();
        await act(async () => { vi.advanceTimersByTime(30_000); });
        expect(screen.getByTestId('rest-alert')).toBeInTheDocument();
        expect(push.cancelRestPush).toHaveBeenCalledWith('push-1');
    });

    it('cancels a late answer that arrives after the rest was reset', async () => {
        let answer;
        push.scheduleRestPush.mockReturnValue(new Promise(resolve => { answer = resolve; }));
        render(<RestTimer />);
        await startThirty();
        fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
        await act(async () => { answer('late-1'); });
        await flush();
        expect(push.cancelRestPush).toHaveBeenCalledWith('late-1');
    });

    it('does nothing with push where the browser cannot use it', async () => {
        push.canUsePush.mockReturnValue(false);
        render(<RestTimer />);
        await startThirty();
        expect(push.ensurePushSubscription).not.toHaveBeenCalled();
        expect(push.scheduleRestPush).not.toHaveBeenCalled();
    });
});
