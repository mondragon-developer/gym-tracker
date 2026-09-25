/**
 * Rest Timer
 * Compact between-sets countdown for the gym floor: preset chips, start /
 * pause / reset, and a beep plus visual cue when the time is up.
 * The only backend call is the optional end-of-rest push (restPush.js).
 * Mounted once above the day list so it survives day-accordion toggles.
 */

import React, { useState, useEffect, useRef } from 'react';
import { t } from '../translations/ui';
import { formatSeconds } from '../utils/restTimer.js';
import { canUsePush, ensurePushSubscription, scheduleRestPush, cancelRestPush } from '../utils/restPush.js';

const PRESETS = [30, 60, 90, 120];
// Per-device custom text for the end-of-rest alert; empty means the default.
const MESSAGE_KEY = 'gymAppRestMessage';
// End time of a running rest, so a page the phone discarded while the user
// was in another app can pick the countdown (or the alert) back up.
const ENDS_AT_KEY = 'gymAppRestEndsAt';
// The server push scheduled for that rest ({ endsAt, id }), so Pause and
// Reset can still cancel it after a reload (a deploy reloads open pages).
const PUSH_KEY = 'gymAppRestPush';
// With the app on screen the alert is the cue, so the push is cancelled
// this long before the end: a cancel sent at zero loses the race with the
// server's send and the phone rings twice.
const EARLY_CANCEL_MS = 3000;
// A rest that ended longer ago than this is stale on reopen: no alert.
const LATE_ALERT_MS = 10 * 60 * 1000;
const NOTIFICATION_TAG = 'rest-timer';
const VIBRATION = [400, 150, 400, 150, 400];

const secondsLeft = (endsAt) => Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));

const readSavedPushId = (endsAt) => {
    try {
        const push = JSON.parse(localStorage.getItem(PUSH_KEY) || 'null');
        return push && push.endsAt === endsAt && typeof push.id === 'string' ? push.id : null;
    } catch {
        return null;
    }
};

const readSavedRest = () => {
    try {
        const endsAt = Number(localStorage.getItem(ENDS_AT_KEY));
        if (!endsAt) return null;
        const left = secondsLeft(endsAt);
        if (left > 0) return { endsAt, remaining: left, pushId: readSavedPushId(endsAt) };
        if (Date.now() - endsAt < LATE_ALERT_MS) return { endsAt: null, remaining: 0 };
    } catch {
        // Storage blocked: start idle.
    }
    return null;
};

const hasNotifications = () => typeof window !== 'undefined' && 'Notification' in window;

// iOS freezes a web app's scripts as soon as it leaves the screen, installed
// or not, so a notification raised by the page never fires there; the
// server push in restPush.js is what reaches it. iPadOS reports itself as a
// Mac with touch.
const isIOS = () => typeof navigator !== 'undefined' && (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
);

// For browsers without Web Push: the page notification still needs the
// permission. Asked from a tap; never on iOS, where only push can notify.
const askNotificationPermission = () => {
    try {
        if (hasNotifications() && !canUsePush() && !isIOS() && Notification.permission === 'default') {
            const pending = Notification.requestPermission();
            if (pending && typeof pending.catch === 'function') pending.catch(() => {});
        }
    } catch {
        // Blocked or unsupported: the in-app alert still works.
    }
};

// Pages cannot draw over other apps, so while the app is in the background
// the end of the rest is a system notification (sound and vibration follow
// the phone's notification settings). The full-screen alert is waiting when
// the user comes back or taps it (see public/rest-timer-sw.js).
const showRestNotification = (title, body) => {
    if (!hasNotifications() || Notification.permission !== 'granted') return;
    if (!navigator.serviceWorker) return;
    navigator.serviceWorker.ready.then(reg => reg.showNotification(title, {
        body,
        tag: NOTIFICATION_TAG,
        renotify: true,
        requireInteraction: true,
        vibrate: VIBRATION,
        icon: '/pwa-icon.jpeg'
    })).catch(() => {});
};

const closeRestNotification = () => {
    if (typeof navigator === 'undefined' || !navigator.serviceWorker) return;
    navigator.serviceWorker.ready
        .then(reg => reg.getNotifications({ tag: NOTIFICATION_TAG }))
        .then(list => list.forEach(n => n.close()))
        .catch(() => {});
};

const AudioCtx = typeof window !== 'undefined'
    ? (window.AudioContext || window.webkitAudioContext)
    : null;

// Browsers only let sound start from a user gesture, and the countdown ends
// outside of one. So the context is created and unlocked when the user
// presses Start (a silent buffer counts as playback on iOS), kept in a ref,
// and reused for the end-of-rest beep. Silently skipped where Web Audio is
// unavailable (jsdom) - the visual cue remains.
const unlockAudio = (ref) => {
    if (!AudioCtx) return;
    try {
        if (!ref.current) ref.current = new AudioCtx();
        const ctx = ref.current;
        if (ctx.state === 'suspended') ctx.resume().catch(() => {});
        const source = ctx.createBufferSource();
        source.buffer = ctx.createBuffer(1, 1, 22050);
        source.connect(ctx.destination);
        source.start(0);
    } catch {
        // Release a context we may have just created so a repeated failure
        // does not burn through the browser's per-page limit.
        const ctx = ref.current;
        ref.current = null;
        try {
            if (ctx && typeof ctx.close === 'function') ctx.close().catch(() => {});
        } catch {
            // Nothing left to release.
        }
    }
};

const beep = (ref) => {
    const ctx = ref.current;
    if (!ctx) return;
    const play = () => {
        [880, 1320].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = freq;
            const at = ctx.currentTime + i * 0.18;
            gain.gain.setValueAtTime(0.2, at);
            gain.gain.exponentialRampToValueAtTime(0.001, at + 0.16);
            osc.start(at);
            osc.stop(at + 0.18);
        });
    };
    try {
        if (ctx.state === 'suspended') {
            // The context may have been closed by unmount before resume
            // settles, so play() needs its own guard on this path too.
            ctx.resume().then(() => {
                try {
                    play();
                } catch {
                    // Visual cue still fires.
                }
            }, () => {});
        } else {
            play();
        }
    } catch {
        // Audio unavailable: the "Time's up!" visual cue still fires.
    }
};

const chipStyle = (active) => ({
    padding: '6px 10px',
    borderRadius: '8px',
    border: active ? '1px solid var(--brand-border)' : '1px solid var(--border)',
    backgroundColor: active ? 'var(--brand-soft)' : 'var(--surface)',
    color: active ? 'var(--brand)' : 'var(--text-3)',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    fontVariantNumeric: 'tabular-nums'
});

const actionStyle = (primary) => ({
    padding: '6px 14px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: primary ? 'var(--brand)' : 'var(--surface-3)',
    color: primary ? 'var(--on-brand)' : 'var(--text-2)',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer'
});

export default function RestTimer({ language = 'en' }) {
    const [duration, setDuration] = useState(60);
    const [saved] = useState(readSavedRest);
    // remaining === null means idle: the display then shows the preset itself.
    const [remaining, setRemaining] = useState(saved ? saved.remaining : null);
    // Set while counting down. The display is derived from the clock rather
    // than decremented per tick, because phones stop timers on a page in the
    // background and a decrementing count would resume where it froze.
    const [endsAt, setEndsAt] = useState(saved ? saved.endsAt : null);
    const running = endsAt !== null;
    const audioRef = useRef(null);

    // The pending server push for the current rest: { endsAt, id }. id stays
    // null until the server answers; a rest that changed meanwhile cancels
    // the late answer instead of keeping it.
    const pushRef = useRef(saved?.pushId ? { endsAt: saved.endsAt, id: saved.pushId } : null);

    const cancelPush = () => {
        if (pushRef.current?.id) cancelRestPush(pushRef.current.id);
        pushRef.current = null;
        try {
            localStorage.removeItem(PUSH_KEY);
        } catch {
            // Storage blocked: nothing was saved either.
        }
    };

    // armPush needs the alert text, defined further down; the countdown
    // effect reaches it through this ref.
    const armPushRef = useRef(null);

    // Browsers cap the number of live AudioContexts per page; release ours
    // when the timer unmounts (admin panel toggles, hot reload).
    useEffect(() => () => {
        const ctx = audioRef.current;
        audioRef.current = null;
        if (ctx && typeof ctx.close === 'function') {
            try {
                ctx.close().catch(() => {});
            } catch {
                // Already closed or unsupported: nothing to release.
            }
        }
    }, []);

    const done = remaining === 0;

    useEffect(() => {
        if (endsAt === null) return undefined;
        const sync = () => {
            setRemaining(secondsLeft(endsAt));
            if (document.visibilityState === 'visible' && pushRef.current?.id && endsAt - Date.now() <= EARLY_CANCEL_MS) {
                cancelPush();
            }
        };
        const timer = setInterval(sync, 250);
        const onVisible = () => {
            if (document.visibilityState === 'visible') {
                sync();
                return;
            }
            // Left the app during the last seconds, after the early cancel:
            // schedule the push again so the end still reaches the phone.
            if (!pushRef.current && endsAt - Date.now() > 0) armPushRef.current?.(endsAt, false);
        };
        document.addEventListener('visibilitychange', onVisible);
        window.addEventListener('pageshow', sync);
        window.addEventListener('focus', sync);
        return () => {
            clearInterval(timer);
            document.removeEventListener('visibilitychange', onVisible);
            window.removeEventListener('pageshow', sync);
            window.removeEventListener('focus', sync);
        };
    }, [endsAt]);

    useEffect(() => {
        try {
            if (endsAt === null) {
                localStorage.removeItem(ENDS_AT_KEY);
                localStorage.removeItem(PUSH_KEY);
            } else {
                localStorage.setItem(ENDS_AT_KEY, String(endsAt));
            }
        } catch {
            // Storage blocked: the countdown still runs, it just cannot
            // survive the page being discarded.
        }
    }, [endsAt]);

    const runFor = (seconds) => {
        setRemaining(seconds);
        setEndsAt(Date.now() + seconds * 1000);
    };

    // End-of-rest alert: a full-screen blinking overlay that stays until the
    // user taps it. Sound is best effort (phones on silent mute Web Audio),
    // so the overlay plus vibration is the cue that always works.
    const [alertOpen, setAlertOpen] = useState(false);
    const [customMessage, setCustomMessage] = useState(() => {
        try {
            return localStorage.getItem(MESSAGE_KEY) || '';
        } catch {
            return '';
        }
    });
    const [editingMessage, setEditingMessage] = useState(false);
    const alertMessage = customMessage.trim() || t("Let's go!", language);

    const saveMessage = (value) => {
        setCustomMessage(value);
        try {
            if (value.trim()) localStorage.setItem(MESSAGE_KEY, value);
            else localStorage.removeItem(MESSAGE_KEY);
        } catch {
            // Storage blocked: the message still applies this session.
        }
    };

    const dismissAlert = () => setAlertOpen(false);

    // The zero effect below runs only when remaining changes, so it reads
    // the current message and language through a ref.
    const notifyTextRef = useRef(null);
    notifyTextRef.current = { title: alertMessage, body: t("Time's up!", language) };

    useEffect(() => {
        if (!alertOpen) closeRestNotification();
    }, [alertOpen]);

    // Start and a logged set call this from the tap, where the permission
    // prompt is allowed. The re-arm on leaving the app is not a tap, so it
    // only proceeds with permission already granted.
    const armPush = (restEndsAt, fromTap = true) => {
        cancelPush();
        if (fromTap) askNotificationPermission();
        if (!canUsePush()) return;
        if (!fromTap && Notification.permission !== 'granted') return;
        const pending = { endsAt: restEndsAt, id: null };
        pushRef.current = pending;
        const { title, body } = notifyTextRef.current;
        ensurePushSubscription()
            .then(sub => scheduleRestPush(sub, restEndsAt, title, body))
            .then(id => {
                if (pushRef.current !== pending) {
                    cancelRestPush(id);
                    return;
                }
                pending.id = id;
                if (!id) return;
                try {
                    localStorage.setItem(PUSH_KEY, JSON.stringify({ endsAt: restEndsAt, id }));
                } catch {
                    // Storage blocked: cancel still works until a reload.
                }
            });
    };
    armPushRef.current = armPush;

    // Zero is only reachable at the end of a countdown, so this fires the
    // end-of-rest cue exactly once.
    useEffect(() => {
        if (remaining === 0) {
            beep(audioRef);
            try {
                if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
                    navigator.vibrate(VIBRATION);
                }
            } catch {
                // Vibration unsupported or blocked: the overlay still shows.
            }
            if (document.visibilityState === 'hidden') {
                // The server push is already on its way; a page notification
                // on top would ring twice.
                if (!pushRef.current?.id) {
                    const { title, body } = notifyTextRef.current;
                    showRestNotification(title, body);
                }
                pushRef.current = null;
                try {
                    localStorage.removeItem(PUSH_KEY);
                } catch {
                    // Storage blocked: nothing to clear.
                }
            } else {
                // On screen: the alert is the cue, drop the push if the
                // server has not sent it yet.
                cancelPush();
            }
            setAlertOpen(true);
            setEndsAt(null);
        }
    }, [remaining]);

    // Focus moves into the alert's dismiss button while it is open and goes
    // back to where it was when it closes, so keyboard and screen-reader
    // users land on the dialog instead of the timer underneath.
    const dismissRef = useRef(null);
    const previousFocusRef = useRef(null);
    useEffect(() => {
        if (alertOpen) {
            previousFocusRef.current = document.activeElement;
            dismissRef.current?.focus();
            return undefined;
        }
        const previous = previousFocusRef.current;
        previousFocusRef.current = null;
        if (previous && typeof previous.focus === 'function' && document.contains(previous)) {
            previous.focus();
        }
        return undefined;
    }, [alertOpen]);

    // Keyboard users dismiss with Enter, Space or Escape.
    useEffect(() => {
        if (!alertOpen) return undefined;
        const onKey = (e) => {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
                e.preventDefault();
                setAlertOpen(false);
            }
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [alertOpen]);

    const start = () => {
        unlockAudio(audioRef);
        setAlertOpen(false);
        const seconds = remaining === null || remaining === 0 ? duration : remaining;
        runFor(seconds);
        armPush(Date.now() + seconds * 1000);
    };

    const pause = () => {
        cancelPush();
        if (endsAt !== null) setRemaining(secondsLeft(endsAt));
        setEndsAt(null);
    };

    const reset = () => {
        cancelPush();
        setAlertOpen(false);
        setEndsAt(null);
        setRemaining(null);
    };

    // Logging a set anywhere on the page starts the rest with the current
    // preset (see ExerciseItem). Re-registered when the preset changes so
    // the handler sees the latest duration.
    useEffect(() => {
        const onRestStart = () => {
            setAlertOpen(false);
            unlockAudio(audioRef);
            const restEndsAt = Date.now() + duration * 1000;
            setRemaining(duration);
            setEndsAt(restEndsAt);
            armPush(restEndsAt);
        };
        window.addEventListener('gym:rest-start', onRestStart);
        return () => window.removeEventListener('gym:rest-start', onRestStart);
        // armPush only touches refs and module functions.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [duration]);

    const pickPreset = (seconds) => {
        setDuration(seconds);
        if (!running) setRemaining(null);
    };

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap',
            padding: '10px 14px',
            border: done ? '1px solid var(--danger-border)' : '1px solid var(--border)',
            borderRadius: '12px',
            backgroundColor: done ? 'var(--danger-soft)' : 'var(--surface-2)'
        }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-2)' }}>
                ⏱️ {t('Rest timer', language)}
            </span>

            <div style={{ display: 'flex', gap: '6px' }}>
                {PRESETS.map(seconds => (
                    <button
                        key={seconds}
                        onClick={() => pickPreset(seconds)}
                        style={chipStyle(duration === seconds && remaining === null)}
                        aria-pressed={duration === seconds && remaining === null}
                    >
                        {formatSeconds(seconds)}
                    </button>
                ))}
            </div>

            <span
                data-testid="rest-time"
                style={{
                    fontVariantNumeric: 'tabular-nums',
                    fontSize: '22px',
                    fontWeight: 700,
                    color: done ? 'var(--danger)' : 'var(--brand)',
                    minWidth: '64px',
                    textAlign: 'center'
                }}
            >
                {formatSeconds(remaining === null ? duration : remaining)}
            </span>

            {done && (
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--danger)' }}>
                    {t("Time's up!", language)}
                </span>
            )}

            <button
                type="button"
                onClick={() => setEditingMessage(v => !v)}
                aria-expanded={editingMessage}
                aria-label={t('End-of-rest message', language)}
                title={t('End-of-rest message', language)}
                style={{ ...chipStyle(editingMessage), padding: '6px 8px' }}
            >
                {t('Message', language)}
            </button>
            {editingMessage && (
                <input
                    type="text"
                    value={customMessage}
                    onChange={(e) => saveMessage(e.target.value)}
                    placeholder={t("Let's go!", language)}
                    maxLength={40}
                    aria-label={t('End-of-rest message', language)}
                    style={{
                        flex: '1 1 140px',
                        minWidth: 0,
                        padding: '6px 10px',
                        border: '1px solid var(--border-strong)',
                        borderRadius: '8px',
                        fontSize: '13px'
                    }}
                />
            )}

            {alertOpen && (
                <div
                    className="rest-alert"
                    role="alertdialog"
                    aria-live="assertive"
                    aria-label={alertMessage}
                    data-testid="rest-alert"
                    onClick={dismissAlert}
                >
                    <div className="rest-alert-text">{alertMessage}</div>
                    <button
                        ref={dismissRef}
                        type="button"
                        className="rest-alert-button"
                        onClick={dismissAlert}
                    >
                        {t('Tap to dismiss', language)}
                    </button>
                </div>
            )}

            <div style={{ display: 'flex', gap: '6px', marginLeft: 'auto' }}>
                <button onClick={running ? pause : start} style={actionStyle(true)}>
                    {running ? t('Pause', language) : t('Start', language)}
                </button>
                <button onClick={reset} style={actionStyle(false)}>
                    {t('Reset', language)}
                </button>
            </div>
        </div>
    );
}
