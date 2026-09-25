/**
 * CoachPlanBar
 * Top bar that appears when the AI coach writes a plan in the chat: Import
 * opens the plan preview already filled in, Copy is the fallback for
 * pasting elsewhere. It sits above the Chatbase widget, which covers the
 * whole screen on phones, so it stays reachable while the chat is open.
 */

import React, { useEffect, useState } from 'react';
import { t } from '../translations/ui';

// Chatbase puts its bubble and chat window at the top of the z-index range.
const ABOVE_CHAT = 2147483647;
const COPIED_MS = 2000;

const buttonStyle = (primary) => ({
    minHeight: '32px',
    padding: '6px 12px',
    borderRadius: '8px',
    border: primary ? 'none' : '1px solid var(--toast-text)',
    backgroundColor: primary ? 'var(--brand)' : 'transparent',
    color: primary ? 'var(--on-brand)' : 'var(--toast-text)',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer'
});

const CoachPlanBar = ({ plan, onImport, onDismiss, language = 'en' }) => {
    const [copied, setCopied] = useState(false);

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
                backgroundColor: 'var(--toast-bg)',
                color: 'var(--toast-text)',
                boxShadow: '0 10px 30px var(--shadow-strong)',
                width: 'max-content',
                maxWidth: 'calc(100vw - 32px)'
            }}
        >
            <span role="status" aria-live="polite" style={{ fontSize: '14px', fontWeight: 600 }}>
                {copied ? t('Plan copied.', language) : t('The coach wrote a plan.', language)}
            </span>
            <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                <button type="button" onClick={() => onImport(plan)} style={buttonStyle(true)}>
                    {t('Import', language)}
                </button>
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
