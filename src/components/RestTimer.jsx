/**
 * Rest Timer
 * Compact between-sets countdown for the gym floor: preset chips, start /
 * pause / reset, and a beep plus visual cue when the time is up.
 * Self-contained: no backend, no persistence. Mounted once above the day
 * list so it survives day-accordion toggles.
 */

import React, { useState, useEffect } from 'react';
import { t } from '../translations/ui';
import { formatSeconds } from '../utils/restTimer.js';

const PRESETS = [30, 60, 90, 120];

// Short two-tone beep via Web Audio. Silently skipped where audio is
// unavailable (jsdom, autoplay-restricted contexts) - the visual cue remains.
const beep = () => {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    try {
        const ctx = new Ctx();
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

    const done = remaining === 0;

    useEffect(() => {
        if (!running) return;
        const timer = setInterval(() => {
            setRemaining(r => (r > 0 ? r - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, [running]);

    // Zero is only reachable at the end of a countdown, so this fires the
    // end-of-rest cue exactly once.
    useEffect(() => {
        if (remaining === 0) {
            beep();
            setRunning(false);
        }
    }, [remaining]);

    const start = () => {
        setRemaining(r => (r === null || r === 0 ? duration : r));
        setRunning(true);
    };

    const reset = () => {
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
