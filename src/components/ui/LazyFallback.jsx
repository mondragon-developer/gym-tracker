/**
 * Visible placeholder for code-split pieces while their chunk loads.
 */

import React from 'react';
import { t } from '../../translations/ui';

const LazyFallback = ({ language = 'en' }) => (
    <div style={{
        position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
        padding: '8px 14px', borderRadius: '10px', backgroundColor: 'var(--action)',
        color: 'var(--on-action)', fontSize: '13px', fontWeight: 600, zIndex: 1000
    }}>
        {t('Loading...', language)}
    </div>
);

export default LazyFallback;
