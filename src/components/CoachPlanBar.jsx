/**
 * CoachPlanBar
 * Top bar that appears when the AI coach writes a plan in the chat: Import
 * opens the plan preview already filled in, Copy is the fallback for
 * pasting elsewhere. It sits above the Chatbase widget, which covers the
 * whole screen on phones, so it stays reachable while the chat is open.
 * In the trainer panel the bar names whose plan the import changes, and
 * with no client open it explains why Import is missing instead.
 */

import React, { useEffect, useState, useRef } from 'react';
import { t } from '../translations/ui';

// Chatbase puts its bubble and chat window at the top of the z-index range.
const ABOVE_CHAT = 2147483647;
const COPIED_MS = 2000;

const buttonStyle = (primary) => ({
    minHeight: '44px',
    padding: primary ? '10px 20px' : '8px 12px',
    borderRadius: primary ? '999px' : '8px',
    border: primary ? '2px solid var(--action-border)' : '1px solid var(--toast-text)',
    backgroundColor: primary ? 'var(--action)' : 'transparent',
    color: primary ? 'var(--on-action)' : 'var(--toast-text)',
    boxShadow: primary ? '0 0 0 3px rgba(34, 211, 238, 0.18)' : 'none',
    fontSize: primary ? '16px' : '14px',
    fontWeight: 700,
    cursor: 'pointer'
});

const CoachPlanBar = ({ plan, onImport, onDismiss, target = null, blockedHint = null, language = 'en' }) => {
    const [copied, setCopied] = useState(false);
    const barRef = useRef(null);

    useEffect(() => {
        if (!plan || !barRef.current) return undefined;
        const measure = () => document.documentElement.style.setProperty('--coach-bar-height', `${barRef.current.getBoundingClientRect().height + 24}px`);
        measure();
        const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null;
        observer?.observe(barRef.current);
        return () => {
            observer?.disconnect();
            document.documentElement.style.removeProperty('--coach-bar-height');
        };
    }, [plan]);

    useEffect(() => {
        setCopied(false);
    }, [plan]);

    useEffect(() => {
        if (!copied) return undefined;
        const id = setTimeout(() => setCopied(false), COPIED_MS);
        return () => clearTimeout(id);
    }, [copied]);

    if (!plan) return null;

    const copy = () => {
        if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') return;
        navigator.clipboard.writeText(plan).then(() => setCopied(true), () => {});
    };

    return (
        <div
            ref={barRef}
            role="region"
            aria-label={t('Plan from the coach', language)}
            data-testid="coach-plan-bar"
            style={{
                position: 'fixed',
                top: 'max(8px, env(safe-area-inset-top))',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: ABOVE_CHAT,
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px 10px',
                padding: '10px 12px',
                borderRadius: '12px',
                border: '1px solid var(--action-border)',
                backgroundColor: 'var(--toast-bg)',
                color: 'var(--toast-text)',
                boxShadow: '0 10px 30px var(--shadow-strong)',
                width: 'max-content',
                maxWidth: 'calc(100vw - 32px)'
            }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                <span role="status" aria-live="polite" style={{ fontSize: '14px', fontWeight: 600 }}>
                    {copied ? t('Plan copied.', language) : t('The coach wrote a plan.', language)}
                </span>
                {(blockedHint || target) && (
                    <span style={{ fontSize: '12px', opacity: 0.85, overflowWrap: 'anywhere' }}>
                        {blockedHint || target}
                    </span>
                )}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginLeft: 'auto' }}>
                {!blockedHint && (
                    <button type="button" onClick={() => onImport(plan)} style={buttonStyle(true)}>
                        {t('Import', language)}
                    </button>
                )}
                <button type="button" onClick={copy} style={buttonStyle(false)}>
                    {t('Copy', language)}
                </button>
                <button type="button" onClick={onDismiss} style={{ ...buttonStyle(false), border: 'none' }}>
                    {t('Close', language)}
                </button>
            </div>
        </div>
    );
};

export default CoachPlanBar;
