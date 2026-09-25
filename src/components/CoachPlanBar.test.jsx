import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act, renderHook } from '@testing-library/react';
import CoachPlanBar from './CoachPlanBar.jsx';
import useCoachPlan from '../hooks/useCoachPlan.js';

const PLAN = 'GYMPLAN v1\nMonday: Chest\n- Barbell Bench Press 4x8';

// Stands in for the Chatbase embed: keeps listeners so a test can play an
// assistant reply.
const fakeChatbase = () => {
    const listeners = {};
    return {
        addEventListener: vi.fn((name, fn) => { listeners[name] = fn; }),
        removeEventListener: vi.fn((name) => { delete listeners[name]; }),
        close: vi.fn(),
        reply: (content) => listeners['assistant-message']?.({ type: 'assistant-message', data: { content } })
    };
};

afterEach(() => {
    delete window.chatbase;
});

describe('useCoachPlan', () => {
    it('picks up a plan from a coach reply and ignores other replies', () => {
        const chat = fakeChatbase();
        window.chatbase = chat;
        const { result } = renderHook(() => useCoachPlan());
        expect(chat.addEventListener).toHaveBeenCalledWith('assistant-message', expect.any(Function));

        act(() => chat.reply('Rest 90 seconds between sets.'));
        expect(result.current.plan).toBeNull();

        act(() => chat.reply(`Here you go:\n\`\`\`\n${PLAN}\n\`\`\``));
        expect(result.current.plan).toBe(PLAN);

        act(() => result.current.dismiss());
        expect(result.current.plan).toBeNull();
    });

    it('unregisters on unmount', () => {
        const chat = fakeChatbase();
        window.chatbase = chat;
        const { unmount } = renderHook(() => useCoachPlan());
        unmount();
        expect(chat.removeEventListener).toHaveBeenCalledWith('assistant-message', chat.addEventListener.mock.calls[0][1]);
    });

    it('does nothing when the chat widget is not on the page', () => {
        const { result } = renderHook(() => useCoachPlan());
        expect(result.current.plan).toBeNull();
    });
});

describe('CoachPlanBar', () => {
    it('renders nothing without a plan', () => {
        render(<CoachPlanBar plan={null} onImport={vi.fn()} onDismiss={vi.fn()} />);
        expect(screen.queryByTestId('coach-plan-bar')).toBeNull();
    });

    it('imports and closes', () => {
        const onImport = vi.fn();
        const onDismiss = vi.fn();
        render(<CoachPlanBar plan={PLAN} onImport={onImport} onDismiss={onDismiss} />);
        fireEvent.click(screen.getByRole('button', { name: 'Import' }));
        expect(onImport).toHaveBeenCalledWith(PLAN);
        fireEvent.click(screen.getByRole('button', { name: 'Close' }));
        expect(onDismiss).toHaveBeenCalled();
    });

    it('copies the plan and says so', async () => {
        const writeText = vi.fn(() => Promise.resolve());
        Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
        try {
            render(<CoachPlanBar plan={PLAN} onImport={vi.fn()} onDismiss={vi.fn()} />);
            await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Copy' })); });
            expect(writeText).toHaveBeenCalledWith(PLAN);
            expect(screen.getByText('Plan copied.')).toBeInTheDocument();
        } finally {
            delete navigator.clipboard;
        }
    });

    it('renders in Spanish', () => {
        render(<CoachPlanBar plan={PLAN} onImport={vi.fn()} onDismiss={vi.fn()} language="es" />);
        expect(screen.getByText('El coach escribió un plan.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Importar' })).toBeInTheDocument();
    });
});
