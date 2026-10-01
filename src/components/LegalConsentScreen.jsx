/**
 * LegalConsentScreen
 * Shown instead of the app until the signed-in account accepts the current
 * Terms of Use and Privacy Policy. Both boxes start unchecked and the
 * button stays off until both are ticked: agreement has to be an action
 * the person takes, not a default.
 */

import React, { useState } from 'react';
import Button from './ui/Button.jsx';
import { ButtonVariant } from './ui/Button.constants.js';
import LanguageToggle from './LanguageToggle.jsx';
import LegalLinks from './LegalLinks.jsx';
import { getConsentSummary } from '../legal/legalText.js';
import { t } from '../translations/ui';

const checkRowStyle = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    fontSize: '14px',
    lineHeight: 1.5,
    fontWeight: 600,
    color: 'var(--text)',
    cursor: 'pointer'
};

const checkboxStyle = { width: '20px', height: '20px', marginTop: '1px', flexShrink: 0 };

const LegalConsentScreen = ({ onAccept, onSignOut, language = 'en' }) => {
    const [agreeDocuments, setAgreeDocuments] = useState(false);
    const [agreeRisk, setAgreeRisk] = useState(false);
    const [state, setState] = useState('idle'); // idle | saving | failed
    const summary = getConsentSummary(language);

    const ready = agreeDocuments && agreeRisk;

    const handleAccept = async () => {
        if (!ready || state === 'saving') return;
        setState('saving');
        const saved = await onAccept();
        if (!saved) setState('failed');
    };

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: 'var(--bg-page)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '560px',
                backgroundColor: 'var(--surface)',
                borderRadius: '16px',
                boxShadow: '0 25px 50px -12px var(--shadow-strong)',
                overflow: 'hidden'
            }}>
                <div style={{
                    padding: '24px',
                    background: 'var(--header-bg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    flexWrap: 'wrap'
                }}>
                    <h1 style={{ margin: 0, color: 'white', fontSize: '22px', fontWeight: 700 }}>
                        {summary.title}
                    </h1>
                    <LanguageToggle />
                </div>

                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-2)' }}>{summary.intro}</p>

                    <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', lineHeight: 1.5, color: 'var(--text-2)' }}>
                        {summary.points.map((point) => (
                            <li key={point}>{point}</li>
                        ))}
                    </ul>

                    <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-2)' }}>
                        {t('Read the full documents:', language)}{' '}
                        <LegalLinks language={language} />
                    </p>

                    <label style={checkRowStyle}>
                        <input
                            type="checkbox"
                            checked={agreeDocuments}
                            onChange={(e) => setAgreeDocuments(e.target.checked)}
                            style={checkboxStyle}
                        />
                        <span>{summary.agreeDocuments}</span>
                    </label>

                    <label style={checkRowStyle}>
                        <input
                            type="checkbox"
                            checked={agreeRisk}
                            onChange={(e) => setAgreeRisk(e.target.checked)}
                            style={checkboxStyle}
                        />
                        <span>{summary.agreeRisk}</span>
                    </label>

                    {state === 'failed' && (
                        <p role="alert" style={{ margin: 0, fontSize: '14px', color: 'var(--danger)', fontWeight: 600 }}>
                            {t('Could not record your acceptance. Check your connection and try again.', language)}
                        </p>
                    )}

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <Button variant={ButtonVariant.PRIMARY} onClick={handleAccept} disabled={!ready || state === 'saving'}>
                            {state === 'saving' ? t('Saving...', language) : t('Agree and continue', language)}
                        </Button>
                        <Button variant={ButtonVariant.SECONDARY} onClick={onSignOut} disabled={state === 'saving'}>
                            {t('Sign Out', language)}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LegalConsentScreen;
