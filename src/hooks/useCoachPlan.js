/**
 * Watches the Chatbase coach for a reply that carries a GYMPLAN block and
 * returns the latest one, so the app can offer to import it without the
 * user copying anything. Chatbase draws the chat in its own frame, so the
 * page cannot add a button inside it; its embed script does report every
 * assistant message to the page (window.chatbase.addEventListener).
 */

import { useEffect, useState } from 'react';
import { extractPlanBlock } from '../utils/planImport.js';

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
        const api = chatbase();
        // Before embed.min.js loads, index.html's stub queues these calls
        // and the real widget replays them, so registering early is safe.
        if (!api || typeof api.addEventListener !== 'function') return undefined;
        const onMessage = (event) => {
            const block = extractPlanBlock(event?.data?.content);
            if (block) setPlan(block);
        };
        try {
            api.addEventListener('assistant-message', onMessage);
        } catch {
            return undefined;
        }
        return () => {
            try {
                api.removeEventListener('assistant-message', onMessage);
            } catch {
                // Widget gone: nothing left to unregister.
            }
        };
    }, []);

    return { plan, dismiss: () => setPlan(null) };
}
