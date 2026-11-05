import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ensureChatbaseStub, loadChatbase, clearCoachSession, configureCoach, coachOptions } from './chatbase.js';

const embeds = () => document.querySelectorAll('script[src*="chatbase.co"]');

beforeEach(() => {
    embeds().forEach((script) => script.remove());
    delete window.chatbase;
});

describe('chatbase loader', () => {
    it('clears identity and conversation even if closing the widget throws', () => {
        window.chatbase = { close: vi.fn(() => { throw new Error('blocked'); }), resetUser: vi.fn(), resetChat: vi.fn() };
        const clear = vi.fn();
        window.addEventListener('gym:coach-session-cleared', clear);
        clearCoachSession();
        expect(window.chatbase.resetUser).toHaveBeenCalledOnce();
        expect(window.chatbase.resetChat).toHaveBeenCalledOnce();
        expect(clear).toHaveBeenCalledOnce();
        window.removeEventListener('gym:coach-session-cleared', clear);
    });
    it('sets bilingual guidance without submitting a paid chat message', () => {
        ensureChatbaseStub();
        configureCoach('es');
        expect(window.chatbase.q).toEqual([['setOptions', coachOptions('es')]]);
        expect(coachOptions('en').suggestedMessages).toContain('Create a workout');
        expect(embeds()).toHaveLength(0);
    });
    it('requests nothing until loadChatbase is called', () => {
        ensureChatbaseStub();
        expect(embeds()).toHaveLength(0);
    });

    it('queues calls made before the widget arrives', () => {
        ensureChatbaseStub();
        const onMessage = () => {};
        window.chatbase.addEventListener('assistant-message', onMessage);
        window.chatbase('getState');
        expect(window.chatbase.q).toEqual([
            ['addEventListener', 'assistant-message', onMessage],
            ['getState']
        ]);
    });

    it('leaves a widget that is already there alone', () => {
        const real = { addEventListener: () => {} };
        window.chatbase = real;
        ensureChatbaseStub();
        expect(window.chatbase).toBe(real);
    });

    it('adds the embed script once, however often it is called', () => {
        loadChatbase();
        loadChatbase();
        expect(embeds()).toHaveLength(1);
        expect(embeds()[0].id).not.toBe('');
        expect(typeof window.chatbase).toBe('function');
    });
});
