import React from 'react';
import { useUnits } from '../hooks/useUnits.js';
import { useLanguage } from '../hooks/useLanguage.js';
import { t } from '../translations/ui';

/**
 * Units Toggle Component
 * Header button that switches the weight unit between lbs and kg.
 * Mirrors the LanguageToggle visual style.
 */
const UnitsToggle = () => {
    const { unit, toggleUnit } = useUnits();
    const { language } = useLanguage();

    return (
        <button
            onClick={toggleUnit}
            style={{
                padding: '8px 16px',
                background: 'rgba(255, 255, 255, 0.2)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '20px',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(10px)',
                margin: '0 auto'
            }}
            onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                e.currentTarget.style.transform = 'scale(1)';
            }}
            title={t('Switch weight unit', language)}
        >
            <span>
                {unit === 'lbs' ? 'lbs ↔ kg' : 'kg ↔ lbs'}
            </span>
        </button>
    );
};

export default UnitsToggle;
