/**
 * Loader for the Chatbase assistant widget.
 *
 * The embed used to sit in index.html and ran for every visitor. It is
 * loaded from here so that nothing is requested from Chatbase until the
 * signed-in account has accepted the terms (LegalGate calls loadChatbase).
 */

const AGENT_ID = 'leN3dAU7gJn3-rufdfJO_';
const EMBED_SRC = 'https://www.chatbase.co/embed.min.js';

// These are display settings, not prompts sent to a model. Opening the
// widget does not spend a message credit or send account/workout information.
export const coachOptions = (language = 'en') => language === 'es' ? {
    initialMessages: ['Para crear una rutina, escribe "Créame un entrenamiento" o "Genera dos ejercicios de piernas para el miércoles". Toca Importar para revisar el plan, omitir días y editarlo antes de aplicarlo.'],
    suggestedMessages: ['Crear un entrenamiento', 'Planificar mi semana', 'Dos ejercicios de piernas para el miércoles', 'Cómo importar y editar un plan'],
    messagePlaceholder: 'Crea una rutina o pregunta por un ejercicio',
} : {
    initialMessages: ['To create a workout, say "Create me a workout" or "Generate two leg exercises for Wednesday". Tap Import to review the plan, skip days and edit it before applying.'],
    suggestedMessages: ['Create a workout', 'Plan my week', 'Two leg exercises for Wednesday', 'How to import and edit a plan'],
    messagePlaceholder: 'Create a workout or ask about an exercise',
};

export const configureCoach = (language) => {
    if (typeof window === 'undefined') return;
    try { window.chatbase?.setOptions?.(coachOptions(language)); } catch { /* Manual import stays available. */ }
};

export const clearCoachSession = () => {
    if (typeof window === 'undefined') return;
    // Keep each operation independent: a widget failure must never block logout.
    for (const method of ['close', 'resetUser', 'resetChat']) {
        try { window.chatbase?.[method]?.(); } catch { /* Widget unavailable. */ }
    }
    window.dispatchEvent(new Event('gym:coach-session-cleared'));
};

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
    // Start a fresh anonymous chat on each app load, including after a shared
    // browser was used by another account. This is not verified Chatbase identity.
    clearCoachSession();
    const script = document.createElement('script');
    script.src = EMBED_SRC;
    script.id = AGENT_ID;
    script.domain = 'www.chatbase.co';
    document.body.appendChild(script);
};
