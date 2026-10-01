/**
 * LegalModal
 * The full Terms of Use and Privacy Policy, one tab each. Read only: the
 * agreement itself happens on the consent screen (LegalConsentScreen).
 */

import React, { useState } from 'react';
import Modal from './ui/Modal.jsx';
import { getLegalDocument, LEGAL_DOCS } from '../legal/legalText.js';

const tabStyle = (active) => ({
    padding: '8px 14px',
    borderRadius: '8px',
    border: '1px solid var(--border-strong)',
    backgroundColor: active ? 'var(--brand)' : 'var(--surface)',
    color: active ? 'var(--on-brand)' : 'var(--text)',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer'
});

const LegalModal = ({ isOpen, onClose, initialDoc = 'terms', language = 'en' }) => {
    const [doc, setDoc] = useState(initialDoc);
    const content = getLegalDocument(doc, language);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={content.title} style={{ width: '680px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                {LEGAL_DOCS.map((id) => (
                    <button
                        key={id}
                        type="button"
                        aria-pressed={doc === id}
                        onClick={() => setDoc(id)}
                        style={tabStyle(doc === id)}
                    >
                        {getLegalDocument(id, language).title}
                    </button>
                ))}
            </div>
            <div style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-2)' }}>
                <p style={{ margin: '0 0 12px', color: 'var(--text-3)', fontSize: '13px' }}>{content.updated}</p>
                {content.sections.map((section) => (
                    <section key={section.heading}>
                        <h3 style={{ margin: '16px 0 6px', fontSize: '15px', color: 'var(--text)' }}>{section.heading}</h3>
                        {section.paragraphs.map((paragraph) => (
                            <p key={paragraph} style={{ margin: '0 0 10px' }}>{paragraph}</p>
                        ))}
                    </section>
                ))}
            </div>
        </Modal>
    );
};

export default LegalModal;
