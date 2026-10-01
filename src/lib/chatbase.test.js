import { describe, it, expect, beforeEach } from 'vitest';
import { ensureChatbaseStub, loadChatbase } from './chatbase.js';

const embeds = () => document.querySelectorAll('script[src*="chatbase.co"]');

beforeEach(() => {
    embeds().forEach((script) => script.remove());
    delete window.chatbase;
});

describe('chatbase loader', () => {
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
