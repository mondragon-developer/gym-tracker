/**
 * Rest Timer
 * Compact between-sets countdown for the gym floor: preset chips, start /
 * pause / reset, and a beep plus visual cue when the time is up.
 * Self-contained: no backend, no persistence. Mounted once above the day
 * list so it survives day-accordion toggles.
 */

import React, { useState, useEffect, useRef } from 'react';
import { t } from '../translations/ui';
import { formatSeconds } from '../utils/restTimer.js';

const PRESETS = [30, 60, 90, 120];
// Per-device custom text for the end-of-rest alert; empty means the default.
const MESSAGE_KEY = 'gymAppRestMessage';

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
    border: active ? '1px solid #0e7490' : '1px solid #e5e7eb',
    backgroundColor: active ? '#ecfeff' : 'white',
    color: active ? '#0e7490' : '#6b7280',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    fontVariantNumeric: 'tabular-nums'
});

const actionStyle = (primary) => ({
    padding: '6px 14px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: primary ? '#0e7490' : '#e5e7eb',
    color: primary ? 'white' : '#374151',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer'
});

export default function RestTimer({ language = 'en' }) {
    const [duration, setDuration] = useState(60);
    // remaining === null means idle: the display then shows the preset itself.
    const [remaining, setRemaining] = useState(null);
    const [running, setRunning] = useState(false);
    const audioRef = useRef(null);

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
        if (!running) return;
        const timer = setInterval(() => {
            setRemaining(r => (r > 0 ? r - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, [running]);

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

    // Zero is only reachable at the end of a countdown, so this fires the
    // end-of-rest cue exactly once.
    useEffect(() => {
        if (remaining === 0) {
            beep(audioRef);
            try {
                if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
                    navigator.vibrate([400, 150, 400, 150, 400]);
                }
            } catch {
                // Vibration unsupported or blocked: the overlay still shows.
            }
            setAlertOpen(true);
            setRunning(false);
        }
    }, [remaining]);

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
        setRemaining(r => (r === null || r === 0 ? duration : r));
        setRunning(true);
    };

    const reset = () => {
        setAlertOpen(false);
        setRunning(false);
        setRemaining(null);
    };

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
            border: done ? '1px solid #fecaca' : '1px solid #e5e7eb',
            borderRadius: '12px',
            backgroundColor: done ? '#fef2f2' : '#f8fafc'
        }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
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
                    color: done ? '#dc2626' : '#0e7490',
                    minWidth: '64px',
                    textAlign: 'center'
                }}
            >
                {formatSeconds(remaining === null ? duration : remaining)}
            </span>

            {done && (
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#dc2626' }}>
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
                        border: '1px solid #e5e7eb',
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
                    <div className="rest-alert-hint">{t('Tap to dismiss', language)}</div>
                </div>
            )}

            <div style={{ display: 'flex', gap: '6px', marginLeft: 'auto' }}>
                <button onClick={running ? () => setRunning(false) : start} style={actionStyle(true)}>
                    {running ? t('Pause', language) : t('Start', language)}
                </button>
                <button onClick={reset} style={actionStyle(false)}>
                    {t('Reset', language)}
                </button>
            </div>
        </div>
    );
}
