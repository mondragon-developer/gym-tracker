/**
 * Loader for the Chatbase assistant widget.
 *
 * The embed used to sit in index.html and ran for every visitor. It is
 * loaded from here so that nothing is requested from Chatbase until the
 * signed-in account has accepted the terms (LegalGate calls loadChatbase).
 */

const AGENT_ID = 'leN3dAU7gJn3-rufdfJO_';
const EMBED_SRC = 'https://www.chatbase.co/embed.min.js';

/**
 * Defines window.chatbase as a queue, the same stub Chatbase's own snippet
 * installs: calls made before embed.min.js arrives are stored and replayed
 * by the real widget. Makes no network request.
 */
export const ensureChatbaseStub = () => {
    if (typeof window === 'undefined' || window.chatbase) return;
    const queue = (...args) => {
        if (!queue.q) queue.q = [];
        queue.q.push(args);
    };
    window.chatbase = new Proxy(queue, {
        get(target, prop) {
            if (prop === 'q') return target.q;
            return (...args) => target(prop, ...args);
        }
    });
};

/**
 * Downloads and starts the widget once per page load.
 */
export const loadChatbase = () => {
    if (typeof document === 'undefined') return;
    ensureChatbaseStub();
    if (document.getElementById(AGENT_ID)) return;
    const script = document.createElement('script');
    script.src = EMBED_SRC;
    script.id = AGENT_ID;
    script.domain = 'www.chatbase.co';
    document.body.appendChild(script);
};
