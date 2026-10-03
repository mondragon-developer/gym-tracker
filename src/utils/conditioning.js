import { formatSeconds } from './restTimer.js';
export const CONDITIONING_MODES = ['standard', 'emom', 'amrap', 'forTime'];
const integer = (value, fallback, min, max) => Number.isFinite(Number(value)) ? Math.max(min, Math.min(max, Math.floor(Number(value)))) : fallback;
export function conditioningConfig(raw) {
    return {
        mode: CONDITIONING_MODES.includes(raw?.mode) ? raw.mode : 'standard',
        minutes: integer(raw?.minutes ?? 12, 12, 1, 120),
        targetRounds: integer(raw?.targetRounds ?? 3, 3, 1, 100)
    };
}
export function conditioningClock(raw, now = Date.now()) {
    const config = conditioningConfig(raw);
    const session = raw?.session;
    const cap = config.minutes * 60000;
    const saved = integer(session?.elapsedMs ?? 0, 0, 0, cap);
    const running = session?.status === 'running' && Number.isFinite(session.startedAt);
    const elapsedMs = Math.min(cap, saved + (running ? Math.max(0, now - session.startedAt) : 0));
    return { elapsedMs, remainingMs: cap - elapsedMs, expired: elapsedMs >= cap, running: running && elapsedMs < cap, interval: Math.min(config.minutes, Math.floor(elapsedMs / 60000) + 1) };
}
export function conditioningAction(raw, action, now = Date.now()) {
    const config = conditioningConfig(raw);
    const clock = conditioningClock(raw, now);
    const session = raw?.session;
    if (config.mode === 'standard') return config;
    if (action === 'reset') return { ...config, session: null };
    if (action === 'start' && !session) return { ...config, session: { status: 'running', startedAt: now, elapsedMs: 0, rounds: 0, extraReps: 0 } };
    if (!session || session.status === 'finished') return raw;
    const next = { ...session, elapsedMs: clock.elapsedMs, startedAt: clock.running ? now : null };
    if (action === 'pause') { next.status = 'paused'; next.startedAt = null; }
    if (action === 'resume' && !clock.expired) { next.status = 'running'; next.startedAt = now; }
    if (action === 'round' && ((clock.expired && config.mode !== 'forTime') || clock.running)) next.rounds = Math.min(config.mode === 'emom' ? clock.interval : config.mode === 'forTime' ? config.targetRounds : 999, integer(session.rounds || 0, 0, 0, 999) + 1);
    if (action === 'round' && config.mode === 'forTime' && next.rounds >= config.targetRounds && !clock.expired) {
        next.status = 'finished'; next.startedAt = null; next.finishedAt = now; next.outcome = 'completed';
    }
    if (action === 'removeRound') next.rounds = Math.max(0, (session.rounds || 0) - 1);
    if (action === 'finish') {
        next.status = 'finished'; next.startedAt = null; next.finishedAt = now;
        next.outcome = config.mode === 'forTime'
            ? (next.rounds >= config.targetRounds ? 'completed' : clock.expired ? 'time-cap' : 'stopped')
            : (clock.expired ? 'completed' : 'stopped');
    }
    return { ...config, session: next };
}
export function conditioningScore(raw, language = 'en') {
    const session = raw?.session;
    if (!session || session.status !== 'finished') return '';
    const es = language === 'es';
    const clock = conditioningClock(raw);
    const count = `${session.rounds || 0} ${raw.mode === 'emom' ? (es ? 'intervalos' : 'intervals') : (es ? 'rondas' : 'rounds')}`;
    const extra = raw.mode === 'amrap' ? ` + ${session.extraReps || 0} reps` : '';
    const outcome = session.outcome === 'time-cap' ? (es ? 'Límite de tiempo' : 'Time cap') : session.outcome === 'stopped' ? (es ? 'Finalizado antes del objetivo' : 'Stopped before target') : (es ? 'Completado' : 'Completed');
    return `${outcome} · ${formatSeconds(clock.elapsedMs / 1000)} · ${count}${extra}`;
}
