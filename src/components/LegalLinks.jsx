/**
 * LegalLinks
 * "Terms of Use" and "Privacy Policy" links that open the full documents.
 * Used on the sign-in and sign-up pages, the consent screen and the
 * profile menu, so the documents can always be read again.
 */

import React, { useState, Suspense } from 'react';
import LazyFallback from './ui/LazyFallback.jsx';
import { t } from '../translations/ui';

const LegalModal = React.lazy(() => import('./LegalModal.jsx'));

const linkStyle = {
    background: 'none',
    border: 'none',
    padding: 0,
    color: 'var(--brand)',
    fontSize: 'inherit',
    fontWeight: 600,
    textDecoration: 'underline',
    cursor: 'pointer'
};

const LegalLinks = ({ language = 'en', style = {} }) => {
    const [openDoc, setOpenDoc] = useState(null);

    return (
        <span style={{ display: 'inline-flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', ...style }}>
            <button type="button" style={linkStyle} onClick={() => setOpenDoc('terms')}>
                {t('Terms of Use', language)}
            </button>
            <button type="button" style={linkStyle} onClick={() => setOpenDoc('privacy')}>
                {t('Privacy Policy', language)}
            </button>
            {openDoc && (
                <Suspense fallback={<LazyFallback language={language} />}>
                    <LegalModal
                        isOpen
                        onClose={() => setOpenDoc(null)}
                        initialDoc={openDoc}
                        language={language}
                    />
                </Suspense>
            )}
        </span>
    );
};

export default LegalLinks;
