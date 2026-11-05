/**
 * Watches the Chatbase coach for a reply that carries a GYMPLAN block and
 * returns the latest one, so the app can offer to import it without the
 * user copying anything. Chatbase draws the chat in its own frame, so the
 * page cannot add a button inside it; its embed script does report every
 * assistant message to the page (window.chatbase.addEventListener).
 */

import { useEffect, useState } from 'react';
import { extractPlanBlock } from '../utils/planImport.js';
import { ensureChatbaseStub } from '../lib/chatbase.js';

const chatbase = () => (typeof window !== 'undefined' ? window.chatbase : undefined);

export const closeCoachChat = () => {
    try {
        chatbase()?.close?.();
    } catch {
        // Widget not loaded or blocked: the import modal still opens.
    }
};

export default function useCoachPlan() {
    const [plan, setPlan] = useState(null);

    useEffect(() => {
        // This effect runs before LegalGate asks for the widget. The stub
        // queues the call and the real widget replays it once loaded.
        ensureChatbaseStub();
        const api = chatbase();
        if (!api || typeof api.addEventListener !== 'function') return undefined;
        const onMessage = (event) => {
            const block = extractPlanBlock(event?.data?.content);
            if (block) setPlan(block);
        };
        const clearPlan = () => setPlan(null);
        window.addEventListener('gym:coach-session-cleared', clearPlan);
        try {
            api.addEventListener('assistant-message', onMessage);
        } catch {
            window.removeEventListener('gym:coach-session-cleared', clearPlan);
            return undefined;
        }
        return () => {
            window.removeEventListener('gym:coach-session-cleared', clearPlan);
            try {
                api.removeEventListener('assistant-message', onMessage);
            } catch {
                // Widget gone: nothing left to unregister.
            }
        };
    }, []);

    return { plan, dismiss: () => setPlan(null) };
}
